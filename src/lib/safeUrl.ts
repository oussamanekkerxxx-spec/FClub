const SAFE_PROTOCOLS = new Set(['http:', 'https:']);

export function normalizeHttpUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (!SAFE_PROTOCOLS.has(parsed.protocol)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function extractFileNameFromUrl(
  value: string | null | undefined,
  fallback = 'file',
): string {
  const safeUrl = normalizeHttpUrl(value);
  if (!safeUrl) return fallback;

  try {
    const clean = safeUrl.split('?')[0];
    return decodeURIComponent(clean.split('/').pop() ?? fallback);
  } catch {
    return fallback;
  }
}
