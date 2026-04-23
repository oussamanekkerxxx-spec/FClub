/**
 * verify-id — Supabase Edge Function
 *
 * Called after the user uploads both sides of their ID document.
 *
 * Flow:
 *   1. Verify the caller's JWT
 *   2. Download front (+ back) images from Supabase Storage
 *   3. Send to Mindee OCR API
 *   4. Normalise the OCR response into a flat ocrData object
 *   5. Parse + validate any MRZ lines (checksum algorithm)
 *   6. Insert row into id_verification_requests (service-role → bypasses RLS)
 *   7. Set profiles.id_card_status = 'pending'
 *   8. Return { requestId, ocrData, mrzValid }
 *
 * Required secrets (set via `supabase secrets set`):
 *   MINDEE_API_KEY   — from https://platform.mindee.com
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

// ── Environment ──────────────────────────────────────────────────────────────

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const MINDEE_API_KEY = Deno.env.get('MINDEE_API_KEY') ?? '';

// Mindee predict endpoints per document type
// CIN and license both use the French-style national ID product (closest to Morocco CIN layout).
const MINDEE_ENDPOINTS: Record<string, string> = {
  passport: 'https://api.mindee.net/v1/products/mindee/passport/v1/predict',
  cin:      'https://api.mindee.net/v1/products/mindee/idcard_fr/v2/predict',
  license:  'https://api.mindee.net/v1/products/mindee/idcard_fr/v2/predict',
};

// ── CORS headers (required for browser calls) ────────────────────────────────
// Restrict to our app origin — never wildcard for a PII endpoint
const APP_ORIGIN = Deno.env.get('APP_ORIGIN') ?? 'http://localhost:5173';

const CORS = {
  'Access-Control-Allow-Origin': APP_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── Request / Response types ─────────────────────────────────────────────────

interface RequestBody {
  userId: string;
  documentType: 'cin' | 'passport' | 'license';
  frontPath: string;
  backPath?: string;
  qualityScoreFront: number;
  qualityScoreBack?: number;
}

interface OcrData {
  name: string | null;
  dob: string | null;
  id_number: string | null;
  expiry: string | null;
  nationality: string | null;
  mrz_line1: string | null;
  mrz_line2: string | null;
  mrz_line3: string | null;
}

// ── MRZ helpers ──────────────────────────────────────────────────────────────

/** Map a single MRZ character to its numeric value. */
function mrzVal(ch: string): number {
  if (ch >= '0' && ch <= '9') return Number(ch);
  if (ch >= 'A' && ch <= 'Z') return ch.charCodeAt(0) - 55; // A=10 … Z=35
  return 0; // '<' and anything else = 0
}

/**
 * Validate a single MRZ field + its check digit.
 * Weights cycle: 7 → 3 → 1 → 7 → 3 → 1 → …
 */
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
  /** Which individual field checks passed/failed — useful for admin review. */
  checks: {
    docNumber: boolean;
    dob: boolean;
    expiry: boolean;
    composite?: boolean;
  };
}

/**
 * Validate MRZ checksums.
 *
 * TD3 (Passport — 2 lines × 44 chars):
 *   Line 2: DocNum(9)+Check(1)+Nat(3)+DOB(6)+Check(1)+Sex(1)+Expiry(6)+Check(1)+Opt(14)+Check(1)+OverallCheck(1)
 *
 * TD1 (ID Card — 3 lines × 30 chars):
 *   Line 1: Type(2)+Country(3)+DocNum(9)+Check(1)+Opt1(15)
 *   Line 2: DOB(6)+Check(1)+Sex(1)+Expiry(6)+Check(1)+Nat(3)+Opt2(11)+OverallCheck(1)
 *   Line 3: Names
 */
function validateMrz(
  line1: string | null,
  line2: string | null,
  line3: string | null,
): MrzValidation {
  const FAIL: MrzValidation = { valid: false, checks: { docNumber: false, dob: false, expiry: false } };

  try {
    // TD3 — Passport (2 lines × 44)
    if (line1 && line2 && !line3 && line1.length >= 44 && line2.length >= 44) {
      const docNumberCheck = mrzCheckValid(line2.slice(0, 9), line2[9]);
      const dobCheck       = mrzCheckValid(line2.slice(13, 19), line2[19]);
      const expiryCheck    = mrzCheckValid(line2.slice(21, 27), line2[27]);
      // Composite check: doc number field + check + opt data fields + expiry field + check
      const compositeField = line2.slice(0, 10) + line2.slice(13, 20) + line2.slice(21, 43);
      const compositeCheck = mrzCheckValid(compositeField, line2[43]);

      const checks = { docNumber: docNumberCheck, dob: dobCheck, expiry: expiryCheck, composite: compositeCheck };
      return { valid: docNumberCheck && dobCheck && expiryCheck && compositeCheck, checks };
    }

    // TD1 — ID Card / CIN (3 lines × 30)
    if (line1 && line2 && line3 && line1.length >= 30 && line2.length >= 30) {
      const docNumberCheck = mrzCheckValid(line1.slice(5, 14), line1[14]);
      const dobCheck       = mrzCheckValid(line2.slice(0, 6), line2[6]);
      const expiryCheck    = mrzCheckValid(line2.slice(8, 14), line2[14]);
      // Composite: all of line1 + line2[0-28]
      const compositeField = line1 + line2.slice(0, 29);
      const compositeCheck = mrzCheckValid(compositeField, line2[29]);

      const checks = { docNumber: docNumberCheck, dob: dobCheck, expiry: expiryCheck, composite: compositeCheck };
      return { valid: docNumberCheck && dobCheck && expiryCheck && compositeCheck, checks };
    }
  } catch {
    // Malformed MRZ — fail gracefully
  }

  return FAIL;
}

// ── Mindee response normalisers ──────────────────────────────────────────────

type MindeeDoc = Record<string, unknown>;

/** Safe field extractor — Mindee wraps values in { value: ... } objects. */
function field(prediction: MindeeDoc, key: string): string | null {
  const entry = prediction[key] as Record<string, unknown> | undefined;
  if (!entry) return null;
  const v = entry.value;
  if (v === null || v === undefined || v === '') return null;
  return String(v);
}

/** Collect an array field (e.g. given_names which is a list in v2). */
function fieldList(prediction: MindeeDoc, key: string): string | null {
  const entry = prediction[key] as Array<Record<string, unknown>> | undefined;
  if (!Array.isArray(entry) || entry.length === 0) return null;
  return entry.map(e => String(e.value ?? '')).filter(Boolean).join(' ');
}

function normalisePassport(prediction: MindeeDoc): OcrData {
  const givenNames = fieldList(prediction, 'given_names') ?? field(prediction, 'given_names');
  const surname    = field(prediction, 'surname');
  const name       = [surname, givenNames].filter(Boolean).join(' ') || null;

  return {
    name,
    dob:         field(prediction, 'birth_date'),
    id_number:   field(prediction, 'id_number') ?? field(prediction, 'document_number'),
    expiry:      field(prediction, 'expiry_date'),
    nationality: field(prediction, 'nationality') ?? field(prediction, 'country'),
    mrz_line1:   field(prediction, 'mrz1') ?? field(prediction, 'mrz_line1'),
    mrz_line2:   field(prediction, 'mrz2') ?? field(prediction, 'mrz_line2'),
    mrz_line3:   null,
  };
}

function normaliseIdCard(prediction: MindeeDoc): OcrData {
  const givenNames = fieldList(prediction, 'given_names') ?? field(prediction, 'given_names');
  const surname    = field(prediction, 'surname');
  const name       = [surname, givenNames].filter(Boolean).join(' ') || null;

  return {
    name,
    dob:         field(prediction, 'birth_date'),
    id_number:   field(prediction, 'id_number') ?? field(prediction, 'document_number'),
    expiry:      field(prediction, 'expiry_date'),
    nationality: field(prediction, 'nationality') ?? field(prediction, 'country') ?? 'MAR',
    mrz_line1:   field(prediction, 'mrz1') ?? field(prediction, 'mrz_line1'),
    mrz_line2:   field(prediction, 'mrz2') ?? field(prediction, 'mrz_line2'),
    mrz_line3:   field(prediction, 'mrz3') ?? field(prediction, 'mrz_line3'),
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status);
}

/**
 * Download a file from Supabase Storage and return it as a Blob.
 * Uses the service-role admin client so private buckets are accessible.
 */
async function downloadStorageFile(
  adminClient: ReturnType<typeof createClient>,
  bucket: string,
  path: string,
): Promise<Blob | null> {
  const { data, error } = await adminClient.storage.from(bucket).download(path);
  if (error || !data) return null;
  return data;
}

/**
 * Call the Mindee OCR API with a file blob.
 * Returns the raw prediction object or null on failure.
 */
async function callMindee(
  endpoint: string,
  fileBlob: Blob,
  filename: string,
): Promise<MindeeDoc | null> {
  if (!MINDEE_API_KEY) {
    // Development fallback — return empty prediction so the flow completes
    console.warn('MINDEE_API_KEY not set — returning mock OCR data');
    return null;
  }

  const form = new FormData();
  form.append('document', fileBlob, filename);

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: `Token ${MINDEE_API_KEY}` },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`Mindee error ${res.status}:`, text);
    return null;
  }

  const json = await res.json() as { document?: { inference?: { prediction?: MindeeDoc } } };
  return json?.document?.inference?.prediction ?? null;
}

// ── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  // ── 1. Authenticate ────────────────────────────────────────────────────────

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return errorResponse('Missing Authorization header', 401);

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return errorResponse('Invalid or expired token', 401);

  // Admin client — bypasses RLS for inserts and profile updates
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // ── 2. Parse & validate request body ──────────────────────────────────────

  let body: RequestBody;
  try {
    body = await req.json() as RequestBody;
  } catch {
    return errorResponse('Invalid JSON body');
  }

  const { userId, documentType, frontPath, backPath, qualityScoreFront, qualityScoreBack } = body;

  if (!userId || !documentType || !frontPath) {
    return errorResponse('Missing required fields: userId, documentType, frontPath');
  }

  if (!['cin', 'passport', 'license'].includes(documentType)) {
    return errorResponse('documentType must be cin, passport, or license');
  }

  // Security: ensure the authenticated user can only submit for themselves
  if (user.id !== userId) return errorResponse('Forbidden', 403);

  // Security: ensure the storage paths belong to the authenticated user's folder
  // Prevents a crafted request from pointing frontPath at another user's file.
  const ownPrefix = `${user.id}/`;
  if (!frontPath.startsWith(ownPrefix)) {
    return errorResponse('Forbidden: frontPath must be within your own folder', 403);
  }
  if (backPath && !backPath.startsWith(ownPrefix)) {
    return errorResponse('Forbidden: backPath must be within your own folder', 403);
  }

  // ── 3. Download image(s) from storage ──────────────────────────────────────

  const frontBlob = await downloadStorageFile(adminClient, 'id-documents', frontPath);
  if (!frontBlob) return errorResponse('Could not retrieve front image from storage', 500);

  // ── 4. Call Mindee OCR (front image) ──────────────────────────────────────

  const endpoint  = MINDEE_ENDPOINTS[documentType];
  const frontExt  = frontPath.split('.').pop() ?? 'jpg';
  const prediction = await callMindee(endpoint, frontBlob, `front.${frontExt}`);

  // ── 5. Normalise OCR response into flat ocrData ────────────────────────────

  let ocrData: OcrData;
  if (!prediction) {
    // No API key or Mindee call failed — store empty record, admin will handle it
    ocrData = {
      name: null, dob: null, id_number: null, expiry: null,
      nationality: null, mrz_line1: null, mrz_line2: null, mrz_line3: null,
    };
  } else {
    ocrData = documentType === 'passport'
      ? normalisePassport(prediction)
      : normaliseIdCard(prediction);
  }

  // ── 6. Validate MRZ checksums ──────────────────────────────────────────────

  const mrzValidation = validateMrz(ocrData.mrz_line1, ocrData.mrz_line2, ocrData.mrz_line3);
  const mrzValid = ocrData.mrz_line1 ? mrzValidation.valid : null; // null = no MRZ detected

  // ── 7. Insert into id_verification_requests ────────────────────────────────

  const { data: insertedRow, error: insertError } = await adminClient
    .from('id_verification_requests')
    .insert({
      user_id:             userId,
      document_type:       documentType,
      front_path:          frontPath,
      back_path:           backPath ?? null,
      quality_score_front: qualityScoreFront ?? null,
      quality_score_back:  qualityScoreBack  ?? null,
      ocr_data:            ocrData,
      mrz_valid:           mrzValid,
      status:              'pending',
    })
    .select('id')
    .single();

  if (insertError) {
    console.error('Insert error:', insertError);
    return errorResponse('Failed to save verification request', 500);
  }

  // ── 8. Update profile status to 'pending' ─────────────────────────────────

  const { error: profileError } = await adminClient
    .from('profiles')
    .update({ id_card_status: 'pending' })
    .eq('id', userId);

  if (profileError) {
    console.error('Profile update error:', profileError);
    // Non-fatal — the row is already saved; admin can still process it
  }

  // ── 9. Return success ──────────────────────────────────────────────────────
  // NOTE: ocrData is intentionally NOT returned to the browser — it contains
  // full PII (name, DOB, ID number, MRZ lines) and is stored server-side only.
  // The admin panel reads it directly from the DB using the service-role key.

  return jsonResponse({
    success:   true,
    requestId: insertedRow.id,
    mrzValid,
    mrzChecks: mrzValidation.checks,
  });
});
