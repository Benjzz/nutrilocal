-- Profiles
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  goals jsonb not null default '{
    "training": {"calories": 2500, "proteins": 180, "carbs": 250, "fats": 80},
    "rest":     {"calories": 2000, "proteins": 150, "carbs": 180, "fats": 70}
  }'::jsonb,
  created_at timestamptz default now()
);

-- Ingredients (communs aux 2 profils)
create table if not exists ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'Autre' check (category in (
    'Viandes & Poissons', 'Légumes', 'Féculents', 'Fruits',
    'Produits laitiers', 'Matières grasses', 'Boissons', 'Autre'
  )),
  calories numeric not null default 0,
  proteins numeric not null default 0,
  carbs    numeric not null default 0,
  fats     numeric not null default 0,
  unit text not null default 'g' check (unit in ('g', 'ml', 'piece')),
  piece_weight numeric,
  created_at timestamptz default now()
);

-- Recipes (communes aux 2 profils)
create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  servings integer not null default 1,
  ingredients jsonb not null default '[]'::jsonb,
  created_at timestamptz default now()
);

-- Daily logs
create table if not exists day_logs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  date date not null,
  day_type text not null default 'rest' check (day_type in ('training', 'rest')),
  meals jsonb not null default '[]'::jsonb,
  created_at timestamptz default now(),
  unique(profile_id, date)
);

-- Indexes
create index if not exists idx_day_logs_profile_date on day_logs(profile_id, date);

-- Migration : si la table ingredients existe déjà sans la colonne category
alter table ingredients add column if not exists category text not null default 'Autre';

-- Disable RLS (app perso, pas besoin d'auth)
alter table profiles disable row level security;
alter table ingredients disable row level security;
alter table recipes disable row level security;
alter table day_logs disable row level security;

-- Données initiales : 2 profils
insert into profiles (id, name, goals) values
(
  '00000000-0000-0000-0000-000000000001',
  'Profil 1',
  '{
    "training": {"calories": 2500, "proteins": 180, "carbs": 250, "fats": 80},
    "rest":     {"calories": 2000, "proteins": 150, "carbs": 180, "fats": 70}
  }'::jsonb
),
(
  '00000000-0000-0000-0000-000000000002',
  'Profil 2',
  '{
    "training": {"calories": 2000, "proteins": 140, "carbs": 200, "fats": 65},
    "rest":     {"calories": 1700, "proteins": 120, "carbs": 160, "fats": 55}
  }'::jsonb
)
on conflict (id) do nothing;
