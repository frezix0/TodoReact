-- Insert sample todos for demonstration with current dates
INSERT INTO todos (title, description, completed, priority, due_date, category_id) VALUES
    -- Work category todos (category_id = 1)
    ('Complete coding challenge', 'Build a full-stack todo application for Industrix interview', FALSE, 'high', CURRENT_TIMESTAMP + INTERVAL '3 days', 1),
    ('Review pull requests', 'Review and approve pending pull requests from team members', FALSE, 'medium', CURRENT_TIMESTAMP + INTERVAL '2 days', 1),
    ('Attend team standup', 'Daily standup meeting at 9:00 AM', TRUE, 'low', CURRENT_TIMESTAMP + INTERVAL '1 day', 1),
    ('Update project documentation', 'Update README and API documentation for the new features', FALSE, 'medium', CURRENT_TIMESTAMP + INTERVAL '5 days', 1),
    ('Deploy to staging', 'Deploy latest changes to staging environment for testing', FALSE, 'high', CURRENT_TIMESTAMP + INTERVAL '2 days', 1),
    
    -- Personal category todos (category_id = 2)
    ('Call parents', 'Weekly check-in call with mom and dad', FALSE, 'medium', CURRENT_TIMESTAMP + INTERVAL '3 days', 2),
    ('Book dentist appointment', 'Schedule regular dental checkup', FALSE, 'low', CURRENT_TIMESTAMP + INTERVAL '10 days', 2),
    ('Plan weekend trip', 'Research and book accommodation for weekend getaway', FALSE, 'low', CURRENT_TIMESTAMP + INTERVAL '15 days', 2),
    ('Read 30 pages of book', 'Continue reading "Clean Code" book', TRUE, 'low', CURRENT_TIMESTAMP + INTERVAL '1 day', 2),
    ('Exercise for 30 minutes', 'Complete daily workout routine', TRUE, 'medium', CURRENT_TIMESTAMP + INTERVAL '1 hour', 2),
    
    -- Shopping category todos (category_id = 3)
    ('Buy groceries', 'Weekly grocery shopping - milk, bread, vegetables, fruits', FALSE, 'medium', CURRENT_TIMESTAMP + INTERVAL '2 days', 3),
    ('Order new laptop charger', 'Current charger is starting to fail', FALSE, 'high', CURRENT_TIMESTAMP + INTERVAL '2 days', 3),
    ('Buy birthday gift', 'Find and purchase gift for sister''s birthday next week', FALSE, 'medium', CURRENT_TIMESTAMP + INTERVAL '4 days', 3),
    ('Refill coffee supplies', 'Buy coffee beans and filters', TRUE, 'low', CURRENT_TIMESTAMP + INTERVAL '1 day', 3),
    
    -- Health category todos (category_id = 4)
    ('Take vitamins', 'Daily vitamin D and B12 supplements', TRUE, 'low', CURRENT_TIMESTAMP + INTERVAL '1 hour', 4),
    ('Schedule annual checkup', 'Book appointment with family doctor', FALSE, 'medium', CURRENT_TIMESTAMP + INTERVAL '7 days', 4),
    ('Drink 8 glasses of water', 'Stay hydrated throughout the day', FALSE, 'medium', CURRENT_TIMESTAMP + INTERVAL '12 hours', 4),
    ('Get 8 hours of sleep', 'Maintain healthy sleep schedule', TRUE, 'high', CURRENT_TIMESTAMP + INTERVAL '8 hours', 4),
    
    -- Learning category todos (category_id = 5) - Note: This assumes category_id 5 exists
    ('Complete React tutorial', 'Finish the advanced React patterns course on Udemy', FALSE, 'medium', CURRENT_TIMESTAMP + INTERVAL '5 days', 5),
    ('Practice TypeScript', 'Solve 5 TypeScript exercises on coding platform', FALSE, 'low', CURRENT_TIMESTAMP + INTERVAL '3 days', 5),
    ('Read tech article', 'Read latest article about microservices architecture', TRUE, 'low', CURRENT_TIMESTAMP + INTERVAL '1 day', 5),
    ('Watch PostgreSQL tutorial', 'Learn about advanced PostgreSQL features and optimization', FALSE, 'medium', CURRENT_TIMESTAMP + INTERVAL '4 days', 5),
    ('Study system design', 'Review system design concepts for upcoming interviews', FALSE, 'high', CURRENT_TIMESTAMP + INTERVAL '6 days', 5)

ON CONFLICT DO NOTHING;

-- Update statistics after inserting sample data
ANALYZE categories;
ANALYZE todos;

-- Create a summary of inserted data
DO $$
DECLARE
    total_todos INTEGER;
    completed_todos INTEGER;
    pending_todos INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_todos FROM todos;
    SELECT COUNT(*) INTO completed_todos FROM todos WHERE completed = TRUE;
    SELECT COUNT(*) INTO pending_todos FROM todos WHERE completed = FALSE;
    
    RAISE NOTICE 'Sample data inserted successfully:';
    RAISE NOTICE '- Total todos: %', total_todos;
    RAISE NOTICE '- Completed todos: %', completed_todos;
    RAISE NOTICE '- Pending todos: %', pending_todos;
END $$;