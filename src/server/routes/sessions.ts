import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { GameManager } from '../game/GameManager';
import type { 
  ServerToClientEvents, 
  ClientToServerEvents, 
  InterServerEvents, 
  SocketData 
} from '../../types/socket';

const router = express.Router();
const gameManager = new GameManager();

interface CreateSessionRequest {
  name: string;
  playerName: string;
}

// Extend Express Request type to include socket property
declare global {
  namespace Express {
    interface Request {
      socket?: Socket; // Use Socket type from socket.io
    }
  }
}

router.post('/sessions', async (
  req: express.Request<{}, {}, CreateSessionRequest>,
  res: express.Response
) => {
  try {
    if (!req.socket) {
      return res.status(400).json({ error: 'No socket connection found' });
    }

    const { name, playerName } = req.body;

    // Validate session name
    if (!name || name.trim().length < 3) {
      return res.status(400).json({
        error: 'Session name must be at least 3 characters long'
      });
    }

    // Validate player name
    if (!playerName || playerName.trim().length < 2) {
      return res.status(400).json({
        error: 'Player name must be at least 2 characters long'
      });
    }

    // Create game master player
    const gameMaster = {
      id: req.socket.id, // Now safe to use
      name: playerName,
      score: 0,
      attempts: 0
    };

    // Create new session
    const session = gameManager.createSession({
      gameMaster,
      question: '', // Will be set when game starts
      answer: '',   // Will be set when game starts
      timer: 60     // Default timer value
    });

    // Get the io instance and emit session created event
    const io = req.app.get('io') as SocketIOServer<
      ClientToServerEvents,
      ServerToClientEvents,
      InterServerEvents,
      SocketData
    >;

    io.to(req.socket.id).emit('sessionCreated', {
      session: {
        ...session,
        players: session.players,
        scores: session.scores
      }
    });

    return res.status(201).json({
      id: session.id,
      name,
      gameMaster: session.gameMaster,
      players: session.players,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating session:', error);
    return res.status(500).json({
      error: 'Failed to create session'
    });
  }
});

export default router;