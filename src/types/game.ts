export interface Player {
  id: string;
  name: string;
  score: number;
  attempts: number;
}

export interface GameSession {
  id: string;
  gameMaster: Player;
  players: Player[];
  question: string;
  answer: string;
  status: 'waiting' | 'active' | 'completed';
  timer: number;
  scores: Record<string, number>;
}

export interface GameState {
  currentSession: GameSession | null;
  isConnected: boolean;
  error: string | null;
  isLoading: boolean;
  disconnectedPlayers: Set<string>;
}

export interface CreateGameData {
  playerName: string;
  question: string;
  answer: string;
}

export interface JoinGameData {
  sessionId: string;
  playerName: string;
}