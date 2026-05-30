# Pomodoro Timer Enhancement — Design Spec
Date: 2026-05-30

## Overview

Enhance the existing Pomodoro timer with task-based focus duration, inline editing, named presets, auto-break flow, and a timestamp-based timer that doesn't drift in background tabs.

---

## Scope (this iteration)

**In:**
- Task selector → auto-fill focus duration from `estimated_duration`
- Inline editable focus & break minutes (click to edit, override after task select)
- Named preset chips: Classic 25/5, DeskTime 52/17, Ultradian 90/20
- Auto break formula for custom durations: `max(1, round(focusMinutes / 5))`, capped at 30m
- Auto-start break immediately when focus session ends
- Break ends → timer stops, persistent notification fires, waits for user to resume
- Timestamp-based countdown (fix background tab drift)
- Completion chime on focus end and break end
- Force-focus via `requireInteraction: true` notification + `window.focus()` on click

**Out (next iteration):**
- Pomodoro session counter per task (🍅)
- Mark task complete button on focus end
- Break activity suggestions

---

## Architecture Changes

### 1. Timestamp-based Timer (`PomodoroContext.tsx`)

**Problem:** Current implementation decrements `secondsLeft` by 1 each tick. Browser throttles `setInterval` in backgrounded tabs (up to 1 tick/minute under heavy throttle), causing timer to run slow exactly when user is away.

**Fix:** Store `targetEndTime: number | null` in state. On each tick compute:
```ts
secondsLeft = Math.ceil((targetEndTime - Date.now()) / 1000)
```
Completion check: `Date.now() >= targetEndTime` (not `secondsLeft <= 0`).

Note: The notification still fires from a throttled tick — it may be up to ~1 min late under heavy throttling. This is acceptable. Drift accumulation is not.

### 2. Auto-break Flow

```
Focus ends (Date.now() >= targetEndTime)
  → play completion chime
  → fire persistent notification: "Focus done! Break starting..."
  → auto-set mode to 'break'
  → auto-start break timer (set new targetEndTime)

Break ends
  → play completion chime
  → fire persistent notification (requireInteraction: true): "Break over — ready to focus?"
  → attempt window.focus()
  → title flash: "✅ Break Done! Click Start to resume"
  → timer STOPS — wait for user to press Start
```

### 3. New Context State

Add to `PomodoroContextType`:
```ts
targetEndTime: number | null        // epoch ms, null when not running
selectedTaskId: string | null       // currently linked task
setSelectedTask: (taskId: string | null) => void
```

Remove from tick logic: direct `secondsLeft` decrement.

---

## Components

### Task Selector (new, inside `PomodoroTimer.tsx`)

- Dropdown (shadcn `Select`) listing incomplete tasks from `useTasks()`
- Displays: task title + estimated duration badge
- On select: calls `setFocusMinutes(task.estimatedDuration)` + `setSelectedTask(task.id)`
- Shows selected task name below the selector when active
- Fallback when task deleted/completed mid-session: revert to last manual minutes, clear `selectedTaskId`

### Inline Duration Editing

Replace static button labels with editable components:

**Focus button:** `Focus [input]m`
- Click on number → `<input type="number" min={1} max={90}>` inline
- Blur / Enter → commit via `setFocusMinutes(value)`
- Clears `selectedTaskId` if user manually overrides after task select

**Break button:** `Break [input]m`  
- Same pattern, `min={1} max={30}`
- If focus duration changed manually → recalculate suggestion: `max(1, round(focusMinutes/5))`
- User can still override

### Preset Chips

Row of 3 chips below the mode buttons:
```
[Classic 25/5]  [DeskTime 52/17]  [Ultradian 90/20]
```
Clicking a preset:
- Sets both `focusMinutes` and `breakMinutes` to preset values
- Clears `selectedTaskId`
- Resets timer if not running

### Completion Chime

No external file needed — synthesized via Web Audio API:
```ts
function playChime() {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = 880;
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.8);
}
```
Fires on focus end and break end. Independent of ambience volume.

---

## Break Formula (auto-calculate)

Used when focus duration comes from task select or manual input (not preset):
```ts
function suggestBreak(focusMinutes: number): number {
  return Math.min(30, Math.max(1, Math.round(focusMinutes / 5)));
}
```

Named presets use hardcoded values (not this formula):
| Preset | Focus | Break |
|--------|-------|-------|
| Classic | 25m | 5m |
| DeskTime | 52m | 17m |
| Ultradian | 90m | 20m |

---

## Notification Behavior

| Event | `requireInteraction` | Auto-dismiss |
|-------|----------------------|--------------|
| Focus ended / break starting | false | Yes (5s) |
| Break ended / awaiting resume | **true** | No — user must dismiss |

Both notifications call `window.focus()` in their `onclick` handler.

---

## localStorage Keys (unchanged)

- `pomodoro_focus_minutes`
- `pomodoro_break_minutes`
- `pomodoro_notifications_enabled`

New (session-only, not persisted): `selectedTaskId` stays in React state only — cleared on page reload.

---

## Out-of-scope Edge Cases Handled

- **Task deleted while timer running:** `selectedTaskId` ref becomes stale → detect in `useTasks` subscription, clear `selectedTaskId`, keep current timer running with existing minutes
- **Timer running when preset clicked:** preset click disabled while `running === true`
- **Focus > 90m estimated_duration:** clamp to 90 (existing context clamp at line 154)
- **Break > 30m from formula:** capped at 30 (existing context clamp at line 163)
