DO $$ BEGIN
    CREATE TYPE priority_enum AS ENUM ('high', 'medium', 'low');
EXCEPTION
    WHEN duplicate_object THEN NULL; -- Ignore if the type already exists
END $$;

CREATE TABLE IF NOT EXISTS todos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    priority priority_enum NOT NULL DEFAULT 'medium',
    due_date TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    category_id INTEGER NOT NULL,

    CONSTRAINT fk_todos_category_id 
        FOREIGN KEY (category_id) 
        REFERENCES categories(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT todos_title_not_empty CHECK (LENGTH(TRIM(title)) > 0)
);

-- Trigger to update the updated_at column on row update
CREATE INDEX IF NOT EXISTS idx_todos_title ON todos(title);
CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(completed);
CREATE INDEX IF NOT EXISTS idx_todos_category_id ON todos(category_id);
CREATE INDEX IF NOT EXISTS idx_todos_priority ON todos(priority);
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);
CREATE INDEX IF NOT EXISTS idx_todos_created_at ON todos(created_at);
CREATE INDEX IF NOT EXISTS idx_todos_updated_at ON todos(updated_at);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_todos_category_completed ON todos(category_id, completed);
CREATE INDEX IF NOT EXISTS idx_todos_category_priority_due_date ON todos(priority, due_date);

-- Function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function before any update
DROP TRIGGER IF EXISTS update_todos_updated_at ON todos;
CREATE TRIGGER update_todos_updated_at
    BEFORE UPDATE ON todos
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

COMMENT ON TABLE todos IS 'Table to store to-do items with various attributes including priority and category.';
COMMENT ON COLUMN todos.id IS 'Primary key for the todos table.';
COMMENT ON COLUMN todos.title IS 'Title of the to-do item, cannot be empty.';
COMMENT ON COLUMN todos.description IS 'Detailed description of the to-do item.';
COMMENT ON COLUMN todos.completed IS 'Boolean flag indicating if the to-do item is completed.';
COMMENT ON COLUMN todos.priority IS 'Priority level of the to-do item, can be high, medium, or low.';
COMMENT ON COLUMN todos.due_date IS 'Optional due date for the to-do item.';
COMMENT ON COLUMN todos.created_at IS 'Timestamp when the to-do item was created.';
COMMENT ON COLUMN todos.updated_at IS 'Timestamp when the to-do item was last updated.';
COMMENT ON COLUMN todos.category_id IS 'Foreign key referencing the category of the to-do item.';

