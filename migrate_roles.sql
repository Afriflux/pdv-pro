-- Script de migration pour synchroniser les rôles (Auth)
-- A exécuter directement dans le Supabase SQL Editor

UPDATE auth.users 
SET raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', (
    SELECT role FROM public."User" WHERE id = auth.users.id::text
))
WHERE id::text IN (SELECT id FROM public."User");
