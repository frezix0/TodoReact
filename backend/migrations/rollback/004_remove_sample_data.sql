DELETE FROM todos WHERE id > 0;

SELECT setval('todos_id_seq', 1, false);

ANALYZE categories;
ANALYZE todos;

DO $$
DECLARE
    total_todos INTEGER;
    total_categories INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_todos FROM todos;
    SELECT COUNT(*) INTO total_categories FROM categories;
    
    RAISE NOTICE 'Sample data removed successfully:';
    RAISE NOTICE '- Total todos remaining: %', total_todos;
    RAISE NOTICE '- Total categories remaining: %', total_categories;
END $$;