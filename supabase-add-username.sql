-- Add username column to predictions table
ALTER TABLE predictions
ADD COLUMN IF NOT EXISTS username TEXT;

-- Add username column to tournament_predictions table
ALTER TABLE tournament_predictions
ADD COLUMN IF NOT EXISTS username TEXT;

-- Create index on username for faster queries
CREATE INDEX IF NOT EXISTS predictions_username_idx ON predictions(username);
CREATE INDEX IF NOT EXISTS tournament_predictions_username_idx ON tournament_predictions(username);
