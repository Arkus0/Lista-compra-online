-- =============================================
-- MIGRACIÓN: Corregir política RLS para user_favorite_items
-- Fecha: 2026-01-10
-- Fix: La política FOR ALL USING(...) no funcionaba para INSERT
--      Se necesita WITH CHECK para INSERT
-- =============================================

-- Eliminar la política anterior
DROP POLICY IF EXISTS "Users can manage their own favorite items" ON user_favorite_items;

-- Crear políticas separadas para cada operación
-- SELECT: Los usuarios pueden ver sus propios favoritos
CREATE POLICY "Users can view their own favorite items" ON user_favorite_items
  FOR SELECT USING (auth.uid() = user_id);

-- INSERT: Los usuarios pueden crear sus propios favoritos
CREATE POLICY "Users can insert their own favorite items" ON user_favorite_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- UPDATE: Los usuarios pueden actualizar sus propios favoritos
CREATE POLICY "Users can update their own favorite items" ON user_favorite_items
  FOR UPDATE USING (auth.uid() = user_id);

-- DELETE: Los usuarios pueden eliminar sus propios favoritos
CREATE POLICY "Users can delete their own favorite items" ON user_favorite_items
  FOR DELETE USING (auth.uid() = user_id);
