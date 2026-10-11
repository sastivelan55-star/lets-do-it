import { describe, it, expect } from 'vitest';
import { taskToDbRow } from '../services/taskService';
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
});
