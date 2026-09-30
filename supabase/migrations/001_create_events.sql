create extension if not exists pgcrypto;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  client_event_id uuid not null unique,
  event_type text not null check (event_type in ('page_view', 'whatsapp_click')),
  source text not null,
  session_id uuid not null,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  landing_path text not null,
  created_at timestamptz not null default now(),
  constraint events_source_matches_type check (
    (event_type = 'page_view' and source = 'landing')
    or
    (event_type = 'whatsapp_click' and source in (
      'hero_primary',
      'hero_secondary',
      'floating_whatsapp',
      'final_cta'
    ))
  )
);

create index if not exists events_created_at_idx on public.events (created_at);
create index if not exists events_session_id_idx on public.events (session_id);
create index if not exists events_type_created_at_idx on public.events (event_type, created_at);
create index if not exists events_utm_source_created_at_idx on public.events (utm_source, created_at);

alter table public.events enable row level security;
