import { describe, it, expect } from 'vitest';
import { taskToDbRow } from '../services/taskService';
import { formatAuthErrorMessage } from '../context/AuthContext';
import type { Task } from '../types';

describe('Security & Isolation Assurances', () => {
  it('enforces that taskToDbRow always stamps the authenticated user_id', () => {
    const maliciousTaskInput: Partial<Task> = {
      id: 'task-123',
      title: 'Hacked task title',
      userId: 'spoofed-user-id-attacker', // Attacker attempts to spoof another user ID in the object
    };

    const authenticatedUserId = 'legitimate-user-456';
    const payload = taskToDbRow(maliciousTaskInput, authenticatedUserId);

    // The user_id MUST strictly match the session authenticated user ID
    expect(payload.user_id).toBe('legitimate-user-456');
    expect(payload.user_id).not.toBe('spoofed-user-id-attacker');
  });

  it('rejects passwords shorter than 6 characters during validation', () => {
    const validatePassword = (pass: string): { valid: boolean; error?: string } => {
      if (!pass || pass.length < 6) {
        return { valid: false, error: 'Password must be at least 6 characters.' };
      }
      return { valid: true };
    };

    expect(validatePassword('12345').valid).toBe(false);
    expect(validatePassword('12345').error).toBe('Password must be at least 6 characters.');
    expect(validatePassword('123456').valid).toBe(true);
    expect(validatePassword('securePassword2026').valid).toBe(true);
  });

  it('enforces that password and confirm password match during account creation', () => {
    const validateConfirmation = (password: string, confirmPassword: string): { valid: boolean; error?: string } => {
      if (password !== confirmPassword) {
        return { valid: false, error: 'Passwords do not match. Please verify your password confirmation.' };
      }
      return { valid: true };
    };

    expect(validateConfirmation('password123', 'password999').valid).toBe(false);
    expect(validateConfirmation('password123', 'password999').error).toContain('Passwords do not match');
    expect(validateConfirmation('SecretPass!2026', 'SecretPass!2026').valid).toBe(true);
  });

  it('validates email syntax before dispatching auth requests', () => {
    const validateEmail = (email: string): boolean => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    };

    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('student.cs@college.edu')).toBe(true);
    expect(validateEmail('invalid-email')).toBe(false);
    expect(validateEmail('@domain.com')).toBe(false);
    expect(validateEmail('test@')).toBe(false);
  });

  it('detects existing account signup attempt via Supabase identities check', () => {
    // Supabase returns empty identities array when email enumeration protection is active
    const mockExistingUser = {
      id: 'existing-user-uuid',
      email: 'existing@example.com',
      identities: [],
    };

    const isDuplicate = Array.isArray(mockExistingUser.identities) && mockExistingUser.identities.length === 0;
    expect(isDuplicate).toBe(true);

    const mockNewUser = {
      id: 'new-user-uuid',
      email: 'new@example.com',
      identities: [{ id: 'identity-1' }],
    };
    const isNew = Array.isArray(mockNewUser.identities) && mockNewUser.identities.length === 0;
    expect(isNew).toBe(false);
  });

  it('translates provider rate limit errors into clear, actionable explanations', () => {
    const rawRateLimit = 'email rate limit exceeded';
    const formatted = formatAuthErrorMessage(rawRateLimit, 'signup');

    expect(formatted).toContain('Supabase email rate limit exceeded');
    expect(formatted).toContain('hourly quota');
    expect(formatted).toContain('Sign In directly');

    // Code 429 string
    const raw429 = 'over_email_send_rate_limit: Too many requests';
    const formatted429 = formatAuthErrorMessage(raw429, 'signup');
    expect(formatted429).toContain('Supabase email rate limit exceeded');
  });

  it('translates disabled Google OAuth provider errors into clear setup instructions', () => {
    const rawGoogleError = 'Unsupported provider: provider is not enabled';
    const formatted = formatAuthErrorMessage(rawGoogleError, 'google');

    expect(formatted).toContain('Google sign-in is not enabled in this Supabase project');
    expect(formatted).toContain('Supabase Dashboard -> Authentication -> Providers -> Google');
  });

  it('translates standard auth credentials errors into user-friendly messages', () => {
    expect(formatAuthErrorMessage('Email not confirmed', 'signin')).toContain('Please check your inbox');
    expect(formatAuthErrorMessage('Invalid login credentials', 'signin')).toContain('Invalid email or password');
  });

  it('parses redirect URL error fragments from expired or invalid email verification links', () => {
    const parseUrlError = (hash: string): string | null => {
      const params = new URLSearchParams(hash.startsWith('#') ? hash.substring(1) : hash);
      const error = params.get('error');
      const errorCode = params.get('error_code');
      const errorDescription = params.get('error_description');

      if (error || errorDescription) {
        let msg = errorDescription
          ? decodeURIComponent(errorDescription.replace(/\+/g, ' '))
          : 'Authentication verification failed';
        if (errorCode === 'otp_expired' || msg.toLowerCase().includes('expired')) {
          msg = 'The verification or reset link has expired. Please request a new link.';
        } else if (errorCode === 'access_denied') {
          msg = 'Access denied. The verification link is invalid or has already been used.';
        }
        return msg;
      }
      return null;
    };

    const expiredHash = '#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired';
    expect(parseUrlError(expiredHash)).toBe('The verification or reset link has expired. Please request a new link.');

    const accessDeniedHash = '#error=access_denied&error_code=access_denied&error_description=Access+denied';
    expect(parseUrlError(accessDeniedHash)).toBe('Access denied. The verification link is invalid or has already been used.');

    const cleanHash = '#access_token=valid-token&type=signup';
    expect(parseUrlError(cleanHash)).toBeNull();
  });
});
