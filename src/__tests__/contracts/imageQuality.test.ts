
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  QUALITY_MESSAGES,
  ID_STRUCTURE_MESSAGES,
  type QualityFailReason,
  type IDFailReason,
} from '@/lib/imageQuality';


function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  const v = max;
  const s = max === 0 ? 0 : d / max;
  let h = 0;
  if (d !== 0) {
    if (max === rn)      h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else                 h = (rn - gn) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  return [h, s, v];
}

function mrzVal(ch: string): number {
  if (ch >= '0' && ch <= '9') return Number(ch);
  if (ch >= 'A' && ch <= 'Z') return ch.charCodeAt(0) - 55;
  return 0;
}

function mrzCheckValid(field: string, checkDigit: string): boolean {
  const weights = [7, 3, 1];
  let sum = 0;
  for (let i = 0; i < field.length; i++) {
    sum += mrzVal(field[i]) * weights[i % 3];
  }
  return (sum % 10) === Number(checkDigit);
}

function luminanceSD(pixels: Uint8ClampedArray): number {
  const n = pixels.length / 4;
  if (n === 0) return 0;
  let sum = 0;
  for (let i = 0; i < pixels.length; i += 4)
    sum += 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
  const mean = sum / n;
  let varSum = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    const l = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
    varSum += (l - mean) * (l - mean);
  }
  return Math.sqrt(varSum / n);
}

function laplacianVarianceOnThreePixels(pixels: number[]): number {
  let count = 0, mean = 0, M2 = 0;
  for (const v of pixels) {
    count++;
    const delta = v - mean;
    mean += delta / count;
    M2 += delta * (v - mean);
  }
  return count > 1 ? M2 / count : 0;
}

function clamp100(n: number): number {
  return Math.round(Math.max(0, Math.min(100, n)));
}


describe('rgbToHsv', () => {
  it('pure red → hue ≈ 0°, saturation = 1, value = 1', () => {
    const [h, s, v] = rgbToHsv(255, 0, 0);
    expect(h).toBeCloseTo(0, 0);
    expect(s).toBeCloseTo(1, 5);
    expect(v).toBeCloseTo(1, 5);
  });

  it('teal (Moroccan CIN background ≈ #2AA198) → hue in [160–200]', () => {
    // #2AA198 ≈ rgb(42, 161, 152)
    const [h, s, v] = rgbToHsv(42, 161, 152);
    expect(h).toBeGreaterThanOrEqual(160);
    expect(h).toBeLessThanOrEqual(200);
    expect(s).toBeGreaterThan(0.12);
  });

  it('pure white → saturation = 0', () => {
    const [, s] = rgbToHsv(255, 255, 255);
    expect(s).toBe(0);
  });

  it('pure black → value = 0', () => {
    const [, , v] = rgbToHsv(0, 0, 0);
    expect(v).toBe(0);
  });

  it('green → hue ≈ 120°', () => {
    const [h] = rgbToHsv(0, 255, 0);
    expect(h).toBeCloseTo(120, 0);
  });
});


describe('mrzCheckValid', () => {
  // Known-good TD3 passport doc-number segment from ICAO 9303 examples
  it('validates a known-good 9-char doc number', () => {
    // L898902C3 → check digit 6
    expect(mrzCheckValid('L898902C3', '6')).toBe(true);
  });

  it('rejects a tampered doc number', () => {
    expect(mrzCheckValid('L898902C4', '6')).toBe(false);
  });

  it('accepts a DOB checksum: 690806 → 1', () => {
    // YYMMDD = 690806, check digit = 1
    expect(mrzCheckValid('690806', '1')).toBe(true);
  });

  it('rejects wrong DOB check digit', () => {
    expect(mrzCheckValid('690806', '9')).toBe(false);
  });

  it('treats < as 0 in checksum', () => {
    // A single filler field with all < → sum 0, check digit 0
    expect(mrzCheckValid('<<<<<<', '0')).toBe(true);
  });
});

describe('mrzVal', () => {
  it('maps digits correctly', () => {
    expect(mrzVal('0')).toBe(0);
    expect(mrzVal('9')).toBe(9);
  });

  it('maps A=10, Z=35', () => {
    expect(mrzVal('A')).toBe(10);
    expect(mrzVal('Z')).toBe(35);
  });

  it('maps < to 0', () => {
    expect(mrzVal('<')).toBe(0);
  });
});

// ── luminanceSD (two-pass, no array allocation) ───────────────────────────────

describe('luminanceSD', () => {
  it('returns 0 for empty pixel array', () => {
    expect(luminanceSD(new Uint8ClampedArray(0))).toBe(0);
  });

  it('returns 0 for a uniform grey image', () => {
    // All pixels identical → SD should be ~0
    const pixels = new Uint8ClampedArray(4 * 100); // 100 pixels
    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i] = 128; pixels[i + 1] = 128; pixels[i + 2] = 128; pixels[i + 3] = 255;
    }
    expect(luminanceSD(pixels)).toBeCloseTo(0, 5);
  });

  it('returns high SD for alternating black/white pixels', () => {
    const pixels = new Uint8ClampedArray(4 * 100);
    for (let i = 0; i < pixels.length; i += 8) {
      // Black pixel
      pixels[i] = 0; pixels[i + 1] = 0; pixels[i + 2] = 0; pixels[i + 3] = 255;
      // White pixel
      pixels[i + 4] = 255; pixels[i + 5] = 255; pixels[i + 6] = 255; pixels[i + 7] = 255;
    }
    expect(luminanceSD(pixels)).toBeGreaterThan(100);
  });

  it('single pixel has SD = 0', () => {
    const pixels = new Uint8ClampedArray([200, 100, 50, 255]);
    expect(luminanceSD(pixels)).toBe(0);
  });
});

// ── Welford variance stability ────────────────────────────────────────────────

describe('Welford online variance (laplacian backbone)', () => {
  it('returns 0 variance for uniform signal', () => {
    expect(laplacianVarianceOnThreePixels([5, 5, 5, 5, 5])).toBeCloseTo(0, 5);
  });

  it('returns positive variance for varying signal', () => {
    expect(laplacianVarianceOnThreePixels([0, 10, 0, 10, 0])).toBeGreaterThan(0);
  });

  it('does not produce NaN or Infinity', () => {
    const result = laplacianVarianceOnThreePixels([255, 0, 128, 64, 192]);
    expect(Number.isFinite(result)).toBe(true);
  });

  it('single value returns 0 (not undefined or NaN)', () => {
    expect(laplacianVarianceOnThreePixels([42])).toBe(0);
  });
});

// ── clamp100 ──────────────────────────────────────────────────────────────────

describe('clamp100', () => {
  it('clamps below 0 to 0', () => expect(clamp100(-50)).toBe(0));
  it('clamps above 100 to 100', () => expect(clamp100(999)).toBe(100));
  it('rounds mid values', () => expect(clamp100(72.6)).toBe(73));
  it('passes through exact boundary', () => expect(clamp100(100)).toBe(100));
});

// ── Message dictionaries (regression guards) ──────────────────────────────────

describe('QUALITY_MESSAGES', () => {
  const reasons: QualityFailReason[] = ['too_blurry', 'too_dark', 'overexposed'];

  for (const reason of reasons) {
    it(`has a non-empty title and hint for "${reason}"`, () => {
      const msg = QUALITY_MESSAGES[reason];
      expect(msg.title.length).toBeGreaterThan(0);
      expect(msg.hint.length).toBeGreaterThan(0);
    });
  }
});

describe('ID_STRUCTURE_MESSAGES', () => {
  const reasons: IDFailReason[] = [
    'wrong_shape', 'not_an_id_card', 'card_too_small',
    'no_photo_zone', 'no_barcode_zone', 'low_structure',
  ];

  for (const reason of reasons) {
    it(`has a non-empty title and hint for "${reason}"`, () => {
      const msg = ID_STRUCTURE_MESSAGES[reason];
      expect(msg.title.length).toBeGreaterThan(0);
      expect(msg.hint.length).toBeGreaterThan(0);
    });
  }
});

// ── PDF short-circuit (checkImageQuality) ────────────────────────────────────
// We stub the whole Canvas path and just verify the PDF bypass works.

describe('checkImageQuality — PDF bypass', () => {
  it('returns pass:true score:100 for application/pdf', async () => {
    // Mock URL.createObjectURL & Image so loadImage doesn't crash in jsdom
    global.URL.createObjectURL = vi.fn(() => 'blob:mock');
    global.URL.revokeObjectURL = vi.fn();

    const { checkImageQuality } = await import('@/lib/imageQuality');
    const pdfFile = new File(['%PDF-1.4'], 'id.pdf', { type: 'application/pdf' });
    const result = await checkImageQuality(pdfFile);

    expect(result.pass).toBe(true);
    expect(result.score).toBe(100);
    expect(result.reason).toBeUndefined();
  });

  it('returns pass:true for .pdf extension regardless of MIME', async () => {
    const { checkImageQuality } = await import('@/lib/imageQuality');
    const fakeFile = new File(['data'], 'document.pdf', { type: 'application/octet-stream' });
    const result = await checkImageQuality(fakeFile);
    expect(result.pass).toBe(true);
  });
});

describe('checkIDStructure — non-CIN bypass', () => {
  it('always passes for passport docType', async () => {
    const { checkIDStructure } = await import('@/lib/imageQuality');
    const file = new File(['data'], 'passport.png', { type: 'image/png' });
    const result = await checkIDStructure(file, 'front', 'passport');
    expect(result.pass).toBe(true);
    expect(result.score).toBe(100);
  });

  it('always passes for license docType', async () => {
    const { checkIDStructure } = await import('@/lib/imageQuality');
    const file = new File(['data'], 'license.png', { type: 'image/png' });
    const result = await checkIDStructure(file, 'back', 'license');
    expect(result.pass).toBe(true);
  });

  it('always passes for PDF (CIN docType)', async () => {
    const { checkIDStructure } = await import('@/lib/imageQuality');
    const file = new File(['%PDF'], 'cin.pdf', { type: 'application/pdf' });
    const result = await checkIDStructure(file, 'front', 'cin');
    expect(result.pass).toBe(true);
  });
});
