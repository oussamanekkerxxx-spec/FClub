/**
 * Typed error classes for consistent error handling across the app.
 *
 * Usage in data access / hooks:
 *   throw new DatabaseError(supabaseError)
 *
 * Usage at call sites:
 *   catch (err) {
 *     if (err instanceof DatabaseError) toast.error(err.message);
 *     else throw err; // re-throw unexpected errors
 *   }
 */

export class DatabaseError extends Error {
  readonly originalError: { message?: string; code?: string; details?: string };
  constructor(originalError: { message?: string; code?: string; details?: string }) {
    super(originalError.message ?? 'Database operation failed');
    this.name = 'DatabaseError';
    this.originalError = originalError;
  }
}

export class UploadError extends Error {
  readonly originalError: unknown;
  constructor(message: string, originalError?: unknown) {
    super(message);
    this.name = 'UploadError';
    this.originalError = originalError;
  }
}

export class AuthError extends Error {
  readonly originalError: unknown;
  constructor(message: string, originalError?: unknown) {
    super(message);
    this.name = 'AuthError';
    this.originalError = originalError;
  }
}

/**
 * Safely extract a message string from an unknown catch value.
 * Use in catch blocks instead of annotating `e: any`.
 *
 * @example
 *   } catch (e) { toast.error(errMsg(e)); }
 */
export function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : 'error';
}

/**
 * Normalize user-entered emails to avoid casing/whitespace mismatch issues.
 */
export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Lightweight error reporting helper.
 * Uses Sentry when present and keeps console output in development.
 */
export function reportError(context: string, error: unknown, extra?: Record<string, unknown>): void {
  try {
    const sentry = (globalThis as { Sentry?: { captureException?: (...args: unknown[]) => void } }).Sentry;
    if (sentry?.captureException) {
      sentry.captureException(error, { tags: { context }, extra });
    }
  } catch {
    // Never crash app flows while reporting errors.
  }

  if (import.meta.env.DEV) {
    console.error(`[${context}]`, error, extra);
  }
}
