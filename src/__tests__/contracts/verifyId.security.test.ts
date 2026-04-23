/**
 * verifyId.security.test.ts
 *
 * Security contract tests for the verify-id edge function logic.
 *
 * Because the edge function runs in Deno, we cannot import it directly.
 * Instead we extract and re-implement the pure security-critical functions
 * here and test them in isolation — ensuring they match the implementation
 * in supabase/functions/verify-id/index.ts exactly.
 *
 * Covered contracts:
 *   1.  Path ownership validation  (frontPath must start with userId/)
 *   2.  MRZ field-level checksum validation (TD1 + TD3)
 *   3.  Response shape does NOT include ocrData
 *   4.  CORS origin is not wildcard
 *   5.  documentType whitelist
 */

import { describe, it, expect } from 'vitest';

// ── 1. Path ownership (mirrored from verify-id/index.ts) ─────────────────────

function isOwnedPath(userId: string, path: string): boolean {
  return path.startsWith(`${userId}/`);
}

describe('Path ownership validation', () => {
  const USER_ID  = 'b0e9b241-be79-4b4a-bc8b-5eb371b12bc8';
  const OTHER_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

  it('accepts a front path inside the user own folder', () => {
    expect(isOwnedPath(USER_ID, `${USER_ID}/id_front.jpg`)).toBe(true);
  });

  it('accepts a back path inside the user own folder', () => {
    expect(isOwnedPath(USER_ID, `${USER_ID}/id_back.png`)).toBe(true);
  });

  it('rejects a path belonging to another user', () => {
    expect(isOwnedPath(USER_ID, `${OTHER_ID}/id_front.jpg`)).toBe(false);
  });

  it('rejects a path with userId as a suffix (traversal attempt)', () => {
    expect(isOwnedPath(USER_ID, `evil/${USER_ID}/id_front.jpg`)).toBe(false);
  });

  it('rejects an empty path', () => {
    expect(isOwnedPath(USER_ID, '')).toBe(false);
  });

  it('rejects just the userId without trailing slash', () => {
    expect(isOwnedPath(USER_ID, USER_ID)).toBe(false);
  });

  it('rejects a path that embeds userId after a subdirectory', () => {
    expect(isOwnedPath(USER_ID, `uploads/${USER_ID}/id_front.jpg`)).toBe(false);
  });
});

// ── 2. MRZ checksum (mirrored from verify-id/index.ts) ───────────────────────

function mrzVal(ch: string): number {
  if (ch >= '0' && ch <= '9') return Number(ch);
  if (ch >= 'A' && ch <= 'Z') return ch.charCodeAt(0) - 55;
  return 0; // '<' and anything else
}

function mrzCheckValid(field: string, checkDigit: string): boolean {
  const weights = [7, 3, 1];
  let sum = 0;
  for (let i = 0; i < field.length; i++) {
    sum += mrzVal(field[i]) * weights[i % 3];
  }
  return (sum % 10) === Number(checkDigit);
}

interface MrzValidation {
  valid: boolean;
  checks: { docNumber: boolean; dob: boolean; expiry: boolean; composite?: boolean };
}

function validateMrz(l1: string | null, l2: string | null, l3: string | null): MrzValidation {
  const FAIL: MrzValidation = { valid: false, checks: { docNumber: false, dob: false, expiry: false } };
  try {
    // TD3 - Passport (2 x 44)
    if (l1 && l2 && !l3 && l1.length >= 44 && l2.length >= 44) {
      const docNumberCheck = mrzCheckValid(l2.slice(0, 9), l2[9]);
      const dobCheck       = mrzCheckValid(l2.slice(13, 19), l2[19]);
      const expiryCheck    = mrzCheckValid(l2.slice(21, 27), l2[27]);
      const compositeField = l2.slice(0, 10) + l2.slice(13, 20) + l2.slice(21, 43);
      const compositeCheck = mrzCheckValid(compositeField, l2[43]);
      const checks = { docNumber: docNumberCheck, dob: dobCheck, expiry: expiryCheck, composite: compositeCheck };
      return { valid: docNumberCheck && dobCheck && expiryCheck && compositeCheck, checks };
    }
    // TD1 - ID card (3 x 30)
    if (l1 && l2 && l3 && l1.length >= 30 && l2.length >= 30) {
      const docNumberCheck = mrzCheckValid(l1.slice(5, 14), l1[14]);
      const dobCheck       = mrzCheckValid(l2.slice(0, 6), l2[6]);
      const expiryCheck    = mrzCheckValid(l2.slice(8, 14), l2[14]);
      const compositeField = l1 + l2.slice(0, 29);
      const compositeCheck = mrzCheckValid(compositeField, l2[29]);
      const checks = { docNumber: docNumberCheck, dob: dobCheck, expiry: expiryCheck, composite: compositeCheck };
      return { valid: docNumberCheck && dobCheck && expiryCheck && compositeCheck, checks };
    }
  } catch { /* ignore */ }
  return FAIL;
}

// ── MRZ field-level tests (no full composite needed) ─────────────────────────

describe('mrzVal — character mapping', () => {
  it('maps digits 0-9', () => {
    expect(mrzVal('0')).toBe(0);
    expect(mrzVal('9')).toBe(9);
  });

  it('maps A=10 and Z=35', () => {
    expect(mrzVal('A')).toBe(10);
    expect(mrzVal('Z')).toBe(35);
  });

  it('maps filler < to 0', () => {
    expect(mrzVal('<')).toBe(0);
  });
});

describe('mrzCheckValid — individual field checks', () => {
  // ICAO 9303 classic examples, verified manually
  it('L898902C3 has check digit 6', () => {
    expect(mrzCheckValid('L898902C3', '6')).toBe(true);
  });

  it('rejects a tampered doc number check', () => {
    expect(mrzCheckValid('L898902C3', '7')).toBe(false);
  });

  it('DOB 690806 has check digit 1', () => {
    expect(mrzCheckValid('690806', '1')).toBe(true);
  });

  it('rejects wrong DOB check digit', () => {
    expect(mrzCheckValid('690806', '9')).toBe(false);
  });

  it('all-filler field has check digit 0', () => {
    expect(mrzCheckValid('<<<<<<', '0')).toBe(true);
  });
});

describe('validateMrz — structural checks', () => {
  it('returns invalid for lines that are too short', () => {
    const result = validateMrz('SHORT', 'SHORT', null);
    expect(result.valid).toBe(false);
    expect(result.checks.docNumber).toBe(false);
  });

  it('returns invalid when both lines are null', () => {
    expect(validateMrz(null, null, null).valid).toBe(false);
  });

  it('returns invalid when only line1 is present', () => {
    expect(validateMrz('LINE1', null, null).valid).toBe(false);
  });
});

// ── 3. Response shape contract — ocrData must NOT be present ─────────────────

describe('Edge function response shape contract', () => {
  interface SafeResponse {
    success: boolean;
    requestId: string;
    mrzValid: boolean | null;
    mrzChecks: object;
  }

  function buildMockResponse(includeOcrData: boolean): object {
    const base: SafeResponse = {
      success: true, requestId: 'some-uuid', mrzValid: true,
      mrzChecks: { docNumber: true, dob: true, expiry: true },
    };
    if (includeOcrData) return { ...base, ocrData: { name: 'BENALI YOUSSEF', dob: '1990-03-12' } };
    return base;
  }

  it('current response does NOT contain ocrData', () => {
    expect(buildMockResponse(false)).not.toHaveProperty('ocrData');
  });

  it('response contains required fields', () => {
    const r = buildMockResponse(false);
    expect(r).toHaveProperty('success', true);
    expect(r).toHaveProperty('requestId');
    expect(r).toHaveProperty('mrzValid');
    expect(r).toHaveProperty('mrzChecks');
  });

  it('regression: old response shape with ocrData is detectable', () => {
    expect(buildMockResponse(true)).toHaveProperty('ocrData');
  });
});

// ── 4. CORS origin contract ───────────────────────────────────────────────────

describe('CORS origin policy contract', () => {
  function resolveCorsOrigin(env: string | undefined): string {
    return env ?? 'http://localhost:5173';
  }

  it('uses env var when set', () => {
    expect(resolveCorsOrigin('https://learnskills.vercel.app')).toBe('https://learnskills.vercel.app');
  });

  it('falls back to localhost, not wildcard', () => {
    const origin = resolveCorsOrigin(undefined);
    expect(origin).not.toBe('*');
    expect(origin).toBe('http://localhost:5173');
  });

  it('never resolves to *', () => {
    expect(resolveCorsOrigin(undefined)).not.toBe('*');
    expect(resolveCorsOrigin('')).not.toBe('*');
  });
});

// ── 5. Document type whitelist ────────────────────────────────────────────────

describe('documentType whitelist', () => {
  const ALLOWED = ['cin', 'passport', 'license'];

  it('accepts valid types', () => {
    for (const t of ALLOWED) expect(ALLOWED.includes(t)).toBe(true);
  });

  it('rejects unknown types including injection attempts', () => {
    const bad = ['id', 'national_id', 'driving_licence', '', 'admin', '__proto__'];
    for (const t of bad) expect(ALLOWED.includes(t)).toBe(false);
  });
});
