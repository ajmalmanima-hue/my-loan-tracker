-- Run all of this in Supabase Dashboard -> SQL Editor.
create extension if not exists pgcrypto;
create table if not exists public.loans(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
 name text not null,
 loan_type text not null check(loan_type in ('emi','interest')),
 principal numeric(14,2) not null default 0 check(principal>=0),
 interest_rate numeric(7,4) not null default 0 check(interest_rate>=0),
 emi numeric(14,2) not null default 0 check(emi>=0),
 frequency text not null default 'yearly' check(frequency in ('yearly','halfyearly','quarterly')),
 due_date date, notes text, created_at timestamptz not null default now());
create table if not exists public.payments(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
 loan_id uuid not null references public.loans(id) on delete cascade,
 payment_date date not null default current_date,
 amount numeric(14,2) not null check(amount>0),
 payment_type text not null check(payment_type in ('interest','principal')),
 note text, created_at timestamptz not null default now());
alter table public.loans enable row level security;
alter table public.payments enable row level security;
drop policy if exists "own loans select" on public.loans; create policy "own loans select" on public.loans for select using(auth.uid()=user_id);
drop policy if exists "own loans insert" on public.loans; create policy "own loans insert" on public.loans for insert with check(auth.uid()=user_id);
drop policy if exists "own loans update" on public.loans; create policy "own loans update" on public.loans for update using(auth.uid()=user_id) with check(auth.uid()=user_id);
drop policy if exists "own loans delete" on public.loans; create policy "own loans delete" on public.loans for delete using(auth.uid()=user_id);
drop policy if exists "own payments select" on public.payments; create policy "own payments select" on public.payments for select using(auth.uid()=user_id);
drop policy if exists "own payments insert" on public.payments; create policy "own payments insert" on public.payments for insert with check(auth.uid()=user_id and exists(select 1 from public.loans l where l.id=loan_id and l.user_id=auth.uid()));
drop policy if exists "own payments update" on public.payments; create policy "own payments update" on public.payments for update using(auth.uid()=user_id) with check(auth.uid()=user_id);
drop policy if exists "own payments delete" on public.payments; create policy "own payments delete" on public.payments for delete using(auth.uid()=user_id);
create index if not exists loans_user_id_idx on public.loans(user_id);
create index if not exists payments_loan_id_idx on public.payments(loan_id);