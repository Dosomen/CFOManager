-- =====================================================
-- PROJ-3: Reporting view — monthly aggregates per konten_typ
-- =====================================================
-- Aggregates salden joined with konten so the Server Component can
-- pull totals per Aktiva/Passiva/Aufwand/Ertrag for any (mandant,
-- year, month) in a single query — no client-side reduction needed.
-- RLS on the view inherits from the underlying tables.

create or replace view public.salden_monthly_by_typ
with (security_invoker = true) as
select
  s.mandant_id,
  s.jahr,
  s.monat,
  k.typ,
  sum(s.eb_soll)      as sum_eb_soll,
  sum(s.eb_haben)     as sum_eb_haben,
  sum(s.vk_soll)      as sum_vk_soll,
  sum(s.vk_haben)     as sum_vk_haben,
  sum(s.saldo_soll)   as sum_saldo_soll,
  sum(s.saldo_haben)  as sum_saldo_haben,
  count(*)            as anzahl_konten
from public.salden s
join public.konten k on k.id = s.konto_id
group by s.mandant_id, s.jahr, s.monat, k.typ;

grant select on public.salden_monthly_by_typ to authenticated;
