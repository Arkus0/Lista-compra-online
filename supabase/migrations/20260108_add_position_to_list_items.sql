-- Add position column to list_items table
ALTER TABLE list_items ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

-- Set initial position values based on created_at for existing items
WITH ranked_items AS (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY list_id ORDER BY created_at) - 1 AS row_num
  FROM list_items
)
UPDATE list_items
SET position = ranked_items.row_num
FROM ranked_items
WHERE list_items.id = ranked_items.id;

-- Create index for better performance on position queries
CREATE INDEX IF NOT EXISTS idx_list_items_position ON list_items(list_id, position);

-- Add comment to the column
COMMENT ON COLUMN list_items.position IS 'Custom sort order for drag and drop functionality';
