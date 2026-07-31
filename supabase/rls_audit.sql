-- RLS audit query for Supabase SQL Editor / direct DB connection.
-- Confirms that critical public tables have row-level security enabled
-- and lists current policies for manual review.

with expected_tables(table_name) as (
  values
    ('ads'),
    ('audit_logs'),
    ('blog_categories'),
    ('blog_comments'),
    ('blog_likes'),
    ('blog_posts'),
    ('categories'),
    ('comment_likes'),
    ('comments'),
    ('contact_messages'),
    ('content_calendar'),
    ('dream_journal'),
    ('dream_likes'),
    ('dreams'),
    ('profiles'),
    ('site_settings'),
    ('user_roles'),
    ('view_history')
), rls_status as (
  select
    c.relname as table_name,
    c.relrowsecurity as rls_enabled,
    c.relforcerowsecurity as rls_forced
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'r'
)
select
  e.table_name,
  coalesce(s.rls_enabled, false) as rls_enabled,
  coalesce(s.rls_forced, false) as rls_forced,
  case
    when s.table_name is null then 'MISSING_TABLE'
    when s.rls_enabled then 'OK'
    else 'RLS_DISABLED'
  end as status
from expected_tables e
left join rls_status s using (table_name)
order by e.table_name;

-- Policy inventory
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'ads', 'audit_logs', 'blog_categories', 'blog_comments', 'blog_likes',
    'blog_posts', 'categories', 'comment_likes', 'comments', 'contact_messages',
    'content_calendar', 'dream_journal', 'dream_likes', 'dreams', 'profiles',
    'site_settings', 'user_roles', 'view_history'
  )
order by tablename, policyname;