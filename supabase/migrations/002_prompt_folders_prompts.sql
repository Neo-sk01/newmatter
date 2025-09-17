-- Prompt folders, prompts, and campaign prompt snapshots
-- Multi-tenant with global (company_id IS NULL) and company-scoped rows

create table if not exists public.prompt_folders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid null,                 -- NULL => GLOBAL
  name text not null,
  parent_id uuid null references public.prompt_folders(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.prompts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid null,                 -- NULL => GLOBAL
  folder_id uuid null references public.prompt_folders(id) on delete set null,
  name text not null,
  description text,
  content text not null,
  variables jsonb default '[]'::jsonb,  -- e.g. ["lead_name","company","hook"]
  version int not null default 1,
  created_by uuid null,
  is_archived boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.campaign_prompts (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null,
  prompt_id uuid not null references public.prompts(id),
  prompt_name text not null,
  prompt_version int not null,
  prompt_content text not null,         -- snapshot used for generation
  attached_at timestamptz default now()
);

-- RLS
alter table public.prompt_folders enable row level security;
alter table public.prompts enable row level security;
alter table public.campaign_prompts enable row level security;

-- SELECT policies: allow global (company_id is null) or company match
create policy prompt_folders_select on public.prompt_folders
  for select using (
    company_id is null or company_id::text = (auth.jwt())->>'company_id'
  );

create policy prompts_select on public.prompts
  for select using (
    company_id is null or company_id::text = (auth.jwt())->>'company_id'
  );

-- INSERT/UPDATE policies: only allow writing rows for own company
create policy prompt_folders_write on public.prompt_folders
  for insert with check (company_id::text = (auth.jwt())->>'company_id');

create policy prompt_folders_update on public.prompt_folders
  for update using (company_id::text = (auth.jwt())->>'company_id')
  with check (company_id::text = (auth.jwt())->>'company_id');

create policy prompts_write on public.prompts
  for insert with check (company_id::text = (auth.jwt())->>'company_id');

create policy prompts_update on public.prompts
  for update using (company_id::text = (auth.jwt())->>'company_id')
  with check (company_id::text = (auth.jwt())->>'company_id');

-- For campaign_prompts, keep open to read by the app; gate ownership in app layer
create policy campaign_prompts_select on public.campaign_prompts
  for select using (true);

-- Seed data (GLOBAL)
do $$
begin
  -- Create folders if not exist
  if not exists (select 1 from public.prompt_folders where company_id is null and name = 'Global') then
    insert into public.prompt_folders(company_id, name) values (null, 'Global');
  end if;
  if not exists (select 1 from public.prompt_folders where company_id is null and name = 'Follow-ups') then
    insert into public.prompt_folders(company_id, name) values (null, 'Follow-ups');
  end if;
end$$;

with f as (
  select id from public.prompt_folders where company_id is null and name = 'Global' limit 1
), fu as (
  select id from public.prompt_folders where company_id is null and name = 'Follow-ups' limit 1
)
insert into public.prompts (company_id, folder_id, name, description, content, variables, version)
values
  (null, (select id from f), 'Casual Intro',
   'Light, friendly intro with optional hook',
   'Hi {{lead_name}},\n\nI came across {{company}} and thought this could be useful. {{hook}}\n\nWould it be helpful to share a quick idea?\n\nBest,\nNeo',
   '["lead_name","company","hook"]'::jsonb, 1
  ),
  (null, (select id from f), 'Professional Pitch',
   'Tighter, professional tone with context + CTA',
   'Subject: Quick idea for {{company}}\n\nHi {{lead_name}},\n\nI''m reaching out about {{company}}''s work in {{context}}. Based on what I''ve seen, this could be relevant to your role as {{lead_title}}.\n\nIf useful, here''s a direct link to book a slot: {{calendar_url}}\n\nBest,\nNeo',
   '["lead_name","lead_title","company","context","calendar_url"]'::jsonb, 1
  ),
  (null, (select id from fu), 'Follow-up: Nudge (No Reply)',
   'Gentle follow-up referencing offer and new insight',
   'Hi {{lead_name}},\n\nCircling back on {{offer}} for {{company}} — one thought: {{new_insight}}.\n\nWorth a quick look?\n\nBest,\nNeo',
   '["lead_name","offer","company","new_insight"]'::jsonb, 1
  )
on conflict do nothing;
