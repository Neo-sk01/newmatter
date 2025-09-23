-- Lead storage and relaxed prompt/leadlist access for development

-- Leads associated with lead lists
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  leadlist_id uuid not null references public.leadlists(id) on delete cascade,
  first_name text,
  last_name text,
  company text,
  email text,
  title text,
  website text,
  linkedin text,
  status text not null default 'new' check (status in ('new','enriched','generated','approved','rejected','sent')),
  meta jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_leadlist_id_idx on public.leads(leadlist_id);

create trigger trg_leads_set_updated_at
before update on public.leads
for each row execute function public.set_updated_at();

alter table public.leads enable row level security;

-- RLS: allow company members to access their leads (mirrors leadlists policy)
create policy leads_company_member on public.leads
  for all using (
    exists (
      select 1
      from public.leadlists l
      join public.company_memberships cm on cm.company_id = l.company_id
      where l.id = leads.leadlist_id
        and cm.user_id = auth.uid()
    )
  );

-- Temporary relaxed access so the prototype can function without auth
create policy leadlists_anon_dev_access on public.leadlists
  for all using (auth.role() = 'anon')
  with check (auth.role() = 'anon');

create policy leads_anon_dev_access on public.leads
  for all using (auth.role() = 'anon')
  with check (auth.role() = 'anon');

-- Prompt templates/versions already allow anon writes, but ensure updates have check clause
alter policy prompt_templates_write on public.prompt_templates
  with check (true);

alter policy prompt_templates_update on public.prompt_templates
  using (true)
  with check (true);

alter policy prompt_versions_write on public.prompt_versions
  with check (true);
