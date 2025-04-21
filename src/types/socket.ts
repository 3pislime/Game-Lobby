import { GameSession, Player } from './game';

export interface ServerToClientEvents {
  sessionCreated: (data: { session: GameSession }) => void;
  playerJoined: (data: { session: GameSession; player: Player }) => void;
  playerListUpdated: (data: { session: GameSession; playerCount: number }) => void;
  gameStarted: (data: { session: GameSession }) => void;
  gameEnded: (data: { session: GameSession; reason: 'timeout' | 'completed' }) => void;
  timerUpdate: (data: { timeLeft: number }) => void;
  correctGuess: (data: { session: GameSession; playerId: string; points: number }) => void;
  incorrectGuess: () => void;
  error: (data: { message: string }) => void;
  question_confirmed: () => void;
  'start-session-error': (data: { message: string }) => void;
  'session-started': (data: { session: GameSession }) => void;
  'player-count': (data: { count: number }) => void;
  'timer-update': (data: { timeRemaining: number }) => void;
  guessResult: (data: {
    success: boolean;
    message: string;
    attemptsLeft: number;
  }) => void;
  gameOver: (data: {
    winner: string;
    correctAnswer: string;
    finalScores: Record<string, number>;
  }) => void;
}

export interface ClientToServerEvents {
  createGame: (data: { playerName: string; question: string; answer: string }) => void;
  joinGame: (data: { sessionId: string; playerName: string }) => void;
  startGame: (data: { sessionId: string }) => void;
  submitGuess: (data: {
    sessionId: string;
    guess: string;
  }) => void;
  joinSession: (
    data: { sessionId: string; playerName: string },
    callback: (response: { success: boolean; error?: string; session?: GameSession }) => void
  ) => void;
  submit_question: (data: { sessionId: string; question: string; answer: string }) => void;
  'start-session': (data: { sessionId: string }) => void;
}

export interface SocketData {
  userId: string;
  sessionId?: string;
}

export interface InterServerEvents {
  ping: () => void;
}