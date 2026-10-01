create table public.contacts (
  client_submission_id uuid primary key,
  name text not null check (
    char_length(name) >= 1
    and char_length(name) <= 100
    and name = btrim(name)
    and name !~ '[[:cntrl:]]'
    and name !~ U&'[\007F-\009F]'
  ),
  phone text not null check (phone ~ '^\+?[0-9]{10,15}$'),
  consent_notice_version text not null check (consent_notice_version = 'contact-v1'),
  consent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- The managed provider rejects REVOKE (42501). Fail the transaction if this
-- newly created table inherited any PUBLIC grant; do not silently bypass ACLs.
select 1 / case when exists (
  select 1 from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  cross join lateral aclexplode(coalesce(c.relacl, acldefault('r', c.relowner))) a
  where n.nspname = 'public' and c.relname = 'contacts' and a.grantee = 0
) then 0 else 1 end as contacts_public_acl_guard;
