-- =============================================
-- MIGRACIÓN: Añadir campos para archivo y plantillas
-- Ejecutar en el SQL Editor de Supabase
-- =============================================

-- Añadir campos para soft-delete y completado en shopping_lists
ALTER TABLE shopping_lists
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT FALSE;

-- Índice para búsquedas de listas archivadas
CREATE INDEX IF NOT EXISTS idx_shopping_lists_archived ON shopping_lists(is_archived) WHERE is_archived = TRUE;

-- Índice para plantillas
CREATE INDEX IF NOT EXISTS idx_shopping_lists_templates ON shopping_lists(is_template) WHERE is_template = TRUE;

-- Añadir campo para asignación de items a personas
ALTER TABLE list_items
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS checked_by UUID REFERENCES profiles(id);

-- Crear tabla para historial de compras (registro de listas completadas)
CREATE TABLE IF NOT EXISTS purchase_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  list_id UUID REFERENCES shopping_lists(id) ON DELETE SET NULL,
  list_name TEXT NOT NULL,
  items_count INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  items_snapshot JSONB -- Guardar copia de items al completar
);

-- RLS para purchase_history
ALTER TABLE purchase_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own purchase history" ON purchase_history
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own purchase history" ON purchase_history
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own purchase history" ON purchase_history
  FOR DELETE USING (user_id = auth.uid());

-- Índice para historial
CREATE INDEX IF NOT EXISTS idx_purchase_history_user ON purchase_history(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_history_date ON purchase_history(completed_at DESC);

-- Actualizar políticas de shopping_lists para incluir archivadas
-- (Las políticas existentes ya funcionan, solo necesitamos filtrar en la app)
