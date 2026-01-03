-- Clear all betting data from database
-- This will delete all predictions, tournament predictions, and user sessions
-- The tables and their structure will remain intact

-- Delete all group stage predictions
DELETE FROM predictions;

-- Delete all tournament predictions (semifinals, finals)
DELETE FROM tournament_predictions;

-- Delete all user sessions (usernames)
DELETE FROM user_sessions;

-- Verify tables are empty
SELECT 'predictions' as table_name, COUNT(*) as remaining_rows FROM predictions
UNION ALL
SELECT 'tournament_predictions' as table_name, COUNT(*) as remaining_rows FROM tournament_predictions
UNION ALL
SELECT 'user_sessions' as table_name, COUNT(*) as remaining_rows FROM user_sessions;
