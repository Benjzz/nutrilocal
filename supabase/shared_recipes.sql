-- Table pour les recettes partagées via lien
CREATE TABLE IF NOT EXISTS shared_recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_data jsonb NOT NULL,  -- snapshot complet de la recette au moment du partage
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE shared_recipes ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut lire (lien public)
CREATE POLICY "Public can read shared recipes" ON shared_recipes
  FOR SELECT USING (true);

-- Seuls les utilisateurs connectés peuvent partager
CREATE POLICY "Authenticated users can create shared recipes" ON shared_recipes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
