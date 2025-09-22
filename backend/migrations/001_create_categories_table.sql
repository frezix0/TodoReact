CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT category_name_unique UNIQUE (name),
    CONSTRAINT categories_color_format CHECK (color ~ '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$')
);

CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

INSERT INTO categories (name, color) VALUES
('Work', '#3B82F6'),
('Personal', '#10B981'),
('Shopping', '#F59E0B'),
('Health', '#EF4444'),
('Finance', '#8B5CF6')
ON CONFLICT (name) DO NOTHING;

COMMENT ON TABLE categories IS 'Table to store task categories with unique names and color codes.';
COMMENT ON COLUMN categories.id IS 'Primary key for the categories table.';
COMMENT ON COLUMN categories.name IS 'Name of the category, must be unique.';
COMMENT ON COLUMN categories.color IS 'Hex color code associated with the category.';
COMMENT ON COLUMN categories.created_at IS 'Timestamp when the category was created.';