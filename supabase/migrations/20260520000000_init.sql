-- DSG Distribution Sales OS: initial schema.

create extension if not exists pgcrypto;

create table if not exists skill_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  skill text not null,
  version text not null default '1.0',
  inputs jsonb not null,
  status text not null default 'queued',
  started_at timestamptz,
  completed_at timestamptz,
  duration_ms integer,
  error text,
  output_file_id uuid,
  highlights jsonb,
  created_at timestamptz not null default now()
);

create index if not exists skill_runs_user_id_created_at_idx
  on skill_runs(user_id, created_at desc);

create table if not exists skill_outputs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_run_id uuid not null references skill_runs(id) on delete cascade,
  storage_path text not null,
  filename text not null,
  size_bytes integer,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '90 days')
);

do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'fk_output'
  ) then
    alter table skill_runs
      add constraint fk_output
      foreign key (output_file_id) references skill_outputs(id) on delete set null;
  end if;
end$$;

create table if not exists user_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  status text not null default 'disconnected',
  oauth_token_ref text,
  last_used_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  unique(user_id, provider)
);

alter table skill_runs enable row level security;
alter table skill_outputs enable row level security;
alter table user_connections enable row level security;

drop policy if exists "Users see own skill_runs" on skill_runs;
create policy "Users see own skill_runs" on skill_runs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users see own skill_outputs" on skill_outputs;
create policy "Users see own skill_outputs" on skill_outputs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users see own connections" on user_connections;
create policy "Users see own connections" on user_connections
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Storage bucket for dossier outputs.
insert into storage.buckets (id, name, public)
values ('dsg-outputs', 'dsg-outputs', false)
on conflict (id) do nothing;

drop policy if exists "Users read own dossiers" on storage.objects;
create policy "Users read own dossiers" on storage.objects
  for select using (
    bucket_id = 'dsg-outputs'
    and (storage.foldername(name))[1] = 'outputs'
    and (storage.foldername(name))[2] = auth.uid()::text
  );
