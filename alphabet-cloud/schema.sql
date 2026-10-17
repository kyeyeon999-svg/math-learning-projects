create table public.alphabet_results (
  round_id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  attempts integer not null check (attempts between 6 and 10000),
  letters text not null check (letters ~ '^[A-Z]{6}$'),
  duration_seconds integer not null check (duration_seconds between 0 and 86400),
  created_at timestamptz not null default now()
);
create index alphabet_results_owner_created on public.alphabet_results(user_id, created_at desc);
alter table public.alphabet_results enable row level security;
revoke all on public.alphabet_results from anon, authenticated;
grant select on public.alphabet_results to authenticated;
grant insert (round_id, attempts, letters, duration_seconds) on public.alphabet_results to authenticated;
create policy "read own learning results" on public.alphabet_results for select to authenticated using ((select auth.uid()) = user_id);
create policy "save own learning results" on public.alphabet_results for insert to authenticated with check ((select auth.uid()) = user_id);
