# Life OS — Comprehensive Codebase Bug & Quality Audit Report

**Date of Audit:** November 25, 2026  
**Auditor:** Senior Full-Stack QA Engineer & Code Auditor  
**Repository:** `C:\lets do it\`  
**Target Applications:** Life OS Frontend (React 19, TypeScript, Vite) & Jarvis News Backend (FastAPI, Python)

---

## Executive Summary

A deep code audit of the entire Life OS application was conducted across six high-risk areas:
1. **State & Data Sync Bugs (IndexedDB + Supabase)**
2. **Date, Time & Overdue Logic (`date-fns`)**
3. **UI, Layout & Theme Glitches (Light / Dark Mode + Tailwind v4)**
4. **Broken Flows, Dead Buttons & Wiring Issues**
5. **News Backend & API Integration (`news-backend/`)**
6. **Static & Build Health (`vitest`, `oxlint`, `tsc`)**

While the core functionality and test suite are passing (25 test files, 235 tests pass; `tsc -b` and `vite build` complete cleanly), several critical vulnerabilities exist around **authentication lifecycle crashes**, **cross-account data contamination via IndexedDB**, **data loss on page refresh in Placement HQ**, and **timezone offset discrepancies** when completing tasks in early-morning hours.

Below is the complete catalog of identified bugs grouped strictly by severity, followed by a proposed 4-batch execution plan.

---

## P0 — Critical (App Crashes, Data Loss, Broken Auth/Sync)

### 1. `AuthContext.tsx` — Temporal Dead Zone (TDZ) ReferenceError on Expired Session
- **File & Line:** `src/context/AuthContext.tsx:270`
- **What breaks in practice:** When a user visits the app with an expired or revoked Supabase session token (`isExpiredOrRevoked`), the application throws an unhandled `ReferenceError: Cannot access 'signOut' before initialization`, causing an unrecoverable blank screen error boundary crash.
- **Root cause:** The `useEffect` that restores the session calls `signOut()` at line 270, but `const signOut = useCallback(...)` is declared 237 lines further down at line 507. In JavaScript, `const` declarations are in the Temporal Dead Zone (TDZ) prior to execution.
- **Proposed fix:** Hoist the signout logic into a named function or move the `signOut` callback declaration above the restore session `useEffect`.

---

### 2. `localMigrationService.ts` & `AuthContext.tsx` — Cross-Account Data Contamination & Leaked Tasks via IndexedDB
- **File & Line:** `src/services/localMigrationService.ts:84` & `src/context/AuthContext.tsx:507-532`
- **What breaks in practice:** When User A signs out and User B logs in on the same browser (or a guest creates tasks and then a user signs in), User A's private tasks and notes stored in IndexedDB (`lifeos_db`) are read by `migrateLocalDataToCloud(userB.id)` and permanently pushed into User B's Supabase account.
- **Root cause:** `signOut()` in `AuthContext.tsx` removes auth tokens from `localStorage`, but leaves all records inside IndexedDB. `migrateLocalDataToCloud` then blindly reads `getAllTasks()` from IndexedDB without verifying `task.userId === currentUserId`.
- **Proposed fix:**
  1. In `AuthContext.tsx`, call `clearAllData()` on `signOut()` to purge all cached local IndexedDB tables.
  2. In `migrateLocalDataToCloud`, only migrate tasks that have no `userId` or match the current authenticated user.

---

## P1 — High (Broken Core Features, Wrong Date/Overdue Logic, Data Loss)

### 3. `PlacementHQPage.tsx` — Weekly Schedule Goals Wiped on Every Page Refresh (Data Loss)
- **File & Line:** `src/pages/PlacementHQPage.tsx:145-146`
- **What breaks in practice:** Any study goals, problem checklists, or milestones added to the weekly schedule in Placement Training HQ are permanently erased whenever the user refreshes the page or navigates between tabs.
- **Root cause:** `loadState()` attempts to rebuild the week plan by executing `return { ...parsed, weekPlan: buildWeekPlan() };`. Because `buildWeekPlan()` initializes all days with empty `goals: []`, any existing user-created goals in `parsed.weekPlan` are discarded.
- **Proposed fix:** Preserve existing goals by mapping over `buildWeekPlan()` and merging the `goals` array from `parsed.weekPlan` for matching dates.

---

### 4. `PremiumHomeDashboard.tsx` & `streakEngine.ts` — Timezone Offset Bug in Task Completion and Overdue Checks
- **File & Line:** `src/components/dashboard/PremiumHomeDashboard.tsx:168`, `src/utils/streakEngine.ts:50` & `135`
- **What breaks in practice:** If a user completes a task in early morning local time (e.g. between 12:00 AM and 5:29 AM IST), the completion is recorded in UTC with yesterday's date. The task disappears from today's completed missions, streak calculations record 0 completions for today, and unbroken streaks are prematurely terminated.
- **Root cause:** Direct string slicing `t.completedAt.slice(0, 10)` extracts the UTC date rather than the user's local timezone date.
- **Proposed fix:** Replace `iso.slice(0, 10)` on timestamps with `format(parseISO(iso), 'yyyy-MM-dd')` to accurately evaluate the user's local calendar day.

---

### 5. `PlannerPage.tsx` — Cross-Tab Task Desynchronization (Home Tasks Disappear from Planner)
- **File & Line:** `src/pages/PlannerPage.tsx:44-45`
- **What breaks in practice:** When a user sets a target date or schedules a task on the Home page or Tasks Hub (which sets `targetDate` and `scheduledDate`), navigating to the Calendar Planner tab displays 0 tasks for that day.
- **Root cause:** `PlannerPage.tsx` only filters tasks by `t.dueDate !== viewDate`, completely ignoring `t.scheduledDate` and `t.targetDate`.
- **Proposed fix:** Update filter to check:
  `const taskDate = (t.scheduledDate || t.targetDate || t.dueDate || '').slice(0, 10); if (taskDate !== viewDate) return false;`.

---

### 6. `localMigrationService.ts` — Soft-Deleted Tasks (Recycle Bin) Resurrected to Active Cloud Tasks
- **File & Line:** `src/services/localMigrationService.ts:100-108`
- **What breaks in practice:** Tasks placed in the Recycle Bin (`isDeleted: true`) on the local device are restored to active status in Supabase during data migration.
- **Root cause:** The migration loop only checks `!cloudTaskIdSet.has(lt.id) && lt.title`, omitting `!lt.isDeleted`.
- **Proposed fix:** Add `&& !lt.isDeleted` in `migrateLocalDataToCloud`.

---

### 7. `taskService.ts` — Missing Column Failure on Supabase Tasks Table Breaks Sync
- **File & Line:** `src/services/taskService.ts:238-252` & `264-280`
- **What breaks in practice:** When creating or editing tasks with starred flags, custom lists, or subtasks, if the user's Supabase instance has not run migration `20261117120000_add_task_management_extensions.sql`, Postgres returns `column "is_starred" does not exist`. `taskService` throws a hard error and the UI displays a persistent "Sync Error — offline mode" banner.
- **Root cause:** `taskToDbRow` sends extended columns (`is_starred`, `list_id`, `reminder_date`, etc.) without a graceful retry fallback that strips unmigrated columns and encodes them into `notes`.
- **Proposed fix:** Catch missing column errors in `createCloudTask` and `updateCloudTask`, strip the unsupported extension columns, and re-attempt the save.

---

### 8. `news-backend/config.py` — Vercel Production Domain Blocked by CORS
- **File & Line:** `news-backend/config.py:21`
- **What breaks in practice:** When Life OS is loaded from Vercel (`https://lets-do-it-cr4w.vercel.app`), news API calls to the Jarvis news backend fail with browser console error: `Access to fetch at ... has been blocked by CORS policy`.
- **Root cause:** `FRONTEND_ORIGINS` default only permits `http://localhost:5173`, `http://127.0.0.1:5173`, and `http://localhost:3000`.
- **Proposed fix:** Add `https://*.vercel.app` (or configure `allow_origin_regex`) to allow production and preview deployments.

---

## P2 — Medium (UI / Alignment Bugs, Dark/Light Mode Contrast, Console Warnings)

### 9. `TaskBuilderPage.tsx`, `SettingsPage.tsx` — Hardcoded Dark Inputs and Low Contrast in Light Mode
- **File & Line:** `src/pages/TaskBuilderPage.tsx:784`, `1157`, `1508`, `2469-2950` (88 hardcoded `#070A12` dark values)
- **What breaks in practice:** When Light Mode is activated, the Tasks Hub displays pure black input backgrounds (`#070A12`) with bright cyan neon borders, while other pages show dark panels clashing with the light base.
- **Root cause:** Hardcoded dark hex strings are used in inline styles instead of CSS variables (`var(--bg-surface)`, `var(--text-primary)`, `var(--border)`).
- **Proposed fix:** Replace hardcoded `#070A12` backgrounds with `var(--bg-surface)` or conditional `isLight` tokens.

---

### 10. `UniversalSearchModal.tsx` & `App.tsx` — Duplicate `Ctrl+K` Listener Trigger Collision
- **File & Line:** `src/components/search/UniversalSearchModal.tsx:53` vs `src/App.tsx:165`
- **What breaks in practice:** Pressing `Ctrl + K` or `Cmd + K` occasionally triggers double-toggling (opening and immediately closing the search modal).
- **Root cause:** Both `App.tsx` and `UniversalSearchModal.tsx` register global `keydown` listeners on `window` for `Ctrl + K`.
- **Proposed fix:** Manage the shortcut solely in `App.tsx` and remove the redundant global listener inside `UniversalSearchModal.tsx`.

---

### 11. `FloatingAiAssistant.tsx` — Nova AI Bubble Obstructs Calendar Cells & Mobile Controls
- **File & Line:** `src/components/ai/FloatingAiAssistant.tsx:677-681`
- **What breaks in practice:** The floating Nova AI trigger button is positioned at `bottom: 24px, right: 24px` with a fixed high z-index (`9990`), directly obscuring bottom-right calendar date cells and overlapping mobile bottom navigation targets.
- **Root cause:** Fixed position coordinates lack viewport collision avoidance.
- **Proposed fix:** Adjust default desktop offset and ensure mobile bottom inset clears navigation controls (`bottom: calc(76px + env(safe-area-inset-bottom, 10px))`).

---

### 12. `WeeklyReviewPage.tsx` — Recurring Habit Templates Falsely Counted as Overdue
- **File & Line:** `src/pages/WeeklyReviewPage.tsx:109`
- **What breaks in practice:** The weekly review summary displays inflated overdue counts (e.g. "37 overdue tasks") because recurring habit root templates created in prior weeks are treated as overdue one-time tasks.
- **Root cause:** Filter checks `t.dueDate < today()` without filtering out active recurring templates (`t.recurring && t.recurring !== 'none'`).
- **Proposed fix:** Exclude recurring templates from the overdue query in `WeeklyReviewPage.tsx`.

---

### 13. `AppContext.tsx` — Synchronous `setState` Inside `useEffect` Triggering Cascading Re-renders
- **File & Line:** `src/context/AppContext.tsx:1301` & `1349`
- **What breaks in practice:** React Compiler and Oxlint flag cascading render cycles when recurring tasks or streaks update.
- **Root cause:** Effects directly call `generateRecurringTasksForDate` and `updateSettings` synchronously during render updates.
- **Proposed fix:** Guard invocations with refs (`lastGeneratedDateRef`, `lastSavedStreakRef`) to ensure they execute only once when the respective values genuinely change.

---

## P3 — Low (Minor UX Polish, Edge Cases)

### 14. `TaskBuilderPage.tsx` — Unhandled Rejection on Audio Autoplay Policy
- **File & Line:** `src/pages/TaskBuilderPage.tsx:225`
- **What breaks in practice:** When a Pomodoro or quest timer completes, `playAnimeSound('levelup')` may produce an unhandled console warning if browser autoplay policy blocks unmuted audio.
- **Root cause:** Lack of `.catch(() => {})` on the audio playback promise.
- **Proposed fix:** Wrap audio play calls in safe try-catch / promise catch handlers.

---

### 15. `Oxlint` — 90 Static Linter Warnings
- **File & Line:** Across `src/services/aiService.ts`, `api/ai.ts`, `NotesPage.tsx`
- **What breaks in practice:** Developer console noise, Fast Refresh warnings on multi-exports, and unused catch parameters (`_err`).
- **Root cause:** Leftover unused variable bindings and mixed component/helper exports.
- **Proposed fix:** Clean unused bindings and extract helper utilities into dedicated files.

---

## Recommended Execution Batches

To resolve all identified issues safely without introducing regressions, execute the fixes in the following 4 sequential batches:

### **Batch 1: P0 Critical (Data Safety & Crash Fixes)**
- **Target 1:** Fix the TDZ `signOut` initialization crash in `src/context/AuthContext.tsx`.
- **Target 2:** Purge IndexedDB on `signOut()` and enforce `userId` checks in `src/services/localMigrationService.ts` to prevent cross-account task leakage.
- **Validation:** Run `npm run test` and verify signout/signin transitions.

### **Batch 2: P1 High (Date Logic, Sync & Placement Data Loss)**
- **Target 1:** Fix goal array erasure in `src/pages/PlacementHQPage.tsx` on page reload.
- **Target 2:** Resolve UTC vs local IST date discrepancies across `PremiumHomeDashboard.tsx` and `streakEngine.ts`.
- **Target 3:** Synchronize `PlannerPage.tsx` with `targetDate` and `scheduledDate`.
- **Target 4:** Filter out soft-deleted Recycle Bin tasks from `localMigrationService.ts`.
- **Target 5:** Add missing-column graceful retry in `src/services/taskService.ts`.
- **Target 6:** Update CORS origins in `news-backend/config.py` for Vercel.
- **Validation:** Run `npm run test` and `npm run build`.

### **Batch 3: P2 Medium (UI, Themes & Keydown Collisions)**
- **Target 1:** Replace hardcoded `#070A12` dark inputs in `TaskBuilderPage.tsx` with theme-aware tokens.
- **Target 2:** Remove duplicate `Ctrl+K` keydown listener in `UniversalSearchModal.tsx`.
- **Target 3:** Adjust floating Nova AI trigger positioning to prevent overlapping calendar days.
- **Target 4:** Exclude recurring tasks from overdue count in `WeeklyReviewPage.tsx`.
- **Target 5:** Guard recurring task generator in `AppContext.tsx` with date refs to prevent cascading renders.
- **Validation:** Test Light/Dark theme switching on Home and Tasks Hub.

### **Batch 4: P3 Low (Linter & Polish)**
- **Target 1:** Clean up Oxlint warnings and unused catch parameters.
- **Target 2:** Add safe catch to anime audio playback.
- **Validation:** Run `npm run lint`, `npm run test`, and `npm run build`.
