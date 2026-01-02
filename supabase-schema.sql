-- Create predictions table
CREATE TABLE IF NOT EXISTS predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  match_id BIGINT NOT NULL,
  predicted_winner_id BIGINT NOT NULL,
  predicted_score TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(session_id, match_id)
);

-- Create index on session_id for faster queries
CREATE INDEX IF NOT EXISTS predictions_session_id_idx ON predictions(session_id);

-- Create index on match_id for faster queries
CREATE INDEX IF NOT EXISTS predictions_match_id_idx ON predictions(match_id);

-- Enable Row Level Security
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (since we're using anonymous sessions)
CREATE POLICY "Allow all operations for everyone" ON predictions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_predictions_updated_at BEFORE UPDATE ON predictions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create view for prediction statistics
CREATE OR REPLACE VIEW prediction_stats AS
SELECT
  match_id,
  predicted_winner_id,
  COUNT(*) as vote_count,
  ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY match_id)), 2) as vote_percentage
FROM predictions
GROUP BY match_id, predicted_winner_id;
