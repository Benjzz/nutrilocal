-- ═══════════════════════════════════════════════════════════════════
-- MIGRATION : Système d'amis + feed social
-- À exécuter dans l'éditeur SQL de Supabase
-- ═══════════════════════════════════════════════════════════════════

-- 1. Table des emails publics (pour chercher un ami par email)
CREATE TABLE IF NOT EXISTS user_emails (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email    text NOT NULL UNIQUE
);

ALTER TABLE user_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read user_emails" ON user_emails
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users manage their own email" ON user_emails
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 2. Table des amitiés
CREATE TABLE IF NOT EXISTS friendships (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  addressee_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  created_at   timestamptz DEFAULT now(),
  UNIQUE(requester_id, addressee_id)
);

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see their friendships" ON friendships
  FOR SELECT USING (requester_id = auth.uid() OR addressee_id = auth.uid());

CREATE POLICY "Users create friend requests" ON friendships
  FOR INSERT WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Addressee can accept or decline" ON friendships
  FOR UPDATE USING (addressee_id = auth.uid());

CREATE POLICY "Users can remove friendships" ON friendships
  FOR DELETE USING (requester_id = auth.uid() OR addressee_id = auth.uid());

-- 3. Permettre aux amis de lire les profils
CREATE POLICY "Friends can read profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM friendships f
      WHERE f.status = 'accepted'
      AND (
        (f.requester_id = auth.uid() AND f.addressee_id = profiles.user_id)
        OR (f.addressee_id = auth.uid() AND f.requester_id = profiles.user_id)
      )
    )
  );

-- 4. Permettre aux amis de lire les recettes (pour le calcul des macros)
CREATE POLICY "Friends can read recipes" ON recipes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM friendships f
      WHERE f.status = 'accepted'
      AND (
        (f.requester_id = auth.uid() AND f.addressee_id = recipes.user_id)
        OR (f.addressee_id = auth.uid() AND f.requester_id = recipes.user_id)
      )
    )
  );

-- 5. Permettre aux amis de lire les day_logs
CREATE POLICY "Friends can read day_logs" ON day_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      INNER JOIN friendships f ON (
        (f.requester_id = auth.uid() AND f.addressee_id = p.user_id)
        OR (f.addressee_id = auth.uid() AND f.requester_id = p.user_id)
      )
      WHERE p.id = day_logs.profile_id
      AND f.status = 'accepted'
    )
  );
