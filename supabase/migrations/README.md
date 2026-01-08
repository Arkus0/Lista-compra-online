# Database Migrations

## How to apply migrations

### Option 1: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the content of the migration file
4. Paste and run the SQL

### Option 2: Using Supabase CLI
```bash
supabase db push
```

## Migrations

### 20260108_add_position_to_list_items.sql
Adds a `position` field to the `list_items` table to support drag and drop functionality.
This allows users to reorder items in their shopping lists manually.

**What it does:**
- Adds `position` column (integer, default 0)
- Sets initial positions based on creation date
- Creates index for better query performance
