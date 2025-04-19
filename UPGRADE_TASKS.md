# Package Upgrade Tasks

## Phase 1: Complete Supabase Authentication Migration

- [x] Create upgrade plan
- [x] Update test files to use @supabase/ssr instead of @supabase/auth-helpers-nextjs:
  - [x] src/__tests__/components/events/TicketManager.test.tsx
  - [x] src/__tests__/components/events/EventForm.test.tsx
  - [x] src/__tests__/app/events/CreateEvent.test.tsx
  - [x] src/__tests__/app/events/FormBuilder.test.tsx
  - [x] src/__tests__/components/editor/Editor.test.tsx
- [x] Remove @supabase/auth-helpers-nextjs from package.json
- [x] Test authentication flows (verified the application runs with npm run dev)

## Phase 2: Update Critical Security-Related Packages

- [ ] Update Supabase packages to latest versions
- [ ] Address npm audit security issues for non-breaking changes
- [ ] Update security-related packages

## Phase 3: Update Utility Libraries

- [ ] Update UI component libraries (Radix UI)
- [ ] Update form libraries
- [ ] Update date handling libraries
- [ ] Update other utility libraries

## Phase 4: Major Framework Updates

- [ ] Update Storybook (7 → 8)
- [ ] Update React (18 → 19)
- [ ] Update Next.js (14 → 15)
- [ ] Update testing frameworks
- [ ] Update TypeScript and ESLint

## Implementation Workflow

1. Create separate git branches for each phase
2. Use incremental commits with descriptive messages
3. Test thoroughly after each significant change
4. Create backups before major changes
5. Merge only after successful testing 