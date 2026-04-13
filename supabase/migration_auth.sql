-- ═══════════════════════════════════════════════════════════════════
-- MIGRATION : Ajout de l'authentification Google
-- À exécuter dans l'éditeur SQL de Supabase
-- ═══════════════════════════════════════════════════════════════════

-- 1. Ajouter user_id sur profiles et recipes (par utilisateur)
--    Les ingrédients restent partagés entre tous les utilisateurs.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE recipes
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Activer RLS sur toutes les tables

ALTER TABLE profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE day_logs    ENABLE ROW LEVEL SECURITY;

-- 3. Supprimer d'éventuelles politiques existantes

DROP POLICY IF EXISTS "profiles_policy"    ON profiles;
DROP POLICY IF EXISTS "ingredients_policy" ON ingredients;
DROP POLICY IF EXISTS "recipes_policy"     ON recipes;
DROP POLICY IF EXISTS "day_logs_policy"    ON day_logs;

-- 4. Politiques

-- Profiles : chaque utilisateur voit et gère uniquement les siens
CREATE POLICY "profiles_policy" ON profiles
  FOR ALL
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Ingredients : partagés — tous les utilisateurs connectés peuvent tout faire
CREATE POLICY "ingredients_policy" ON ingredients
  FOR ALL
  USING  (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Recipes : par utilisateur
CREATE POLICY "recipes_policy" ON recipes
  FOR ALL
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Day logs : accessibles via les profils de l'utilisateur
CREATE POLICY "day_logs_policy" ON day_logs
  FOR ALL
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- 5. Defaults : user_id automatiquement rempli à l'insertion côté DB
ALTER TABLE profiles ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE recipes  ALTER COLUMN user_id SET DEFAULT auth.uid();

-- ═══════════════════════════════════════════════════════════════════
-- OPTIONNEL : récupérer les données existantes après ta première connexion
--
-- Remplace '<TON_USER_ID>' par l'UUID trouvé dans
-- Supabase → Authentication → Users → ton compte → User UID
--
-- UPDATE profiles SET user_id = '<TON_USER_ID>' WHERE user_id IS NULL;
-- UPDATE recipes  SET user_id = '<TON_USER_ID>' WHERE user_id IS NULL;
-- ═══════════════════════════════════════════════════════════════════
