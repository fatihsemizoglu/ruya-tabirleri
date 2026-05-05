Phase 1: Baseline Inventory
- Code map
  - Frontend: D:
  - Backend server: D:\Projeler\Rüya Tabirleri
- Data model
  - Inspect server/database/schema.sql to enumerate tables: users, profiles, user_roles, dreams, categories, blog_posts, contact_messages, etc.
- Auth & auth flow
  - Current approach: mixture of Supabase Auth and local user tables
  - OAuth workflows: Google, GitHub, Facebook (redirect callbacks)
- API surface
  - Core endpoints: /api/auth/login, /api/auth/me, /api/auth/register, /api/dreams, /api/categories, /api/blog, /api/notifications, etc.
- Frontend routes
  - Admin panels: Dreams, Categories, Blog, Site Settings
- Deployment
  - VerceI: vercel.json present, two environments (frontend, backend)
- Testing
  - Existing tests: none found (plan to add)
- Risks & gaps
  - auth token handling and cookies vs local storage
  - mismatch between auth services (Supabase) and old user tables

Phase 1 Outputs:
- Initial inventory captured
- Documentation skeleton created for deeper tasks
