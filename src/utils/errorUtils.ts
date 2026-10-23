// Universal, Safe Error Extraction and Formatting for LifeMap OS
// Handles JavaScript Error objects, Supabase PostgrestError, AuthError, StorageError, and unknown rejections.
// Guarantees that "[object Object]" is NEVER displayed to users.
// Ensures tokens, secrets, and sensitive credentials are sanitized from logs.

export interface SafeErrorInfo {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
  status?: number;
  statusCode?: string | number;
  operation?: string;
  isSchemaMissing?: boolean;
  isAuthError?: boolean;
  isRlsError?: boolean;
  isNetworkError?: boolean;
}

/**
 * Sanitizes strings to prevent sensitive credentials or tokens from leaking into logs or UI.
 */
export function sanitizeDiagnostics(input: string): string {
  if (!input) return '';
  return input
    .replace(/Bearer\s+([A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*)/gi, 'Bearer [REDACTED_TOKEN]')
    .replace(/sb_publishable_[A-Za-z0-9_-]+/g, 'sb_publishable_[REDACTED]')
    .replace(/sb_secret_[A-Za-z0-9_-]+/g, 'sb_secret_[REDACTED]')
    .replace(/eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/g, '[REDACTED_JWT]');
}

/**
 * Parses any arbitrary error (JS Error, Supabase error object, string, or unknown) into structured, safe info.
 */
export function extractErrorInfo(err: unknown, operation = 'Operation'): SafeErrorInfo {
  if (err === null || err === undefined) {
    return {
      message: `${operation} failed with an unknown error.`,
      operation,
    };
  }

  // 1. If error is already a primitive string
  if (typeof err === 'string') {
    const sanitized = sanitizeDiagnostics(err.trim());
    return {
      message: sanitized || `${operation} failed.`,
      operation,
      isSchemaMissing: isSchemaErrorString(sanitized),
      isAuthError: isAuthErrorString(sanitized),
      isRlsError: isRlsErrorString(sanitized),
      isNetworkError: isNetworkErrorString(sanitized),
    };
  }

  // 2. If error is an object (JS Error or plain Supabase error)
  if (typeof err === 'object') {
    const errorObj = err as Record<string, unknown>;

    // Extract potential error message
    let rawMessage = '';
    if (typeof errorObj.message === 'string' && errorObj.message.trim()) {
      rawMessage = errorObj.message.trim();
    } else if (typeof errorObj.error_description === 'string' && errorObj.error_description.trim()) {
      rawMessage = errorObj.error_description.trim();
    } else if (typeof errorObj.error === 'string' && errorObj.error.trim()) {
      rawMessage = errorObj.error.trim();
    } else if (typeof errorObj.details === 'string' && errorObj.details.trim()) {
      rawMessage = errorObj.details.trim();
    } else if (typeof errorObj.msg === 'string' && errorObj.msg.trim()) {
      rawMessage = errorObj.msg.trim();
    }

    // Extract codes and hints
    const code = typeof errorObj.code === 'string' || typeof errorObj.code === 'number'
      ? String(errorObj.code)
      : undefined;
    const details = typeof errorObj.details === 'string' && errorObj.details.trim()
      ? errorObj.details.trim()
      : undefined;
    const hint = typeof errorObj.hint === 'string' && errorObj.hint.trim()
      ? errorObj.hint.trim()
      : undefined;
    const status = typeof errorObj.status === 'number'
      ? errorObj.status
      : undefined;
    const statusCode = errorObj.statusCode as string | number | undefined;

    // If still no message found, avoid String(err) returning "[object Object]"
    if (!rawMessage) {
      try {
        const json = JSON.stringify(err);
        if (json && json !== '{}') {
          rawMessage = `${operation} error: ${json}`;
        } else {
          rawMessage = `${operation} encountered an unspecified error.`;
        }
      } catch {
        rawMessage = `${operation} encountered an unspecified error.`;
      }
    }

    const cleanMessage = sanitizeDiagnostics(rawMessage);
    const cleanDetails = details ? sanitizeDiagnostics(details) : undefined;
    const cleanHint = hint ? sanitizeDiagnostics(hint) : undefined;

    const isSchema = isSchemaError(code, cleanMessage, cleanDetails);
    const isAuth = isAuthError(code, status, cleanMessage);
    const isRls = isRlsError(code, cleanMessage);
    const isNet = isNetworkErrorString(cleanMessage);

    return {
      message: cleanMessage,
      code,
      details: cleanDetails,
      hint: cleanHint,
      status,
      statusCode,
      operation,
      isSchemaMissing: isSchema,
      isAuthError: isAuth,
      isRlsError: isRls,
      isNetworkError: isNet,
    };
  }

  return {
    message: `${operation} failed (${String(err)}).`,
    operation,
  };
}

// ── Classification Helpers ───────────────────────────────────────────────────

function isSchemaErrorString(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes('schema cache') ||
    lower.includes('pgrst204') ||
    lower.includes('pgrst205') ||
    lower.includes('42p01') ||
    lower.includes('does not exist') ||
    lower.includes('relation') && lower.includes('not found') ||
    lower.includes('bucket not found') ||
    lower.includes('nosuchbucket')
  );
}

function isSchemaError(code?: string, message?: string, details?: string): boolean {
  if (code === 'PGRST205' || code === 'PGRST204' || code === '42P01') return true;
  if (message && isSchemaErrorString(message)) return true;
  if (details && isSchemaErrorString(details)) return true;
  return false;
}

function isAuthErrorString(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes('invalid login credentials') ||
    lower.includes('invalid api key') ||
    lower.includes('jwt') ||
    lower.includes('token is expired') ||
    lower.includes('token expired') ||
    lower.includes('unauthorized') ||
    lower.includes('pgrst301')
  );
}

function isAuthError(code?: string, status?: number, message?: string): boolean {
  if (status === 401 || status === 403 || code === 'PGRST301' || code === '401') return true;
  if (message && isAuthErrorString(message)) return true;
  return false;
}

function isRlsErrorString(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes('row-level security') ||
    lower.includes('violates row-level security policy') ||
    lower.includes('permission denied') ||
    lower.includes('42501')
  );
}

function isRlsError(code?: string, message?: string): boolean {
  if (code === '42501') return true;
  if (message && isRlsErrorString(message)) return true;
  return false;
}

function isNetworkErrorString(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('network request failed') ||
    lower.includes('load failed') ||
    lower.includes('err_connection_refused')
  );
}

// ── User-Facing Formatter ────────────────────────────────────────────────────

/**
 * Returns a human-friendly, actionable error message guaranteed to never be "[object Object]".
 */
export function formatSafeErrorMessage(err: unknown, fallback = 'Operation failed'): string {
  const info = extractErrorInfo(err, fallback);

  // If table or storage bucket is missing in Supabase
  if (info.isSchemaMissing) {
    const msg = info.message.toLowerCase();
    if (msg.includes('user_uploads') || msg.includes('media-vault')) {
      return "Storage bucket or 'user_uploads' table is not yet initialized in Supabase. Please execute the SQL migration in supabase/migrations/20261016100000_create_media_vault_and_uploads.sql.";
    }
    if (msg.includes('schedules')) {
      return "Database table 'schedules' is not yet initialized in Supabase. Please execute the SQL migration in supabase/migrations/20261016000000_create_schedules_and_notes_tables.sql.";
    }
    if (msg.includes('notes')) {
      return "Database table 'notes' is not yet initialized in Supabase. Please execute the SQL migration in supabase/migrations/20261016000000_create_schedules_and_notes_tables.sql.";
    }
    if (msg.includes('tasks')) {
      return "Database table 'tasks' is not yet initialized in Supabase. Please execute the SQL migration in supabase/migrations/20261011000000_create_tasks_table.sql.";
    }
    return `Database schema setup is pending: ${info.message}. Please run the required SQL migration in your Supabase SQL Editor.`;
  }

  // If authentication failed
  if (info.isAuthError) {
    return 'Authentication failed connecting to Supabase. Check your Supabase API key or sign in again.';
  }

  // If RLS blocked the operation
  if (info.isRlsError) {
    return 'Permission denied by Row-Level Security policy. Ensure you are signed in and own this record.';
  }

  // If network connection failed
  if (info.isNetworkError) {
    return 'Network connection issue. Please check your internet connection.';
  }

  // Ensure output is non-empty and never "[object Object]"
  if (!info.message || info.message === '[object Object]') {
    return fallback;
  }

  return info.message;
}

/**
 * Logs comprehensive diagnostics to developer console safely without leaking tokens or keys.
 */
export function logSafeError(operation: string, err: unknown): void {
  const info = extractErrorInfo(err, operation);
  console.error(`[LifeMap Diagnostics] ${operation} failed:`, {
    message: info.message,
    code: info.code ?? 'none',
    details: info.details ?? 'none',
    hint: info.hint ?? 'none',
    status: info.status ?? info.statusCode ?? 'none',
    isSchemaMissing: Boolean(info.isSchemaMissing),
    isAuthError: Boolean(info.isAuthError),
    isRlsError: Boolean(info.isRlsError),
  });
}
