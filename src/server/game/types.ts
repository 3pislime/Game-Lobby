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

export interface CreateSessionParams {
  gameMaster: Player;
  question: string;
  answer: string;
  timer: number;
}

export interface UpdateSessionParams {
  question?: string;
  answer?: string;
  timer?: number;
  status?: 'waiting' | 'active' | 'completed';
}

export class GameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GameError';
  }
}