-- Drop trigger first
DROP TRIGGER IF EXISTS update_todos_updated_at ON todos;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop indexes
DROP INDEX IF EXISTS idx_todos_title;
DROP INDEX IF EXISTS idx_todos_completed;
DROP INDEX IF EXISTS idx_todos_category_id;
DROP INDEX IF EXISTS idx_todos_priority;
DROP INDEX IF EXISTS idx_todos_due_date;
DROP INDEX IF EXISTS idx_todos_created_at;
DROP INDEX IF EXISTS idx_todos_updated_at;
DROP INDEX IF EXISTS idx_todos_category_completed;
DROP INDEX IF EXISTS idx_todos_priority_due_date;

-- Drop table
DROP TABLE IF EXISTS todos CASCADE;

-- Drop enum type
DROP TYPE IF EXISTS priority_enum;