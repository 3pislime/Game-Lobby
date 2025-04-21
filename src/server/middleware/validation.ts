import { Socket } from 'socket.io';
import { z } from 'zod';
import { validateSessionName, validatePlayerName, validateQuestion, validateAnswer, validateGuess } from '../../utils/validation';
import { GameManager } from '../game/GameManager';

export function createValidationMiddleware(gameManager: GameManager) {
  return {
    validateCreateSession: (socket: Socket, next: (err?: Error) => void) => {
      const { sessionName, playerName } = socket.handshake.query;

      // Validate session name
      const sessionResult = validateSessionName(sessionName as string);
      if (!sessionResult.success) {
        return next(new Error(`Invalid session name: ${sessionResult.error.errors[0].message}`));
      }

      // Check for unique session name
      const sessions = gameManager.listActiveSessions();
      const sessionExists = sessions.some(s => s.id.toLowerCase() === sessionName?.toString().toLowerCase());
      if (sessionExists) {
        return next(new Error('Session name already exists'));
      }

      // Validate player name
      const playerResult = validatePlayerName(playerName as string);
      if (!playerResult.success) {
        return next(new Error(`Invalid player name: ${playerResult.error.errors[0].message}`));
      }

      next();
    },

    validateJoinSession: (socket: Socket, next: (err?: Error) => void) => {
      const { sessionId, playerName } = socket.handshake.query;

      // Validate session exists
      const session = gameManager.getSession(sessionId as string);
      if (!session) {
        return next(new Error('Session not found'));
      }

      // Validate player name
      const playerResult = validatePlayerName(playerName as string);
      if (!playerResult.success) {
        return next(new Error(`Invalid player name: ${playerResult.error.errors[0].message}`));
      }

      // Check for unique player name in session
      const nameExists = session.players.some(p => 
        p.name.toLowerCase() === playerName?.toString().toLowerCase()
      );
      if (nameExists) {
        return next(new Error('Player name already exists in this session'));
      }

      next();
    },

    validateQuestion: (socket: Socket, next: (err?: Error) => void) => {
      const { question } = socket.handshake.query;

      const result = validateQuestion(question as string);
      if (!result.success) {
        return next(new Error(`Invalid question: ${result.error.errors[0].message}`));
      }

      next();
    },

    validateAnswer: (socket: Socket, next: (err?: Error) => void) => {
      const { answer } = socket.handshake.query;

      const result = validateAnswer(answer as string);
      if (!result.success) {
        return next(new Error(`Invalid answer: ${result.error.errors[0].message}`));
      }

      next();
    },

    validateGuess: (socket: Socket, next: (err?: Error) => void) => {
      const { guess } = socket.handshake.query;

      const result = validateGuess(guess as string);
      if (!result.success) {
        return next(new Error(`Invalid guess: ${result.error.errors[0].message}`));
      }

      next();
    }
  };
}