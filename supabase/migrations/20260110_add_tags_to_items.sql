-- Add tags column to list_items table
ALTER TABLE list_items ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Create index for tag searching
CREATE INDEX IF NOT EXISTS idx_list_items_tags ON list_items USING GIN (tags);

-- Comment
COMMENT ON COLUMN list_items.tags IS 'Array of tags for filtering and organizing items (e.g., mercadona, lidl, urgente)';
