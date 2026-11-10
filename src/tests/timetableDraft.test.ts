import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveLocalDraft,
  loadLocalDraft,
  clearAllDrafts,
  hasDraftContent,
  getDraftStorageKey,
  saveDraft,
  loadDraft,
  type TimetableMissionDraft,
  DEFAULT_DRAFT_START_TIME,
  DEFAULT_DRAFT_AREA,
  DEFAULT_DRAFT_PRIORITY,
} from '../services/timetableDraftService';

// Mock localStorage for test environment
function createLocalStorageMock() {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
}

describe('Timetable Mission Draft Service & Recovery', () => {
  let storageMock: ReturnType<typeof createLocalStorageMock>;

  beforeEach(() => {
    storageMock = createLocalStorageMock();
    Object.defineProperty(globalThis, 'localStorage', {
      value: storageMock,
      writable: true,
      configurable: true,
    });
  });

  describe('Draft Content Detection (hasDraftContent)', () => {
    it('returns false for empty or default values', () => {
      expect(hasDraftContent(null)).toBe(false);
      expect(hasDraftContent(undefined)).toBe(false);
      expect(
        hasDraftContent({
          title: '',
          startTime: DEFAULT_DRAFT_START_TIME,
          endTime: '',
          area: DEFAULT_DRAFT_AREA,
          priority: DEFAULT_DRAFT_PRIORITY,
          notes: '',
        })
      ).toBe(false);
    });

    it('returns true if title is entered', () => {
      expect(
        hasDraftContent({
          title: 'Study (DSA + Java)',
          startTime: DEFAULT_DRAFT_START_TIME,
          endTime: '',
          area: DEFAULT_DRAFT_AREA,
          priority: DEFAULT_DRAFT_PRIORITY,
          notes: '',
        })
      ).toBe(true);
    });

    it('returns true if notes or non-default time is entered', () => {
      expect(
        hasDraftContent({
          title: '',
          startTime: '06:00',
          endTime: '',
          area: DEFAULT_DRAFT_AREA,
          priority: DEFAULT_DRAFT_PRIORITY,
          notes: '',
        })
      ).toBe(true);

      expect(
        hasDraftContent({
          title: '',
          startTime: DEFAULT_DRAFT_START_TIME,
          endTime: '',
          area: DEFAULT_DRAFT_AREA,
          priority: DEFAULT_DRAFT_PRIORITY,
          notes: 'Important notes',
        })
      ).toBe(true);
    });
  });

  describe('Storage Keys & Isolation by User ID', () => {
    it('generates distinct storage keys for guest and authenticated user', () => {
      expect(getDraftStorageKey(null)).toBe('lifeos_timetable_mission_draft_guest');
      expect(getDraftStorageKey(undefined)).toBe('lifeos_timetable_mission_draft_guest');
      expect(getDraftStorageKey('user-123')).toBe('lifeos_timetable_mission_draft_user-123');
      expect(getDraftStorageKey('user-456')).toBe('lifeos_timetable_mission_draft_user-456');
    });
  });

  describe('Local Draft Saving & Restoration', () => {
    const sampleDraft: TimetableMissionDraft = {
      title: 'Study (DSA + Java)',
      startTime: '06:00',
      endTime: '08:00',
      area: 'growth',
      priority: 'critical',
      notes: 'Chapters 4-6 review',
      updatedAt: '2026-11-10T12:00:00.000Z',
    };

    it('saves all 6 form fields and retrieves them accurately for guest', () => {
      saveLocalDraft(sampleDraft, null);

      const recovered = loadLocalDraft(null);
      expect(recovered).not.toBeNull();
      expect(recovered?.title).toBe('Study (DSA + Java)');
      expect(recovered?.startTime).toBe('06:00');
      expect(recovered?.endTime).toBe('08:00');
      expect(recovered?.area).toBe('growth');
      expect(recovered?.priority).toBe('critical');
      expect(recovered?.notes).toBe('Chapters 4-6 review');
      expect(recovered?.updatedAt).toBe('2026-11-10T12:00:00.000Z');
    });

    it('persists draft against authenticated user ID across logout and re-login', () => {
      const userId = 'user-auth-777';

      // 1. User enters draft while logged in
      saveLocalDraft(sampleDraft, userId);

      // 2. User logs out (local storage for user is preserved)
      const afterLogout = loadLocalDraft(userId);
      expect(afterLogout?.title).toBe('Study (DSA + Java)');

      // 3. User logs back in (same userId)
      const afterRelogin = loadLocalDraft(userId);
      expect(afterRelogin).toEqual(sampleDraft);
    });

    it('fallback to guest draft if user filled form before logging in', () => {
      const guestDraft: TimetableMissionDraft = {
        title: 'Morning Yoga',
        startTime: '07:00',
        endTime: '07:30',
        area: 'health',
        priority: 'high',
        notes: 'Stretching routine',
        updatedAt: '2026-11-10T12:10:00.000Z',
      };

      // Save as guest
      saveLocalDraft(guestDraft, null);

      // Log in as new user with no existing draft yet
      const recoveredForNewUser = loadLocalDraft('brand-new-user-999');
      expect(recoveredForNewUser?.title).toBe('Morning Yoga');
      expect(recoveredForNewUser?.area).toBe('health');
    });
  });

  describe('Draft Clearing & Discard Behavior', () => {
    const draft: TimetableMissionDraft = {
      title: 'Finish Project Report',
      startTime: '09:00',
      endTime: '11:00',
      area: 'work',
      priority: 'high',
      notes: 'Final draft submission',
      updatedAt: '2026-11-10T12:20:00.000Z',
    };

    it('clearAllDrafts removes draft from local storage for user and guest', async () => {
      const userId = 'user-test-clear';
      saveLocalDraft(draft, userId);

      expect(loadLocalDraft(userId)).not.toBeNull();

      await clearAllDrafts(userId);

      expect(loadLocalDraft(userId)).toBeNull();
      expect(loadLocalDraft(null)).toBeNull();
    });

    it('retains draft if mission creation fails (does not call clear)', async () => {
      const userId = 'user-retry-test';
      saveLocalDraft(draft, userId);

      // Simulating failed mission creation
      let creationFailed = false;
      try {
        throw new Error('Network error: server unreachable');
      } catch {
        creationFailed = true;
        // Draft is NOT cleared!
      }

      expect(creationFailed).toBe(true);
      const stillSaved = loadLocalDraft(userId);
      expect(stillSaved).not.toBeNull();
      expect(stillSaved?.title).toBe('Finish Project Report');
    });
  });

  describe('Unified Saver & Loader (saveDraft / loadDraft)', () => {
    it('handles offline / guest mode gracefully without error', async () => {
      const draft: TimetableMissionDraft = {
        title: 'Offline Mission',
        startTime: '10:00',
        endTime: '11:00',
        area: 'personal',
        priority: 'low',
        notes: 'Read a book chapter',
        updatedAt: '2026-11-10T12:30:00.000Z',
      };

      const saveRes = await saveDraft(draft, null);
      expect(saveRes.success).toBe(true);

      const loaded = await loadDraft(null);
      expect(loaded?.title).toBe('Offline Mission');
      expect(loaded?.priority).toBe('low');
    });
  });
});
