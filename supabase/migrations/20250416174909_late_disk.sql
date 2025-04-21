/*
  # Multiplayer Game Schema

  1. New Tables
    - `games`
      - `game_id` (UUID, primary key)
      - `creator_name` (text, not null)
      - `question` (text, not null)
      - `answer` (text, not null)
      - `created_at` (timestamptz, default: now())
    - `players`
      - `player_id` (UUID, primary key)
      - `player_name` (text, not null)
      - `game_id` (UUID, foreign key)
      - `joined_at` (timestamptz, default: now())

  2. Security
    - Enable RLS on both tables
    - Policies for authenticated users only
    - Read access limited to created/joined games
    - No updates/deletes allowed

  3. Constraints & Indexes
    - Foreign key constraint on players.game_id
    - Unique constraint on player_name per game
    - Indexes for performance optimization
*/

-- Create games table
CREATE TABLE IF NOT EXISTS games (
  game_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_name TEXT NOT NULL,
  question TEXT NOT NULL CHECK (length(trim(question)) >= 10),
  answer TEXT NOT NULL CHECK (length(trim(answer)) >= 1),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create players table
CREATE TABLE IF NOT EXISTS players (
  player_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name TEXT NOT NULL CHECK (length(trim(player_name)) >= 2),
  game_id UUID NOT NULL REFERENCES games(game_id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  -- Prevent duplicate players in the same game
  UNIQUE(game_id, player_name)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_players_game_id ON players(game_id);
CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at DESC);

-- Enable Row Level Security
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Games policies
CREATE POLICY "Users can create games"
  ON games
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can read their own games or games they've joined"
  ON games
  FOR SELECT
  TO authenticated
  USING (
    game_id IN (
      -- Games created by the user
      SELECT game_id FROM games WHERE auth.uid()::text = creator_name
      UNION
      -- Games joined by the user
      SELECT game_id FROM players WHERE auth.uid()::text = player_name
    )
  );

-- Players policies
CREATE POLICY "Users can join games"
  ON players
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Verify game exists and player name matches auth user
    EXISTS (
      SELECT 1 FROM games WHERE game_id = players.game_id
    ) AND
    auth.uid()::text = player_name
  );

CREATE POLICY "Users can read player info for their games"
  ON players
  FOR SELECT
  TO authenticated
  USING (
    game_id IN (
      -- Games created by the user
      SELECT game_id FROM games WHERE auth.uid()::text = creator_name
      UNION
      -- Games joined by the user
      SELECT game_id FROM players WHERE auth.uid()::text = player_name
    )
  );

-- Disable updates and deletes through RLS
CREATE POLICY "No updates allowed"
  ON games
  FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY "No deletes allowed"
  ON games
  FOR DELETE
  TO authenticated
  USING (false);

CREATE POLICY "No player updates allowed"
  ON players
  FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY "No player deletes allowed"
  ON players
  FOR DELETE
  TO authenticated
  USING (false);