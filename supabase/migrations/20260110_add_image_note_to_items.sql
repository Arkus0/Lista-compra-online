-- =============================================
-- MIGRACIÓN: Añadir image_url y note a list_items
-- Permite añadir imágenes y notas específicas a cada item
-- =============================================

-- Añadir columna para URL de imagen del producto
ALTER TABLE list_items
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Añadir columna para nota específica del item
ALTER TABLE list_items
  ADD COLUMN IF NOT EXISTS note TEXT;

-- Comentarios descriptivos
COMMENT ON COLUMN list_items.image_url IS 'URL de la imagen del producto subida por el usuario';
COMMENT ON COLUMN list_items.note IS 'Nota o comentario específico para este item (ej: marca preferida, ubicación en tienda)';
