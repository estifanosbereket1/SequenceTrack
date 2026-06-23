# ProcessTracker — Build Progress

## Phase 1: Project Scaffold — COMPLETE (2026-06-20)

### What was done
- Created Expo SDK 56 project with TypeScript via `npx create-expo-app`
- Installed all dependencies: expo-router, expo-sqlite, expo-image-picker, expo-document-picker, expo-file-system, expo-notifications, expo-print, expo-sharing
- Set up directory structure (`app/`, `src/`, etc.)
- Created DB schema with migration runner (`src/db/schema.ts`, `src/db/database.ts`)
- Wrote typed query functions for all entities (`src/db/templates.ts`, `src/db/instances.ts`, `src/db/reminders.ts`)
- Created TypeScript types (`src/types/index.ts`)
- Built theme token system with light/dark mode (`src/theme/*`) — warm paper palette
- Created Context + useReducer for all three domains (`src/context/*`, `src/reducers/*`)
- Created all app screens via expo-router (tabs, templates, instances, reminders)
- Created reusable components: StampCheckbox, BlockRenderer, BlockEditor, StepList, EmptyState, ProgressRing
- Utility files: media picker (new expo-file-system API), date formatting, PDF export, deep copy
- Fixed all TypeScript errors (zero errors on `npx tsc --noEmit`)
- Validated Expo config

### Phases 2–8 were built together (integrated approach — screens and data layer built concurrently)

**Phase 2 (Template CRUD):** Template list, create, edit screens. Steps can be added, removed, reordered (up/down buttons). Blocks of all 5 types (text, checklist_item, photo, link, file) can be added, removed, reordered per step.

**Phase 3 (Quick Capture):** Quick Capture screen at `app/templates/[id]/quick-capture.tsx` — capture ungrouped blocks, then structure them into a step via the "Structure into Step" button.

**Phase 4 (Instance creation):** Instance creation from template (deep copy) at `app/instances/new.tsx`. Home screen shows active instances + templates library.

**Phase 5 (Instance detail):** Instance detail with progress bar, step list, step detail screen with checklist toggle, instance-only block addition, step completion.

**Phase 6 (Reminders):** Reminders context with `expo-notifications` scheduling, tab screen with list/cancel. Permission request integrated.

**Phase 7 (PDF Export):** Export via `expo-print` + `expo-sharing` from instance detail screen.

**Phase 8 (Polish):** Empty states with invitation copy, warm-paper theme, light/dark mode via `useColorScheme`, native iOS grouped-list feel, monospace for metadata.

### Files created: 37 source files

### Expo Go compatibility fixes applied
- `expo-notifications`: replaced direct static import with dynamic import via `src/utils/notifications.ts` fallback wrapper. If the module fails to load in Expo Go, reminders fall back to in-app `setTimeout` + `Alert.alert`. Works in Expo Go (local notifications only; push/remote not supported).
- `expo-print` + `expo-sharing`: replaced direct static imports in PDF export with dynamic import via `src/utils/pdf.ts`. Falls back gracefully with an alert if the modules aren't available.
- Updated `src/utils/media.ts` to use the new `expo-file-system` API (`Paths`, `File`, `Directory` classes) — the legacy API (`documentDirectory`, `copyAsync`) was removed in SDK 56.

### Current state
- All screens functional and connected to SQLite
- TypeScript compiles with zero errors (verified `npx tsc --noEmit`)
- All native module imports use dynamic import wrappers for Expo Go compatibility
- StampCheckbox has scale animation (respects reduce-motion); true ink-mark stamp deferred
- `Alert.prompt` only works on iOS; Android reminder text input needs custom modal (deferred)
- Dark mode auto-detects system preference; manual toggle in ThemeProvider but not exposed in UI
- `@expo/vector-icons` is now a direct dependency (was removed from `expo` in SDK 56)

## Phase 9: Learnings Tab — COMPLETE (2026-06-21)

### What was done
- Added Learnings tab (fourth tab) to tab layout with `book-outline` icon
- Wired `LearningProvider` into root layout provider chain
- Added stack screen entries for `/learnings/new`, `/learnings/[id]/index`, `/learnings/[id]/edit`
- Installed `react-native-markdown-display` for markdown rendering
- Installed `expo-audio` for voice recording (was missing from deps)
- Fixed TypeScript errors across all new files:
  - Removed unused `FlashListProxy` import from tab screen
  - Replaced invalid `mod.createAudioRecorder()` call with `new mod.AudioModule.AudioRecorder(options)` in both `new.tsx` and `edit.tsx`
  - Removed dead code (ternary returning null) from `new.tsx`
  - Replaced Ionicons names that don't exist in the icon set (`bold`, `italic`, `list`, `list-outline`, `hash`) with styled `<Text>` elements in `MarkdownToolbar.tsx`
- TypeScript compiles with zero errors (`npx tsc --noEmit`)

### Files changed
- `app/(tabs)/_layout.tsx` — added Learnings tab screen
- `app/_layout.tsx` — added LearningProvider + learnings route screens
- `app/(tabs)/learnings.tsx` — removed unused FlashListProxy import
- `app/learnings/new.tsx` — fixed AudioRecorder API, removed dead code
- `app/learnings/[id]/edit.tsx` — fixed AudioRecorder API
- `src/components/MarkdownToolbar.tsx` — replaced icons with styled text labels
- `progress.md` — updated

### Dependencies added
- `react-native-markdown-display` (pure JS markdown renderer)
- `expo-audio` (SDK 56 voice recording, was listed in spec but not in deps)

### Next step
Test in Expo Go on a device/simulator via `npx expo start`. Verify:
1. Template CRUD (create, add/reorder steps, add/reorder blocks of all types)
2. Quick capture → structure into step
3. Instance creation with deep copy
4. Checklist interaction + step completion
5. PDF export
6. Reminder scheduling (will show Alert fallback on Android/Expo Go)
7. **New:** Learnings tab — create, edit, view entries with markdown, photo/file/voice attachments
