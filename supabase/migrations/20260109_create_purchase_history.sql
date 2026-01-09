-- Crear tabla de historial de compras
CREATE TABLE IF NOT EXISTS purchase_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  list_id UUID REFERENCES shopping_lists(id) ON DELETE SET NULL,
  list_name TEXT NOT NULL,
  item_name TEXT NOT NULL,
  quantity NUMERIC DEFAULT 1,
  unit TEXT,
  category TEXT,
  price NUMERIC,
  purchased_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para mejorar performance
CREATE INDEX idx_purchase_history_user_id ON purchase_history(user_id);
CREATE INDEX idx_purchase_history_item_name ON purchase_history(item_name);
CREATE INDEX idx_purchase_history_purchased_at ON purchase_history(purchased_at);
CREATE INDEX idx_purchase_history_category ON purchase_history(category);

-- RLS (Row Level Security)
ALTER TABLE purchase_history ENABLE ROW LEVEL SECURITY;

-- Policy: Los usuarios solo pueden ver su propio historial
CREATE POLICY "Users can view own purchase history"
  ON purchase_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Los usuarios pueden insertar su propio historial
CREATE POLICY "Users can insert own purchase history"
  ON purchase_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Comentarios
COMMENT ON TABLE purchase_history IS 'Historial de productos comprados por usuarios';
COMMENT ON COLUMN purchase_history.purchased_at IS 'Fecha en que se marcó el item como comprado';
