-- =========================================
-- HUMI HRM – Supabase Schema
-- Run this in Supabase SQL Editor
-- =========================================

-- ---- EMPLOYEES ----
create table if not exists employees (
  id            text primary key,
  code          text unique not null,
  name          text not null,
  avatar        text,
  unit          text,
  position      text,
  role_id       text default 'employee',
  status        text default 'active',
  gender        text,
  phone         text,
  email         text,
  dob           date,
  start_date    date,
  contract_status text,
  contract_type text,
  work_mode     text,
  manager_name  text,
  leave_balance jsonb default '{"annual":12,"sick":30,"maternity":180,"unpaid":99}',
  id_card       text,
  created_at    timestamptz default now()
);

-- ---- ACCOUNTS (custom auth) ----
create table if not exists accounts (
  employee_id text primary key references employees(id) on delete cascade,
  password    text not null,
  created_at  timestamptz default now()
);

-- ---- SHIFTS ----
create table if not exists shifts (
  id           text primary key,
  name         text not null,
  code         text,
  start_time   text,
  end_time     text,
  break_minutes int default 60,
  work_hours   int default 8,
  quota        int default 5,
  active       boolean default true,
  color        text,
  apply_days   int[] default '{1,2,3,4,5,6}',
  created_at   timestamptz default now()
);

-- ---- SHIFT ASSIGNMENTS ----
create table if not exists shift_assignments (
  id           text primary key default gen_random_uuid()::text,
  employee_id  text references employees(id) on delete cascade,
  shift_id     text references shifts(id) on delete cascade,
  date         date,
  created_at   timestamptz default now()
);

-- ---- ATTENDANCE ----
create table if not exists attendance (
  id              text primary key,
  employee_id     text references employees(id) on delete cascade,
  date            date not null,
  check_in        text,
  check_out       text,
  status          text default 'present',
  approval_status text default 'pending',
  note            text,
  location        text,
  created_at      timestamptz default now()
);
create unique index if not exists attendance_emp_date on attendance(employee_id, date);

-- ---- LEAVE REQUESTS ----
create table if not exists leave_requests (
  id             text primary key,
  employee_id    text references employees(id) on delete cascade,
  leave_type     text not null,
  leave_type_name text,
  start_date     date not null,
  end_date       date not null,
  total_days     numeric not null,
  status         text default 'pending',
  reason         text,
  approver_id    text,
  created_at     timestamptz default now()
);

-- ---- REQUESTS ----
create table if not exists requests (
  id           text primary key,
  employee_id  text references employees(id) on delete cascade,
  type         text not null,
  type_label   text,
  content      text,
  status       text default 'pending',
  approver_id  text,
  created_at   timestamptz default now()
);

-- ---- SALARY ----
create table if not exists salary (
  id               text primary key,
  employee_id      text references employees(id) on delete cascade,
  period           text not null,
  base_salary      numeric default 0,
  gross_salary     numeric default 0,
  net_salary       numeric default 0,
  work_days        int default 26,
  actual_work_days numeric default 0,
  allowances       jsonb default '{}',
  deductions       jsonb default '{}',
  bonus            numeric default 0,
  overtime_pay     numeric default 0,
  created_at       timestamptz default now()
);
create unique index if not exists salary_emp_period on salary(employee_id, period);

-- ---- MESSAGES ----
create table if not exists messages (
  id         text primary key,
  to_id      text references employees(id) on delete cascade,
  sender     text,
  avatar     text,
  subject    text,
  preview    text,
  body       text,
  actions    jsonb default '[]',
  tag        text,
  tag_class  text,
  is_read    boolean default false,
  timestamp  timestamptz default now()
);

-- ---- ANNOUNCEMENTS ----
create table if not exists announcements (
  id          text primary key,
  department  text,
  title       text not null,
  preview     text,
  creator     text,
  approver    text,
  status      text default 'active',
  start_date  date,
  end_date    date,
  created_at  timestamptz default now()
);

-- =========================================
-- Row Level Security (RLS) — optional
-- Uncomment to enable RLS for production
-- =========================================
-- alter table employees enable row level security;
-- alter table attendance enable row level security;
-- alter table leave_requests enable row level security;
-- alter table messages enable row level security;
