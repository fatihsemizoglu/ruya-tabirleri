Phase 2: Verification
Goal: verify runtime health, API surface, and security posture before changes.

- Build verification
  - Ensure server compiles and runs (tsc + runtime)
  - Confirm frontend build succeeds

- API health checks (local)
  - /api/auth/me (GET) with valid token
  - /api/auth/login (POST) with valid credentials
  - /api/dreams, /api/categories, /api/blog (CRUD surfaces as applicable)

- Auth flow checks
  - Login with user and admin accounts
  - Admin gate works (admin roles)
  - OAuth flows basic redirects (if enabled in prod)

- Deployment health checks
  - Verifies vercel.json config matches routing
  - Ensure environment variables are set in production (VERCEL_ENV, FRONTEND_URL, SUPABASE_URL, ANON_KEY, etc.)

- Data integrity checks
  - Verify seed state matches expectations; ensure data migrations are idempotent

- Testing plan
  - Unit tests for auth service and controllers
  - Integration tests for dreams/blogs/categories CRUD
  - E2E tests for admin flows
