import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import config from './config';
import logger from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { GameManager } from './game/GameManager';
import sessionsRouter from './routes/sessions';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData
} from '../types/socket';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(httpServer, {
  cors: {
    origin: config.CORS_ORIGIN,
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({ origin: config.CORS_ORIGIN }));
app.use(express.json());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Attach socket to req based on X-Socket-Id header
app.use((req, res, next) => {
  const socketId = req.headers['x-socket-id'];
  if (socketId && typeof socketId === 'string') {
    const socket = io.sockets.sockets.get(socketId);
    if (socket) {
      req.socket = socket; // Attach the socket to req
    } else {
      logger.warn(`Socket not found for ID: ${socketId}`);
    }
  } else {
    logger.warn('No socket ID provided in request headers');
  }
  next();
});

// Set up static file serving and SPA fallback
if (config.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../../dist/client');
  
  app.use(express.static(clientBuildPath));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// API routes
app.use('/api', sessionsRouter);
app.set('io', io);

// Error handling
app.use(errorHandler);

// Socket.IO setup
const gameManager = new GameManager();

io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);
  // ... rest of your socket.io connection handling
});

// Start server
const PORT = config.PORT;

httpServer.listen(PORT, () => {
  logger.info(`Server running in ${config.NODE_ENV} mode on port ${PORT}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});