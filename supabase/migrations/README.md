# Migraciones de Base de Datos

## Aplicar migración de Purchase History

La migración `20260109_create_purchase_history.sql` crea la tabla de historial de compras.

### Opción 1: Desde Supabase Dashboard (Recomendado para producción)

1. Ve a tu proyecto en https://supabase.com
2. Navega a **SQL Editor**
3. Copia el contenido de `20260109_create_purchase_history.sql`
4. Pégalo en el editor y ejecuta

### Opción 2: Desde CLI de Supabase (Desarrollo local)

```bash
# Si tienes Supabase CLI instalado
supabase db push

# O aplicar manualmente
supabase db execute -f supabase/migrations/20260109_create_purchase_history.sql
```

### Opción 3: Verificación manual

Ejecuta esta query para verificar que la tabla existe:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'purchase_history';
```

## ¿Qué hace esta migración?

- Crea la tabla `purchase_history` para guardar el historial de productos comprados
- Añade índices para optimizar las consultas
- Configura Row Level Security (RLS) para proteger los datos de cada usuario
- Permite a los usuarios ver solo su propio historial de compras

## Rollback (Si necesitas revertir)

```sql
DROP TABLE IF EXISTS purchase_history CASCADE;
```

⚠️ **Advertencia**: Esto borrará todos los datos del historial de compras permanentemente.
