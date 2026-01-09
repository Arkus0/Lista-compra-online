-- =============================================
-- MIGRACIÓN: Funcionalidades de Colaboración en Tiempo Real
-- Fecha: 2026-01-09
-- Features: Push notifications, Favoritos, Notas, Perfil mejorado
-- =============================================

-- =============================================
-- 1. MODIFICAR list_items: añadir checked_by
-- =============================================
ALTER TABLE list_items
ADD COLUMN IF NOT EXISTS checked_by UUID REFERENCES profiles(id);

-- Comentario para documentación
COMMENT ON COLUMN list_items.checked_by IS 'Usuario que marcó el item como comprado';

-- =============================================
-- 2. TABLA: push_subscriptions (Notificaciones Push PWA)
-- =============================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);

-- =============================================
-- 3. TABLA: user_favorite_items (Items favoritos por usuario)
-- =============================================
CREATE TABLE IF NOT EXISTS user_favorite_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_user_favorite_items_user_id ON user_favorite_items(user_id);

-- =============================================
-- 4. TABLA: user_favorite_lists (Listas favoritas por usuario)
-- =============================================
CREATE TABLE IF NOT EXISTS user_favorite_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, list_id)
);

CREATE INDEX IF NOT EXISTS idx_user_favorite_lists_user_id ON user_favorite_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorite_lists_list_id ON user_favorite_lists(list_id);

-- =============================================
-- 5. TABLA: list_notes (Notas en listas colaborativas)
-- =============================================
CREATE TABLE IF NOT EXISTS list_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_list_notes_list_id ON list_notes(list_id);
CREATE INDEX IF NOT EXISTS idx_list_notes_user_id ON list_notes(user_id);

-- =============================================
-- 6. TABLA: notification_preferences (Preferencias de notificaciones)
-- =============================================
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  items_added BOOLEAN DEFAULT TRUE,
  items_removed BOOLEAN DEFAULT TRUE,
  items_checked BOOLEAN DEFAULT TRUE,
  notes_added BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Habilitar RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorite_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorite_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Políticas para push_subscriptions
CREATE POLICY "Users can manage their own push subscriptions" ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- Políticas para user_favorite_items
CREATE POLICY "Users can manage their own favorite items" ON user_favorite_items
  FOR ALL USING (auth.uid() = user_id);

-- Políticas para user_favorite_lists
CREATE POLICY "Users can view their favorite lists" ON user_favorite_lists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add lists to favorites" ON user_favorite_lists
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE id = user_favorite_lists.list_id AND (
        owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM list_collaborators
          WHERE list_id = shopping_lists.id AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can remove lists from favorites" ON user_favorite_lists
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para list_notes
CREATE POLICY "Users can view notes from their lists" ON list_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE id = list_notes.list_id AND (
        owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM list_collaborators
          WHERE list_id = shopping_lists.id AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can add notes to their lists" ON list_notes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE id = list_notes.list_id AND (
        owner_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM list_collaborators
          WHERE list_id = shopping_lists.id AND user_id = auth.uid() AND role = 'editor'
        )
      )
    )
  );

CREATE POLICY "Users can update their own notes" ON list_notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Note owners and list owners can delete notes" ON list_notes
  FOR DELETE USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE id = list_notes.list_id AND owner_id = auth.uid()
    )
  );

-- Políticas para notification_preferences
CREATE POLICY "Users can manage their notification preferences" ON notification_preferences
  FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- TRIGGERS para updated_at
-- =============================================

CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_list_notes_updated_at
  BEFORE UPDATE ON list_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- HABILITAR REALTIME para nuevas tablas
-- =============================================

ALTER PUBLICATION supabase_realtime ADD TABLE list_notes;

-- =============================================
-- POLÍTICA para ver perfiles de colaboradores (actualizada)
-- =============================================

-- Permitir ver perfiles de usuarios que son colaboradores en las mismas listas
DROP POLICY IF EXISTS "Users can view collaborator profiles" ON profiles;
CREATE POLICY "Users can view collaborator profiles" ON profiles
  FOR SELECT USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM list_collaborators lc1
      JOIN list_collaborators lc2 ON lc1.list_id = lc2.list_id
      WHERE lc1.user_id = auth.uid() AND lc2.user_id = profiles.id
    ) OR
    EXISTS (
      SELECT 1 FROM shopping_lists sl
      JOIN list_collaborators lc ON sl.id = lc.list_id
      WHERE (sl.owner_id = auth.uid() AND lc.user_id = profiles.id)
         OR (sl.owner_id = profiles.id AND lc.user_id = auth.uid())
    )
  );

-- =============================================
-- STORAGE: Bucket para avatars (ejecutar en Supabase Dashboard)
-- =============================================
-- NOTA: Esto debe ejecutarse manualmente o via API de Supabase:
--
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('avatars', 'avatars', true);
--
-- CREATE POLICY "Avatar images are publicly accessible"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'avatars');
--
-- CREATE POLICY "Users can upload their own avatar"
-- ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
--
-- CREATE POLICY "Users can update their own avatar"
-- ON storage.objects FOR UPDATE
-- USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
--
-- CREATE POLICY "Users can delete their own avatar"
-- ON storage.objects FOR DELETE
-- USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
