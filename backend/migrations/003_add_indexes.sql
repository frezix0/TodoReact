-- Migration: Add full-text search indexes to todos table
CREATE INDEX IF NOT EXISTS idx_todos_title_gin ON todos USING GIN (to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_todos_description_gin ON todos USING GIN (to_tsvector('english', description));

-- Additional indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_todos_completed_true ON todos(created_at DESC) WHERE completed = TRUE;
CREATE INDEX IF NOT EXISTS idx_todos_completed_false ON todos(created_at DESC) WHERE completed = FALSE;
CREATE INDEX IF NOT EXISTS idx_todos_high_priority ON todos(created_at DESC) WHERE priority = 'high';

-- Index for frequently queried due dates
CREATE INDEX IF NOT EXISTS idx_todos_overdue ON todos(due_date, completed) 
    WHERE completed = FALSE;

-- Index for tasks due in the next 7 days
CREATE INDEX IF NOT EXISTS idx_todos_upcoming ON todos(due_date, completed) 
    WHERE completed = FALSE;

-- Composite index for category, priority, and creation date
CREATE INDEX IF NOT EXISTS idx_todos_category_priority_created ON todos(category_id, priority, created_at DESC);

-- Constraint to ensure due_date is not in the past when created
DO $$ 
BEGIN
    ALTER TABLE todos ADD CONSTRAINT todos_due_date_future 
        CHECK (due_date IS NULL OR due_date >= created_at);
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Constraint todos_due_date_future already exists, skipping.';
END $$;

CREATE OR REPLACE VIEW todo_stats AS
SELECT
    c.id AS category_id,
    c.name AS category_name,
    c.color AS category_color,
    COUNT(t.id) AS total_todos,
    COUNT(CASE WHEN t.completed = TRUE THEN 1 END) AS completed_todos,
    COUNT(CASE WHEN t.completed = FALSE THEN 1 END) AS pending_todos,
    COUNT(CASE WHEN t.priority = 'high' THEN 1 END) AS high_priority_todos,
    COUNT(CASE WHEN t.priority = 'medium' THEN 1 END) AS medium_priority_todos,
    COUNT(CASE WHEN t.priority = 'low' THEN 1 END) AS low_priority_todos,
    COUNT(CASE WHEN t.due_date < CURRENT_TIMESTAMP AND t.completed = FALSE THEN 1 END) AS overdue_todos
FROM categories c
LEFT JOIN todos t ON c.id = t.category_id
GROUP BY c.id, c.name, c.color
ORDER BY c.name;

COMMENT ON VIEW todo_stats IS 'View to provide aggregated statistics of todos by category.';

CREATE OR REPLACE FUNCTION search_todos(search_term TEXT)
RETURNS TABLE (
    id INT,
    title VARCHAR(200),
    description TEXT,
    completed BOOLEAN,
    priority priority_enum,
    due_date TIMESTAMP,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    category_id INT,
    search_rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.title,
        t.description,
        t.completed,
        t.priority,
        t.due_date,
        t.created_at,
        t.updated_at,
        t.category_id,
        ts_rank_cd(
            to_tsvector('english', COALESCE(t.title, '') || ' ' || COALESCE(t.description, '')),
            plainto_tsquery('english', search_term)
        ) as search_rank
    FROM todos t
    WHERE 
        to_tsvector('english', COALESCE(t.title, '') || ' ' || COALESCE(t.description, '')) 
        @@ plainto_tsquery('english', search_term)
    ORDER BY search_rank DESC, t.created_at DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION search_todos(TEXT) IS 'Function to perform full-text search on todos by title and description, returning results ranked by relevance.';