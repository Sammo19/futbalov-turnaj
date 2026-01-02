-- Create players table
CREATE TABLE IF NOT EXISTS players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_name TEXT NOT NULL,
  player_name TEXT NOT NULL,
  player_number INTEGER,
  position TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index on team_name for faster queries
CREATE INDEX IF NOT EXISTS players_team_name_idx ON players(team_name);

-- Enable Row Level Security
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Create policy to allow reading for everyone
CREATE POLICY "Allow read access for everyone" ON players
  FOR SELECT
  USING (true);

-- Create policy to allow all operations with admin password
CREATE POLICY "Allow all operations with admin password" ON players
  FOR ALL
  USING (
    current_setting('request.jwt.claims', true)::json->>'admin_password' = 'your_admin_password_here'
  )
  WITH CHECK (
    current_setting('request.jwt.claims', true)::json->>'admin_password' = 'your_admin_password_here'
  );

-- Create updated_at trigger
CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
