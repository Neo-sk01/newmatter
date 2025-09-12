-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Companies table
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text,
  industry text,
  created_at timestamptz not null default now()
);

-- Company memberships for multi-tenant access
create table public.company_memberships (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null,
  role text not null check (role in ('admin', 'user', 'viewer')),
  created_at timestamptz not null default now(),
  unique (company_id, user_id)
);

-- Lead lists belong to companies
create table public.leadlists (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  description text,
  source text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- Prompt templates (reusable across campaigns)
create table public.prompt_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  goal text,
  audience text,
  channel text,
  variables text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- Prompt versions (never overwrite, always create new)
create table public.prompt_versions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.prompt_templates(id) on delete cascade,
  version int not null,
  label text not null,
  body text not null,
  variables_resolved jsonb not null default '{}',
  notes text,
  author text,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'active', 'paused', 'archived')),
  created_at timestamptz not null default now(),
  unique (template_id, version)
);

-- Campaigns belong to company and leadlist
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  leadlist_id uuid not null references public.leadlists(id) on delete cascade,
  name text not null,
  campaign_date date not null,
  objectives text,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'active', 'paused', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Campaign prompts link campaigns with prompt versions
create table public.campaign_prompts (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  prompt_version_id uuid not null references public.prompt_versions(id) on delete cascade,
  delivery_channel text not null,
  ab_group text,
  send_window jsonb not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'active', 'paused', 'archived')),
  metrics jsonb not null default '{"sent": 0, "opens": 0, "clicks": 0, "replies": 0}',
  created_at timestamptz not null default now(),
  unique (campaign_id, prompt_version_id)
);

-- Indexes for performance
create index on public.company_memberships(user_id);
create index on public.leadlists(company_id);
create index on public.prompt_versions(template_id, version);
create index on public.campaigns(company_id);
create index on public.campaigns(leadlist_id);
create index on public.campaign_prompts(campaign_id);

-- Auto-increment version per prompt template
create or replace function public.next_prompt_version(p_template_id uuid)
returns int language plpgsql as $$
declare v int;
begin
  select coalesce(max(version), 0) + 1 into v 
  from public.prompt_versions 
  where template_id = p_template_id;
  return v;
end$$;

create or replace function public.before_insert_prompt_version()
returns trigger language plpgsql as $$
begin
  if new.version is null then
    new.version := public.next_prompt_version(new.template_id);
  end if;
  return new;
end$$;

create trigger trg_prompt_version_bi
before insert on public.prompt_versions
for each row execute function public.before_insert_prompt_version();

-- Updated timestamps
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end$$;

create trigger trg_campaigns_set_updated_at
before update on public.campaigns
for each row execute function public.set_updated_at();

-- Metrics increment RPC
create or replace function public.increment_campaign_metrics(
  p_campaign_prompt_id uuid,
  p_delta jsonb
)
returns void language plpgsql as $$
begin
  update public.campaign_prompts
  set metrics = jsonb_build_object(
    'sent', coalesce((metrics->>'sent')::int, 0) + coalesce((p_delta->>'sent')::int, 0),
    'opens', coalesce((metrics->>'opens')::int, 0) + coalesce((p_delta->>'opens')::int, 0),
    'clicks', coalesce((metrics->>'clicks')::int, 0) + coalesce((p_delta->>'clicks')::int, 0),
    'replies', coalesce((metrics->>'replies')::int, 0) + coalesce((p_delta->>'replies')::int, 0)
  )
  where id = p_campaign_prompt_id;
end$$;

-- Constraint to ensure campaign.company_id = leadlist.company_id
alter table public.campaigns 
add constraint campaigns_company_leadlist_match 
check (
  company_id = (select company_id from public.leadlists where id = leadlist_id)
);

-- Enable RLS on all tables
alter table public.companies enable row level security;
alter table public.company_memberships enable row level security;
alter table public.leadlists enable row level security;
alter table public.prompt_templates enable row level security;
alter table public.prompt_versions enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_prompts enable row level security;

-- RLS Policies for multi-tenant access
-- Companies: user must be a member
create policy companies_member_access on public.companies
  for all using (
    exists (
      select 1 from public.company_memberships 
      where company_id = companies.id 
      and user_id = auth.uid()
    )
  );

-- Company memberships: user can see their own memberships
create policy memberships_own_access on public.company_memberships
  for all using (user_id = auth.uid());

-- Leadlists: user must be member of the company
create policy leadlists_company_member on public.leadlists
  for all using (
    exists (
      select 1 from public.company_memberships 
      where company_id = leadlists.company_id 
      and user_id = auth.uid()
    )
  );

-- Prompt templates: global read, but we'll scope by company in app logic
create policy prompt_templates_read on public.prompt_templates
  for select using (true);

create policy prompt_templates_write on public.prompt_templates
  for insert with check (true);

create policy prompt_templates_update on public.prompt_templates
  for update using (true);

-- Prompt versions: inherit from template
create policy prompt_versions_read on public.prompt_versions
  for select using (true);

create policy prompt_versions_write on public.prompt_versions
  for insert with check (true);

-- Campaigns: user must be member of the company
create policy campaigns_company_member on public.campaigns
  for all using (
    exists (
      select 1 from public.company_memberships 
      where company_id = campaigns.company_id 
      and user_id = auth.uid()
    )
  );

-- Campaign prompts: inherit from campaign
create policy campaign_prompts_via_campaign on public.campaign_prompts
  for all using (
    exists (
      select 1 from public.campaigns c
      join public.company_memberships cm on cm.company_id = c.company_id
      where c.id = campaign_prompts.campaign_id
      and cm.user_id = auth.uid()
    )
  );
