-- =============================================
-- MIGRACIÓN: Sistema de Notificaciones con Historial
-- Fecha: 2026-01-09
-- Feature: Historial de notificaciones en UI
-- =============================================

-- =============================================
-- 1. TABLA: notifications (Historial de notificaciones)
-- =============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('item_added', 'item_removed', 'item_checked', 'note_added', 'collaborator_joined')),
  actor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  actor_name TEXT NOT NULL,
  list_name TEXT NOT NULL,
  item_name TEXT, -- Opcional para notificaciones de items
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_list_id ON notifications(list_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

COMMENT ON TABLE notifications IS 'Historial de notificaciones para usuarios';
COMMENT ON COLUMN notifications.type IS 'Tipo de notificación: item_added, item_removed, item_checked, note_added, collaborator_joined';
COMMENT ON COLUMN notifications.actor_id IS 'Usuario que realizó la acción';
COMMENT ON COLUMN notifications.actor_name IS 'Nombre del usuario que realizó la acción (snapshot)';
COMMENT ON COLUMN notifications.list_name IS 'Nombre de la lista (snapshot)';
COMMENT ON COLUMN notifications.item_name IS 'Nombre del item (solo para notificaciones de items)';

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Los usuarios solo pueden ver sus propias notificaciones
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Los usuarios pueden marcar sus notificaciones como leídas
CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Los usuarios pueden eliminar sus propias notificaciones
CREATE POLICY "Users can delete their own notifications" ON notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Sistema puede insertar notificaciones (para cualquier usuario)
-- Esto permite que el backend cree notificaciones para otros usuarios
CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- =============================================
-- HABILITAR REALTIME
-- =============================================

ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- =============================================
-- FUNCIÓN: Limpiar notificaciones antiguas
-- =============================================

-- Función para eliminar notificaciones leídas de más de 30 días
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM notifications
  WHERE is_read = true
    AND created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- FUNCIÓN: Marcar todas como leídas
-- =============================================

CREATE OR REPLACE FUNCTION mark_all_notifications_read(target_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE notifications
  SET is_read = true
  WHERE user_id = target_user_id
    AND is_read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
