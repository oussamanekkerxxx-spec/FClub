/**
 * imageQuality.ts
 *
 * Client-side image quality analysis using the Canvas API — zero dependencies.
 *
 * Pipeline:
 *   1. Render image file to an off-screen canvas (max 640 px wide for speed)
 *   2. Convert to grayscale
 *   3. Apply Laplacian kernel to detect edges → high variance = sharp image
 *   4. Check average luminance for brightness (too dark / overexposed)
 */

export type QualityFailReason = 'too_blurry' | 'too_dark' | 'overexposed';

export interface QualityResult {
  /** Normalised sharpness score: 0 (blurry) → 100 (sharp). */
  score: number;
  pass: boolean;
  reason?: QualityFailReason;
  /** Raw Laplacian variance before normalisation (useful for debugging). */
  rawVariance: number;
  /** Average pixel luminance 0–255. */
  brightness: number;
}

// ── Thresholds ───────────────────────────────────────────────────────────────

/** Laplacian variance below this → image is too blurry. */
const BLUR_VARIANCE_THRESHOLD = 100;

/** Average luminance below this → image is too dark. */
const BRIGHTNESS_MIN = 45;

/** Average luminance above this → image is overexposed. */
const BRIGHTNESS_MAX = 220;

/**
 * Upper bound used to normalise raw variance into 0–100.
 * Real ID photos at acceptable focus typically have variance 100–3000.
 */
const VARIANCE_SCALE = 3000;

// ── Internal helpers ─────────────────────────────────────────────────────────

/** Load a File/Blob as an HTMLImageElement. */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')); };
    img.src = url;
  });
}

/** Render image to a canvas scaled to maxWidth, return the pixel data. */
function renderToCanvas(img: HTMLImageElement, maxWidth = 640): ImageData {
  const scale = Math.min(1, maxWidth / img.naturalWidth);
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');
  ctx.drawImage(img, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h);
}

/**
 * Convert RGBA pixel array to a flat Float32Array of grayscale values (0–255).
 * Uses the standard luminance formula: 0.299R + 0.587G + 0.114B
 */
function toGrayscale(imageData: ImageData): Float32Array {
  const { data, width, height } = imageData;
  const gray = new Float32Array(width * height);
  for (let i = 0; i < gray.length; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
  }
  return gray;
}

/**
 * Apply the Laplacian 3×3 kernel over the grayscale image and return the
 * variance of the response — a standard measure of image sharpness.
 *
 * Higher variance = more edge energy = sharper image.
 * A blurry image has few strong edges, so variance is low.
 *
 * Uses Welford's online algorithm so we never allocate an intermediate array.
 */
function laplacianVariance(gray: Float32Array, width: number, height: number): number {
  // Welford one-pass online variance
  let count = 0;
  let mean  = 0;
  let M2    = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      // Compute Laplacian response at (x, y) inline
      const row0 = (y - 1) * width + x;
      const row1 = y       * width + x;
      const row2 = (y + 1) * width + x;
      const response =
        gray[row0]     +           // centre-top
        gray[row1 - 1] +           // centre-left
        gray[row1    ] * -4 +      // centre
        gray[row1 + 1] +           // centre-right
        gray[row2];                // centre-bottom

      // Update running mean and variance
      count++;
      const delta = response - mean;
      mean += delta / count;
      M2   += delta * (response - mean);
    }
  }

  return count > 1 ? M2 / count : 0;
}

/** Average luminance across all pixels (0–255). */
function averageBrightness(gray: Float32Array): number {
  const sum = gray.reduce((s, v) => s + v, 0);
  return sum / gray.length;
}

/** Clamp a number to [0, 100] and round to the nearest integer. */
function clamp100(n: number): number {
  return Math.round(Math.max(0, Math.min(100, n)));
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Analyse the quality of an image File and return a QualityResult.
 *
 * Usage:
 *   const result = await checkImageQuality(file);
 *   if (!result.pass) {
 *     showError(result.reason); // 'too_blurry' | 'too_dark' | 'overexposed'
 *   }
 *
 * Only works with image files (JPEG, PNG, WEBP, etc.).
 * PDF files are skipped — they always return pass: true with score 100.
 */
export async function checkImageQuality(file: File): Promise<QualityResult> {
  // PDFs can't be analysed via Canvas — pass them through unconditionally
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    return { score: 100, pass: true, rawVariance: 0, brightness: 128 };
  }

  const img = await loadImage(file);
  const imageData = renderToCanvas(img);
  const { width, height } = imageData;

  const gray = toGrayscale(imageData);
  const brightness = averageBrightness(gray);
  const rawVariance = laplacianVariance(gray, width, height);

  // Brightness checks (independent of blur)
  if (brightness < BRIGHTNESS_MIN) {
    return { score: 0, pass: false, reason: 'too_dark', rawVariance, brightness };
  }
  if (brightness > BRIGHTNESS_MAX) {
    return { score: 0, pass: false, reason: 'overexposed', rawVariance, brightness };
  }

  // Blur check
  if (rawVariance < BLUR_VARIANCE_THRESHOLD) {
    return { score: 0, pass: false, reason: 'too_blurry', rawVariance, brightness };
  }

  // Normalise variance to 0–100 score
  const score = clamp100((rawVariance / VARIANCE_SCALE) * 100);

  return { score, pass: true, rawVariance, brightness };
}

// ── Human-readable error messages ────────────────────────────────────────────

export const QUALITY_MESSAGES: Record<QualityFailReason, { title: string; hint: string }> = {
  too_blurry: {
    title: 'Image is too blurry',
    hint: 'Hold the camera steady and make sure the document is in focus.',
  },
  too_dark: {
    title: 'Image is too dark',
    hint: 'Move to a brighter area or turn on a light behind the camera.',
  },
  overexposed: {
    title: 'Image is overexposed',
    hint: 'Avoid direct light hitting the document — try indirect lighting.',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// ID STRUCTURAL VALIDATION
// Detects whether an uploaded image looks like a Moroccan CIN card (both sides)
// using purely client-side Canvas analysis — no external calls.
// ═══════════════════════════════════════════════════════════════════════════════

export type IDFailReason =
  | 'wrong_shape'      // aspect ratio is not card-like (not landscape ~1.585:1)
  | 'not_an_id_card'   // colour analysis shows wrong background colour
  | 'card_too_small'   // card doesn't fill the frame (large blank borders)
  | 'no_photo_zone'    // front: right side looks blank — no portrait detected
  | 'no_barcode_zone'  // back: bottom strip lacks barcode signature
  | 'low_structure';   // overall score too low

export interface IDStructureResult {
  /** 0–100 structural confidence score. */
  score: number;
  pass: boolean;
  reason?: IDFailReason;
  details: {
    aspectRatio: number;
    aspectScore: number;
    colourScore: number;
    frameScore: number;
    zoneScore: number;
  };
}

// ── Structural thresholds ─────────────────────────────────────────────────────

/** CR80 card ratio = 85.6 / 54 ≈ 1.585. Allow generous tolerance. */
const ASPECT_MIN = 1.35;
const ASPECT_MAX = 1.85;

/** Fraction of pixels in the teal/green hue band to call it a front card. */
const TEAL_PIXEL_FRACTION = 0.08; // 8 % of pixels must be teal

/** For back card: fraction of pixels that must be bright (luminance > 180). */
const BACK_BRIGHT_FRACTION = 0.45;

/** Corner patch size as a fraction of card dimension. */
const CORNER_PATCH = 0.06;

/** Minimum luminance standard-deviation in photo zone (front). */
const PHOTO_ZONE_SD_MIN = 18;

/** Minimum horizontal edge frequency fraction in barcode zone (back). */
const BARCODE_EDGE_FRACTION = 0.12;

/** Minimum total ID structure score to pass. */
const STRUCTURE_PASS_THRESHOLD = 55;

// ── Internal helpers ──────────────────────────────────────────────────────────

/** Convert an RGB triplet to HSV. Returns h in [0,360], s & v in [0,1]. */
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

/**
 * Sample a rectangular region from ImageData and return the raw pixel values
 * as a Uint8ClampedArray [R,G,B,A, R,G,B,A, …].
 */
function sampleRegion(
  data: Uint8ClampedArray,
  fullWidth: number,
  x0: number, y0: number,
  x1: number, y1: number,
): Uint8ClampedArray {
  const w = x1 - x0;
  const h = y1 - y0;
  const out = new Uint8ClampedArray(w * h * 4);
  let i = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const src = (y * fullWidth + x) * 4;
      out[i++] = data[src];
      out[i++] = data[src + 1];
      out[i++] = data[src + 2];
      out[i++] = data[src + 3];
    }
  }
  return out;
}

/** Count pixels whose hue falls in [hMin, hMax] AND saturation >= minSat. */
function countHuedPixels(
  pixels: Uint8ClampedArray,
  hMin: number, hMax: number,
  minSat = 0.15,
): number {
  let count = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    const [h, s] = rgbToHsv(pixels[i], pixels[i + 1], pixels[i + 2]);
    if (s >= minSat && h >= hMin && h <= hMax) count++;
  }
  return count;
}

/** Count pixels with luminance (grayscale) above a threshold. */
function countBrightPixels(pixels: Uint8ClampedArray, threshold: number): number {
  let count = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    const lum = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
    if (lum > threshold) count++;
  }
  return count;
}

/** Standard deviation of grayscale luminance in a pixel block.
 *  Two-pass implementation — no intermediate array allocation.
 */
function luminanceSD(pixels: Uint8ClampedArray): number {
  const n = pixels.length / 4;
  if (n === 0) return 0;

  // Pass 1: compute mean
  let sum = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    sum += 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
  }
  const mean = sum / n;

  // Pass 2: compute variance
  let varSum = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    const l = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
    varSum += (l - mean) * (l - mean);
  }
  return Math.sqrt(varSum / n);
}

/**
 * Detect horizontal edge frequency in a region using simple row-diff method.
 * Returns fraction of pixel rows with high luminance change (barcode signature).
 */
function horizontalEdgeFraction(pixels: Uint8ClampedArray, width: number): number {
  const height = (pixels.length / 4) / width;
  let highEdgeRows = 0;
  for (let y = 0; y < height; y++) {
    let rowEdgeSum = 0;
    for (let x = 1; x < width; x++) {
      const i = (y * width + x) * 4;
      const iPrev = (y * width + (x - 1)) * 4;
      const l  = 0.299 * pixels[i]     + 0.587 * pixels[i + 1]     + 0.114 * pixels[i + 2];
      const lp = 0.299 * pixels[iPrev] + 0.587 * pixels[iPrev + 1] + 0.114 * pixels[iPrev + 2];
      rowEdgeSum += Math.abs(l - lp);
    }
    const avgEdge = rowEdgeSum / (width - 1);
    if (avgEdge > 10) highEdgeRows++;
  }
  return highEdgeRows / height;
}

// ── Main structural check ─────────────────────────────────────────────────────

/**
 * Analyse whether an image looks like the correct side of a Moroccan CIN card.
 *
 * @param file  - The image File to analyse (not called for PDFs).
 * @param side  - 'front' (teal face) or 'back' (white face).
 * @param docType - Pass 'cin' to run full structural checks; others get a free pass.
 */
export async function checkIDStructure(
  file: File,
  side: 'front' | 'back',
  docType: 'cin' | 'passport' | 'license' = 'cin',
): Promise<IDStructureResult> {
  // Only run structural checks for CIN — passport / license layouts differ
  if (docType !== 'cin') {
    return {
      score: 100, pass: true,
      details: { aspectRatio: 0, aspectScore: 20, colourScore: 30, frameScore: 20, zoneScore: 30 },
    };
  }
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    return {
      score: 100, pass: true,
      details: { aspectRatio: 0, aspectScore: 20, colourScore: 30, frameScore: 20, zoneScore: 30 },
    };
  }

  const img = await loadImage(file);
  // Render at 800 px wide for a good balance of speed and detail
  const imageData = renderToCanvas(img, 800);
  const { data, width, height } = imageData;
  const totalPixels = width * height;

  // ── Stage 1: Aspect ratio (20 pts) ──────────────────────────────────────────
  const aspectRatio = width / height;
  const aspectOk = aspectRatio >= ASPECT_MIN && aspectRatio <= ASPECT_MAX;
  const aspectScore = aspectOk ? 20 : 0;

  if (!aspectOk) {
    return {
      score: aspectScore,
      pass: false,
      reason: 'wrong_shape',
      details: { aspectRatio, aspectScore, colourScore: 0, frameScore: 0, zoneScore: 0 },
    };
  }

  // ── Stage 2: Dominant colour (30 pts) ───────────────────────────────────────
  // Front: expect teal (H≈160-200, Moroccan CIN is cyan-teal-green)
  // Back:  expect mostly white/cream (high luminance)
  let colourScore = 0;
  if (side === 'front') {
    const tealCount = countHuedPixels(data, 140, 210, 0.12);
    const tealFraction = tealCount / totalPixels;
    // Scale: 0 pts at 0%, 30 pts at >= TEAL_PIXEL_FRACTION
    colourScore = Math.round(Math.min(30, (tealFraction / TEAL_PIXEL_FRACTION) * 30));
  } else {
    const brightCount = countBrightPixels(data, 180);
    const brightFraction = brightCount / totalPixels;
    colourScore = Math.round(Math.min(30, (brightFraction / BACK_BRIGHT_FRACTION) * 30));
  }

  // ── Stage 3: Card fills the frame (20 pts) ──────────────────────────────────
  // Sample 4 corner patches — if they are very bright (white) the card is
  // photographed against a white background and may be too small in frame.
  // Conversely if the corners have the card colour, the card fills the shot.
  const patchW = Math.round(width  * CORNER_PATCH);
  const patchH = Math.round(height * CORNER_PATCH);

  const corners = [
    sampleRegion(data, width, 0,         0,          patchW,       patchH),       // TL
    sampleRegion(data, width, width - patchW, 0,     width,        patchH),       // TR
    sampleRegion(data, width, 0,         height - patchH, patchW,  height),       // BL
    sampleRegion(data, width, width - patchW, height - patchH, width, height),   // BR
  ];

  // Count how many corners look like the card background (not plain white)
  let cardCorners = 0;
  for (const corner of corners) {
    if (side === 'front') {
      const teal = countHuedPixels(corner, 140, 210, 0.10);
      if (teal / (corner.length / 4) > 0.05) cardCorners++;
    } else {
      // Back card background is white, so we check that corners are NOT pure
      // white (which would suggest the frame is way bigger than the card).
      // We look for ANY non-trivial saturation or edge content.
      const lowBright = countBrightPixels(corner, 240); // > 240 = near-white
      const fraction  = lowBright / (corner.length / 4);
      if (fraction < 0.90) cardCorners++; // corner has some content
    }
  }
  // 0 card-like corners = 0 pts, 4 = 20 pts
  const frameScore = Math.round((cardCorners / 4) * 20);

  // ── Stage 4: Zone integrity (30 pts) ────────────────────────────────────────
  let zoneScore = 0;

  if (side === 'front') {
    // Photo zone: right-most 28% of width, full height
    const pzX0 = Math.round(width * 0.72);
    const photoPixels = sampleRegion(data, width, pzX0, 0, width, height);
    const photoSD = luminanceSD(photoPixels);
    // A portrait has high variance; a blank area has low variance
    const photoPass = photoSD >= PHOTO_ZONE_SD_MIN;
    zoneScore += photoPass ? 15 : 0;

    // Header zone: top 18% of height, left 70% of width (text-heavy area)
    const hzY1 = Math.round(height * 0.18);
    const headerPixels = sampleRegion(data, width, 0, 0, Math.round(width * 0.70), hzY1);
    const headerSD = luminanceSD(headerPixels);
    // Header should have text → non-trivial luminance variance
    const headerPass = headerSD >= 12;
    zoneScore += headerPass ? 15 : 0;

    if (!photoPass)  {
      // Deduct: no photo zone detected
      return {
        score: Math.max(0, aspectScore + colourScore + frameScore + zoneScore),
        pass: false,
        reason: 'no_photo_zone',
        details: { aspectRatio, aspectScore, colourScore, frameScore, zoneScore },
      };
    }
  } else {
    // Barcode zone: bottom 20% of height, full width
    const bzY0  = Math.round(height * 0.80);
    const bzW   = width;
    const barcodePixels = sampleRegion(data, width, 0, bzY0, bzW, height);
    const edgeFrac = horizontalEdgeFraction(barcodePixels, bzW);
    const barcodePass = edgeFrac >= BARCODE_EDGE_FRACTION;
    zoneScore += barcodePass ? 20 : 0;

    // Text zone: top 75% — look for reasonable SD (text on white)
    const textPixels = sampleRegion(data, width, 0, 0, width, Math.round(height * 0.75));
    const textSD = luminanceSD(textPixels);
    zoneScore += textSD >= 10 ? 10 : 0;

    if (!barcodePass) {
      return {
        score: Math.max(0, aspectScore + colourScore + frameScore + zoneScore),
        pass: false,
        reason: 'no_barcode_zone',
        details: { aspectRatio, aspectScore, colourScore, frameScore, zoneScore },
      };
    }
  }

  // ── Final score ──────────────────────────────────────────────────────────────
  const totalScore = aspectScore + colourScore + frameScore + zoneScore;
  const pass = totalScore >= STRUCTURE_PASS_THRESHOLD;

  return {
    score: totalScore,
    pass,
    reason: pass ? undefined : 'low_structure',
    details: { aspectRatio, aspectScore, colourScore, frameScore, zoneScore },
  };
}

// ── Human-readable ID structure messages ─────────────────────────────────────

export const ID_STRUCTURE_MESSAGES: Record<IDFailReason, { title: string; hint: string }> = {
  wrong_shape: {
    title: 'Image doesn\'t look like an ID card',
    hint: 'Make sure the card fills the frame horizontally and is photographed flat.',
  },
  not_an_id_card: {
    title: 'Couldn\'t confirm this is a Moroccan CIN',
    hint: 'Ensure you\'re photographing the correct side of your national ID card.',
  },
  card_too_small: {
    title: 'Card is too small in the frame',
    hint: 'Move your camera closer so the card fills most of the image.',
  },
  no_photo_zone: {
    title: 'No portrait detected on the front',
    hint: 'Make sure the front side of your card is visible and well-lit.',
  },
  no_barcode_zone: {
    title: 'No barcode detected on the back',
    hint: 'Make sure you\'re photographing the back side of your card.',
  },
  low_structure: {
    title: 'Image doesn\'t match expected ID layout',
    hint: 'Ensure the card is flat, fully visible, and well-lit from the front.',
  },
};
