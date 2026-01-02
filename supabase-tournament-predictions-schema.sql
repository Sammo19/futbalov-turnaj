-- Create tournament_predictions table for semifinalists and finalists predictions
CREATE TABLE IF NOT EXISTS tournament_predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  prediction_type TEXT NOT NULL, -- 'semifinalist' or 'finalist'
  team_id INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(session_id, prediction_type, team_id)
);

-- Create index on session_id for faster queries
CREATE INDEX IF NOT EXISTS tournament_predictions_session_id_idx ON tournament_predictions(session_id);
CREATE INDEX IF NOT EXISTS tournament_predictions_type_idx ON tournament_predictions(prediction_type);

-- Enable Row Level Security
ALTER TABLE tournament_predictions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for everyone (anonymous betting)
CREATE POLICY "Allow all operations for everyone" ON tournament_predictions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create view for tournament prediction stats
CREATE OR REPLACE VIEW tournament_prediction_stats AS
SELECT
  prediction_type,
  team_id,
  COUNT(*) as vote_count
FROM tournament_predictions
GROUP BY prediction_type, team_id
ORDER BY prediction_type, vote_count DESC;
