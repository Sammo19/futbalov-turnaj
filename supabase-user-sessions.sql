-- Create user_sessions table to track usernames
CREATE TABLE IF NOT EXISTS user_sessions (
  session_id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create index on username for faster lookups
CREATE INDEX IF NOT EXISTS user_sessions_username_idx ON user_sessions(username);

-- Enable RLS (Row Level Security)
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (since we're using anon key)
CREATE POLICY "Allow all operations" ON user_sessions FOR ALL USING (true);
