import { v4 as uuidv4 } from 'uuid';
import type { 
  Player, 
  GameSession, 
  CreateSessionParams, 
  UpdateSessionParams 
} from './types';
import { GameError } from './types';

export class GameManager {
  private sessions: Map<string, GameSession>;
  private playerAttempts: Map<string, Map<string, number>>;
  private timers: Map<string, NodeJS.Timeout>;

  constructor() {
    this.sessions = new Map();
    this.playerAttempts = new Map();
    this.timers = new Map();
  }

  private getPlayerAttempts(sessionId: string, playerId: string): number {
    const sessionAttempts = this.playerAttempts.get(sessionId);
    if (!sessionAttempts) return 0;
    return sessionAttempts.get(playerId) || 0;
  }

  private incrementPlayerAttempts(sessionId: string, playerId: string): number {
    if (!this.playerAttempts.has(sessionId)) {
      this.playerAttempts.set(sessionId, new Map());
    }
    const sessionAttempts = this.playerAttempts.get(sessionId)!;
    const currentAttempts = this.getPlayerAttempts(sessionId, playerId);
    sessionAttempts.set(playerId, currentAttempts + 1);
    return currentAttempts + 1;
  }

  createSession(params: CreateSessionParams): GameSession {
    const { gameMaster, question, answer, timer } = params;
    
    const session: GameSession = {
      id: uuidv4(),
      gameMaster,
      players: [gameMaster],
      question,
      answer,
      status: 'waiting',
      timer,
      scores: { [gameMaster.id]: 0 }
    };

    this.sessions.set(session.id, session);
    this.playerAttempts.set(session.id, new Map());
    return session;
  }

  updateSession(sessionId: string, updates: UpdateSessionParams): GameSession {
    const session = this.getSession(sessionId);
    
    if (!session) {
      throw new GameError(`Session ${sessionId} not found`);
    }

    const updatedSession = {
      ...session,
      ...updates
    };

    this.sessions.set(sessionId, updatedSession);
    return updatedSession;
  }

  deleteSession(sessionId: string): boolean {
    this.clearGameTimer(sessionId);
    return this.sessions.delete(sessionId);
  }

  getSession(sessionId: string): GameSession | null {
    return this.sessions.get(sessionId) || null;
  }

  listActiveSessions(): GameSession[] {
    return Array.from(this.sessions.values())
      .filter(session => session.status !== 'completed');
  }

  addPlayer(sessionId: string, playerName: string): Player {
    const session = this.getSession(sessionId);
    
    if (!session) {
      throw new GameError(`Session ${sessionId} not found`);
    }

    if (session.status !== 'waiting') {
      throw new GameError('Cannot join a game that has already started');
    }

    const newPlayer: Player = {
      id: uuidv4(),
      name: playerName,
      score: 0,
      attempts: 0
    };

    session.players.push(newPlayer);
    session.scores[newPlayer.id] = 0;
    this.sessions.set(sessionId, session);

    return newPlayer;
  }

  removePlayer(sessionId: string, playerId: string): boolean {
    const session = this.getSession(sessionId);
    
    if (!session) {
      throw new GameError(`Session ${sessionId} not found`);
    }

    const initialLength = session.players.length;
    session.players = session.players.filter(player => player.id !== playerId);
    delete session.scores[playerId];

    if (session.players.length === 0) {
      this.deleteSession(sessionId);
      return true;
    }

    // If the game master left, assign a new one
    if (session.gameMaster.id === playerId && session.players.length > 0) {
      session.gameMaster = session.players[0];
    }

    this.sessions.set(sessionId, session);
    return initialLength !== session.players.length;
  }

  updatePlayerScore(sessionId: string, playerId: string, points: number): number {
    const session = this.getSession(sessionId);
    
    if (!session) {
      throw new GameError(`Session ${sessionId} not found`);
    }

    const player = session.players.find(p => p.id === playerId);
    
    if (!player) {
      throw new GameError(`Player ${playerId} not found in session ${sessionId}`);
    }

    player.score += points;
    session.scores[playerId] = player.score;
    player.attempts += 1;

    this.sessions.set(sessionId, session);
    return player.score;
  }

  startGameTimer(sessionId: string, io: any): void {
    const session = this.getSession(sessionId);
    if (!session) throw new GameError('Session not found');

    // Clear any existing timer
    this.clearGameTimer(sessionId);

    let timeRemaining = 60; // 60 seconds
    session.timer = timeRemaining;

    const timer = setInterval(() => {
      timeRemaining--;
      session.timer = timeRemaining;

      // Emit timer update to all players in the session
      io.to(sessionId).emit('timer-update', { timeRemaining });

      if (timeRemaining <= 0) {
        this.clearGameTimer(sessionId);
        this.updateSession(sessionId, { status: 'completed' });
        
        io.to(sessionId).emit('gameOver', {
          reason: 'timeout',
          correctAnswer: session.answer,
          finalScores: session.scores
        });
      }
    }, 1000);

    this.timers.set(sessionId, timer);
  }

  clearGameTimer(sessionId: string): void {
    const existingTimer = this.timers.get(sessionId);
    if (existingTimer) {
      clearInterval(existingTimer);
      this.timers.delete(sessionId);
    }
  }

  submitGuess(sessionId: string, playerId: string, guess: string): {
    success: boolean;
    message: string;
    attemptsLeft: number;
    isGameOver: boolean;
    winner?: string;
    correctAnswer?: string;
    finalScores?: Record<string, number>;
  } {
    const session = this.getSession(sessionId);
    
    if (!session) {
      throw new GameError('Session not found');
    }

    if (session.status !== 'active' || session.timer <= 0) {
      throw new GameError('Game is not active or time has expired');
    }

    const currentAttempts = this.getPlayerAttempts(sessionId, playerId);
    
    if (currentAttempts >= 3) {
      return {
        success: false,
        message: 'You have no attempts left',
        attemptsLeft: 0,
        isGameOver: false
      };
    }

    const attempts = this.incrementPlayerAttempts(sessionId, playerId);
    const attemptsLeft = Math.max(0, 3 - attempts);
    const isCorrect = guess.toLowerCase() === session.answer.toLowerCase();

    if (isCorrect) {
      session.scores[playerId] = (session.scores[playerId] || 0) + 10;
      this.updateSession(sessionId, { status: 'completed' });

      const winner = session.players.find(p => p.id === playerId);

      return {
        success: true,
        message: 'Correct! You won!',
        attemptsLeft,
        isGameOver: true,
        winner: winner?.name || 'Unknown',
        correctAnswer: session.answer,
        finalScores: session.scores
      };
    }

    if (attemptsLeft === 0) {
      this.updateSession(sessionId, { status: 'completed' });
      return {
        success: false,
        message: 'No attempts left. Game Over!',
        attemptsLeft: 0,
        isGameOver: true,
        correctAnswer: session.answer,
        finalScores: session.scores
      };
    }

    return {
      success: false,
      message: `Incorrect guess. ${attemptsLeft} attempts left.`,
      attemptsLeft,
      isGameOver: false
    };
  }
}

export default GameManager;