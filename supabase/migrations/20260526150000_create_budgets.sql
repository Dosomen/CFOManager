-- =====================================================
-- PROJ-5: Budget / Planung — yearly budget per konto
-- =====================================================
-- One row per (mandant, konto, jahr) holding the annual budget amount.
-- Monthly budget is derived as betrag / 12 for the Soll-Ist comparison.
-- Future enhancement (P1): explicit monthly overrides + rolling forecast.

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  mandant_id uuid not null references public.mandanten(id) on delete cascade,
  konto_id uuid not null references public.konten(id) on delete cascade,
  jahr int not null check (jahr between 2000 and 2100),
  betrag numeric(18,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (konto_id, jahr)
);

create index idx_budgets_mandant_jahr on public.budgets(mandant_id, jahr);
create index idx_budgets_konto on public.budgets(konto_id);

create trigger trg_budgets_updated_at
  before update on public.budgets
  for each row execute function public.set_updated_at();

alter table public.budgets enable row level security;

create policy "budgets_select_own"
  on public.budgets for select
  using (public.user_has_mandant_access(mandant_id));

create policy "budgets_insert_own"
  on public.budgets for insert
  with check (public.user_has_mandant_access(mandant_id));

create policy "budgets_update_own"
  on public.budgets for update
  using (public.user_has_mandant_access(mandant_id))
  with check (public.user_has_mandant_access(mandant_id));

create policy "budgets_delete_own"
  on public.budgets for delete
  using (public.user_has_mandant_access(mandant_id));

grant select, insert, update, delete on public.budgets to authenticated;
