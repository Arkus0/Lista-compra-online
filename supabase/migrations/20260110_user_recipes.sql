-- User Recipes table
CREATE TABLE IF NOT EXISTS user_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  source_url TEXT,
  source_type TEXT DEFAULT 'manual', -- 'themealdb', 'url', 'manual'
  external_id TEXT, -- ID de TheMealDB si aplica
  servings INTEGER DEFAULT 4,
  prep_time INTEGER, -- minutos
  cook_time INTEGER, -- minutos
  ingredients JSONB NOT NULL DEFAULT '[]', -- [{name, quantity, unit, category}]
  instructions TEXT,
  category TEXT,
  cuisine TEXT,
  share_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recipe collaborators (for sharing)
CREATE TABLE IF NOT EXISTS recipe_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID REFERENCES user_recipes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'viewer', -- 'viewer' or 'editor'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(recipe_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_recipes_owner ON user_recipes(owner_id);
CREATE INDEX IF NOT EXISTS idx_user_recipes_share_code ON user_recipes(share_code);
CREATE INDEX IF NOT EXISTS idx_recipe_collaborators_user ON recipe_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_collaborators_recipe ON recipe_collaborators(recipe_id);

-- RLS Policies
ALTER TABLE user_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_collaborators ENABLE ROW LEVEL SECURITY;

-- Users can view their own recipes
CREATE POLICY "Users can view own recipes" ON user_recipes
  FOR SELECT USING (auth.uid() = owner_id);

-- Users can view recipes shared with them
CREATE POLICY "Users can view shared recipes" ON user_recipes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recipe_collaborators
      WHERE recipe_id = user_recipes.id AND user_id = auth.uid()
    )
  );

-- Users can insert their own recipes
CREATE POLICY "Users can insert own recipes" ON user_recipes
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Users can update their own recipes
CREATE POLICY "Users can update own recipes" ON user_recipes
  FOR UPDATE USING (auth.uid() = owner_id);

-- Users can delete their own recipes
CREATE POLICY "Users can delete own recipes" ON user_recipes
  FOR DELETE USING (auth.uid() = owner_id);

-- Collaborators policies
CREATE POLICY "Users can view collaborators of their recipes" ON recipe_collaborators
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_recipes WHERE id = recipe_id AND owner_id = auth.uid()
    ) OR user_id = auth.uid()
  );

CREATE POLICY "Recipe owners can manage collaborators" ON recipe_collaborators
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_recipes WHERE id = recipe_id AND owner_id = auth.uid()
    )
  );

-- Function to join recipe by share code
CREATE OR REPLACE FUNCTION join_recipe_by_code(share_code_input TEXT)
RETURNS JSON AS $$
DECLARE
  recipe_record RECORD;
  existing_collab RECORD;
  result JSON;
BEGIN
  -- Find recipe by share code
  SELECT * INTO recipe_record FROM user_recipes WHERE share_code = share_code_input;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Código no válido');
  END IF;

  -- Check if user is the owner
  IF recipe_record.owner_id = auth.uid() THEN
    RETURN json_build_object('success', true, 'recipe_id', recipe_record.id, 'message', 'Es tu propia receta');
  END IF;

  -- Check if already a collaborator
  SELECT * INTO existing_collab FROM recipe_collaborators
  WHERE recipe_id = recipe_record.id AND user_id = auth.uid();

  IF FOUND THEN
    RETURN json_build_object('success', true, 'recipe_id', recipe_record.id, 'message', 'Ya tienes acceso');
  END IF;

  -- Add as collaborator
  INSERT INTO recipe_collaborators (recipe_id, user_id, role)
  VALUES (recipe_record.id, auth.uid(), 'viewer');

  RETURN json_build_object('success', true, 'recipe_id', recipe_record.id, 'message', 'Receta añadida');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE user_recipes IS 'User created and saved recipes';
COMMENT ON TABLE recipe_collaborators IS 'Recipe sharing/collaboration';
COMMENT ON COLUMN user_recipes.ingredients IS 'JSON array: [{name, quantity, unit, category}]';
