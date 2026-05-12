-- ============================================================
-- Universidad v1 — Schema Migration v5
-- Run this in the Supabase SQL editor
-- ============================================================

-- ── #19 PERFIL: columnas faltantes ────────────────────────────
-- Agregar campos que el formulario de registro recolecta
-- pero que no existían en la tabla profiles.

alter table profiles
  add column if not exists apellido1  text,
  add column if not exists apellido2  text,
  add column if not exists username   text,
  add column if not exists university text,
  add column if not exists study_year text;

-- Actualizar el trigger para que guarde todos los campos
-- que vienen en raw_user_meta_data al crear la cuenta.
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, name, apellido1, apellido2, username, university, study_year)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name',       split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'apellido1',  ''),
    coalesce(new.raw_user_meta_data->>'apellido2',  ''),
    coalesce(new.raw_user_meta_data->>'username',   split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'university', ''),
    coalesce(new.raw_user_meta_data->>'study_year', '')
  );
  return new;
end;
$$ language plpgsql security definer;

-- El trigger ya existe; reemplazar la función es suficiente.
-- Si por algún motivo el trigger no existe, recrearlo:
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
