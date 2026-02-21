# Eisenhower Matrix - Task List

**Parent Task ID:** 1
**Feature:** Eisenhower Matrix - Complete Missing Features

---

## Task 2: Fix performance: add useMemo to useTasks hook
- **Status:** ✅ Completed
- **Files:** `src/hooks/use-tasks.ts`, `src/components/EditTaskModal.tsx`, `src/components/QuickAddModal.tsx`
- **What was done:**
  - Wrapped `tasksWithMetrics` in `useMemo`
  - Fixed order assignment bug (max order + 1 instead of length)
  - Memoized return object
  - Added `parseInt` radix parameter

---

## Task 3: Fix accessibility: add aria-labels and keyboard navigation
- **Status:** ✅ Completed
- **Files:** `src/components/TaskCard.tsx`, `src/pages/TaskList.tsx`, `src/pages/DailyFocus.tsx`
- **What was done:**
  - Added aria-labels to drag handle, completion toggle, delete buttons
  - Added `group-focus-within:opacity-100` for keyboard access to hidden buttons
  - Added `role="button"`, `tabIndex={0}`, and `onKeyDown` handlers to clickable divs

---

## Task 4: Add dark mode toggle to sidebar
- **Status:** ✅ Completed
- **Files:** `src/App.tsx`, `src/components/AppSidebar.tsx`
- **What was done:**
  - Wrapped App with `next-themes` ThemeProvider
  - Added toggle button in SidebarFooter (cycles light → dark → system)

---

## Task 5: Add toast notifications on task actions
- **Status:** ✅ Completed
- **Files:** `src/hooks/use-tasks.ts`
- **What was done:**
  - Added sonner toasts for addTask, deleteTask (with Undo), completion, and moveToQuadrant

---

## Task 6: Add delete confirmation dialog
- **Status:** ✅ Completed
- **Files:** `src/components/TaskCard.tsx`, `src/pages/TaskList.tsx`
- **Description:** Prevent accidental deletions with an AlertDialog confirmation.
- **What to do:**
  1. Use shadcn `AlertDialog` in `TaskCard.tsx` and `TaskList.tsx`
  2. Show task title in the confirmation message
- **Acceptance Criteria:**
  - Confirmation dialog appears on delete click
  - Confirm triggers `deleteTask`; Cancel dismisses
  - `npx tsc --noEmit` passes

---

## Task 7: Add recharts visualizations to Stats page
- **Status:** 🔲 Open
- **Files:** `src/pages/Stats.tsx`
- **Description:** Use `recharts` to add visual data representation to the Stats page.
- **What to do:**
  1. Add PieChart for quadrant distribution
  2. Add BarChart for completed vs pending tasks
  3. Add summary donut chart for overall completion rate
- **Acceptance Criteria:**
  - Charts render with matching quadrant colors
  - Charts are responsive and have tooltips
  - `npx tsc --noEmit` passes

---

## Task 8: Add Export/Import functionality for task data
- **Status:** 🔲 Open
- **Files:** `src/hooks/use-tasks.ts`, `src/components/DataManagement.tsx`
- **Description:** Allow users to backup and restore task data via JSON.
- **What to do:**
  1. Add `exportTasks` and `importTasks` to `use-tasks.ts`
  2. Create `DataManagement.tsx` component with Export/Import buttons
- **Acceptance Criteria:**
  - Export downloads a dated `.json` file
  - Import validates schema and confirms before replacing data
  - `npx tsc --noEmit` passes

---

## Task 9: Add Settings page with data management and preferences
- **Status:** 🔲 Open
- **Depends on:** Task 8
- **Files:** `src/pages/Settings.tsx`, `src/App.tsx`, `src/components/AppSidebar.tsx`
- **Description:** Create a dedicated settings area.
- **What to do:**
  1. Create `src/pages/Settings.tsx` including Data Management and "Clear All Data"
  2. Add route and sidebar navigation item
- **Acceptance Criteria:**
  - Settings page accessible at `/settings`
  - Includes functional export/import and clear data buttons
  - `npx tsc --noEmit` passes

---

## Task 10: Add task tags/labels system
- **Status:** 🔲 Open
- **Files:** `src/types/task.ts`, `src/hooks/use-tasks.ts`, `src/components/QuickAddModal.tsx`, `src/components/EditTaskModal.tsx`, `src/components/TaskCard.tsx`, `src/pages/TaskList.tsx`
- **Description:** Implement a color-coded tagging system for tasks.
- **What to do:**
  1. Add `tags: string[]` to Task interface
  2. Add tag selector to Add/Edit modals
  3. Display tag badges on `TaskCard` and add tag filter to `TaskList`
- **Acceptance Criteria:**
  - Tasks support multiple tags
  - Tags are visible and filterable
  - `npx tsc --noEmit` passes

---

## Task 11: Add keyboard shortcuts
- **Status:** 🔲 Open
- **Files:** `src/hooks/use-keyboard-shortcuts.ts`, `src/components/KeyboardShortcutsDialog.tsx`, `src/components/Layout.tsx`, `src/pages/Index.tsx`
- **Description:** Add global hotkeys for power users.
- **What to do:**
  1. Create `use-keyboard-shortcuts.ts` hook
  2. Implement `Ctrl+N` (Quick Add), `Ctrl+/` (Help), and `1-4` (Navigation)
  3. Create `KeyboardShortcutsDialog.tsx` to list shortcuts
- **Acceptance Criteria:**
  - Shortcuts work globally but not in inputs
  - Help dialog is accessible
  - `npx tsc --noEmit` passes

---

## Task 12: Add unit tests for use-tasks hook and task types
- **Status:** 🔲 Open
- **Files:** `src/test/use-tasks.test.ts`, `src/test/task-types.test.ts`
- **Description:** Replace placeholder tests with comprehensive coverage.
- **What to do:**
  1. Create `use-tasks.test.ts` covering CRUD, sorting, and stats
  2. Create `task-types.test.ts` for helper functions and metrics
- **Acceptance Criteria:**
  - At least 15 test cases pass
  - `npm run test` passes
  - `npx tsc --noEmit` passes

---

## Task 13: Enhanced Daily Focus with time budget and Pomodoro timer
- **Status:** 🔲 Open
- **Files:** `src/components/PomodoroTimer.tsx`, `src/pages/DailyFocus.tsx`
- **Description:** Upgrade the Daily Focus page with productivity tools.
- **What to do:**
  1. Add "Time Budget" summary (total estimated time)
  2. Create `PomodoroTimer.tsx` (25/5 intervals)
  3. Add task count selector and cross-quadrant sorting
- **Acceptance Criteria:**
  - Time budget and Pomodoro timer are functional
  - Focus task count is configurable
  - `npx tsc --noEmit` passes
