-- Clear only group stage predictions (keeps tournament predictions and user sessions)
-- This will delete all predictions for group stage matches
-- Tournament predictions (semifinals, finals) will remain intact

-- Delete all group stage predictions
DELETE FROM predictions;

-- Verify table is empty
SELECT 'predictions' as table_name, COUNT(*) as remaining_rows FROM predictions;

-- Check tournament predictions (should still be there)
SELECT 'tournament_predictions' as table_name, COUNT(*) as remaining_rows FROM tournament_predictions;

-- Check user sessions (should still be there)
SELECT 'user_sessions' as table_name, COUNT(*) as remaining_rows FROM user_sessions;
