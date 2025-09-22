-- Drop search function
DROP FUNCTION IF EXISTS search_todos(TEXT);

-- Drop view
DROP VIEW IF EXISTS todo_stats;

-- Drop constraints added in migration 003
ALTER TABLE todos DROP CONSTRAINT IF EXISTS todos_due_date_future;

-- Drop full-text search indexes
DROP INDEX IF EXISTS idx_todos_title_gin;
DROP INDEX IF EXISTS idx_todos_description_gin;

-- Drop partial indexes
DROP INDEX IF EXISTS idx_todos_completed_true;
DROP INDEX IF EXISTS idx_todos_completed_false;
DROP INDEX IF EXISTS idx_todos_high_priority;

-- Drop specialized indexes
DROP INDEX IF EXISTS idx_todos_overdue;
DROP INDEX IF EXISTS idx_todos_upcoming;

-- Drop composite index
DROP INDEX IF EXISTS idx_todos_category_priority_created;