create extension if not exists "uuid-ossp";
create type user_role as enum ('super_admin','branch_manager','employee');
create table branches(id uuid primary key default uuid_generate_v4(),name text not null,code text unique,created_at timestamptz default now());
create table profiles(id uuid primary key references auth.users(id) on delete cascade,full_name text not null,role user_role not null default 'employee',branch_id uuid references branches(id),working_days int default 26 check(working_days between 0 and 31));
create table monthly_targets(id uuid primary key default uuid_generate_v4(),branch_id uuid references branches(id) on delete cascade,month date not null,target numeric(14,2) not null check(target>=0),unique(branch_id,month));
create table daily_sales(id uuid primary key default uuid_generate_v4(),employee_id uuid references profiles(id) on delete cascade,branch_id uuid references branches(id),sale_date date not null,gross_sales numeric(14,2) default 0,returns numeric(14,2) default 0,net_sales numeric(14,2) generated always as (gross_sales-returns) stored,unique(employee_id,sale_date));
alter table branches enable row level security; alter table profiles enable row level security; alter table monthly_targets enable row level security; alter table daily_sales enable row level security;
