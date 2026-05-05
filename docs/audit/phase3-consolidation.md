Phase 3: Consolidation
Goals:
- Unify authentication flow under a single source of truth (Supabase Auth) and remove reliance on legacy local users table for login.
- Implement a robust Admin RBAC: admin, moderator, user roles; ensure endpoints enforce permissions.
- Standardize CRUD flows for dreams, categories, blog posts with validation and permissions.
- Create test strategy (unit, integration, E2E).

Plan:
- Step 1: Remove legacy login path and ensure all login calls use Supabase Auth; remove /api/auth/admin and route to admin login via /api/auth/login with isAdmin flag.
- Step 2: Implement a single users-backed data model with profiles and user_roles depending on the auth system.
- Step 3: Build a skeleton Admin Dashboard with components: DreamList, CategoryList, BlogList, SiteSettings; add CRUD wiring.
- Step 4: Implement full test suite with Playwright or Cypress.
- Step 5: Add CI/CD tests and deployment verification.
