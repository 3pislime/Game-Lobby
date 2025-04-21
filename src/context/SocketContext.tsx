import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import type { GameSession, GameState, CreateGameData, JoinGameData } from '../types/game';
import type { 
  ClientToServerEvents, 
  ServerToClientEvents 
} from '../types/socket';
import { AlertCircle, WifiOff } from 'lucide-react';

interface SocketContextType {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  gameState: GameState;
  createGame: (data: CreateGameData) => void;
  joinGame: (data: JoinGameData) => void;
  startGame: (sessionId: string) => void;
  submitGuess: (sessionId: string, guess: string) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

const SOCKET_URL = 'http://localhost:3000';
const RECONNECTION_ATTEMPTS = 3;
const RECONNECTION_DELAY = 2000;

interface DisconnectNotification {
  message: string;
  type: 'warning' | 'error';
  timestamp: number;
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    currentSession: null,
    isConnected: false,
    error: null,
    isLoading: false,
    disconnectedPlayers: new Set<string>()
  });
  const [notifications, setNotifications] = useState<DisconnectNotification[]>([]);
  const [reconnectionAttempts, setReconnectionAttempts] = useState(0);
  const navigate = useNavigate();

  const addNotification = (message: string, type: 'warning' | 'error') => {
    setNotifications(prev => [
      ...prev,
      { message, type, timestamp: Date.now() }
    ].slice(-3)); // Keep only last 3 notifications
  };

  // Game functions implementation
  const createGame = (data: CreateGameData) => {
    if (!socket) return;
    setGameState(prev => ({ ...prev, isLoading: true }));
    socket.emit('createGame', data);
  };

  const joinGame = (data: JoinGameData) => {
    if (!socket) return;
    setGameState(prev => ({ ...prev, isLoading: true }));
    socket.emit('joinGame', data);
  };

  const startGame = (sessionId: string) => {
    if (!socket) return;
    socket.emit('startGame', { sessionId });
  };

  const submitGuess = (sessionId: string, guess: string) => {
    if (!socket) return;
    socket.emit('submitGuess', { sessionId, guess });
  };

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionAttempts: RECONNECTION_ATTEMPTS,
      reconnectionDelay: RECONNECTION_DELAY
    });

    newSocket.on('connect', () => {
      setGameState(prev => ({ ...prev, isConnected: true, error: null }));
      setReconnectionAttempts(0);
      
      if (gameState.currentSession) {
        // Attempt to rejoin session after reconnection
        newSocket.emit('rejoinSession', {
          sessionId: gameState.currentSession.id,
          playerId: newSocket.id
        });
      }
    });

    newSocket.on('disconnect', (reason) => {
      setGameState(prev => ({ ...prev, isConnected: false }));
      addNotification(`Disconnected from server: ${reason}`, 'warning');

      if (reason === 'io server disconnect') {
        // Server initiated disconnect, attempt to reconnect
        newSocket.connect();
      }
    });

    newSocket.on('reconnecting', (attemptNumber) => {
      setReconnectionAttempts(attemptNumber);
      addNotification(`Attempting to reconnect (${attemptNumber}/${RECONNECTION_ATTEMPTS})...`, 'warning');
    });

    newSocket.on('reconnect_failed', () => {
      addNotification('Failed to reconnect to server', 'error');
      navigate('/');
    });

    newSocket.on('playerDisconnected', ({ playerId, playerName, session }) => {
      setGameState(prev => ({
        ...prev,
        currentSession: session,
        disconnectedPlayers: new Set([...prev.disconnectedPlayers, playerId])
      }));
      addNotification(`${playerName} has disconnected`, 'warning');
    });

    newSocket.on('playerReconnected', ({ playerId, playerName, session }) => {
      setGameState(prev => ({
        ...prev,
        currentSession: session,
        disconnectedPlayers: new Set(
          [...prev.disconnectedPlayers].filter(id => id !== playerId)
        )
      }));
      addNotification(`${playerName} has reconnected`, 'warning');
    });

    newSocket.on('sessionTerminated', ({ reason }) => {
      setGameState(prev => ({
        ...prev,
        currentSession: null,
        error: `Session terminated: ${reason}`
      }));
      navigate('/');
    });

    // ... (rest of the existing socket event handlers)

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Render disconnect overlay when not connected
  if (!gameState.isConnected && gameState.currentSession) {
    return (
      <div className="fixed inset-0 bg-gray-900/90 flex items-center justify-center z-50">
        <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
          <div className="flex items-center justify-center mb-4">
            <WifiOff className="w-12 h-12 text-red-500 animate-pulse" />
          </div>
          <h2 className="text-xl font-semibold text-center mb-4">
            Connection Lost
          </h2>
          {reconnectionAttempts > 0 && (
            <div className="text-center text-gray-400 mb-4">
              Reconnection attempt {reconnectionAttempts}/{RECONNECTION_ATTEMPTS}
            </div>
          )}
          <div className="space-y-4">
            {notifications.map((notification, index) => (
              <div
                key={notification.timestamp}
                className={`p-4 rounded-lg flex items-center ${
                  notification.type === 'warning'
                    ? 'bg-yellow-500/20 border border-yellow-500 text-yellow-500'
                    : 'bg-red-500/20 border border-red-500 text-red-500'
                }`}
              >
                <AlertCircle className="w-5 h-5 mr-2" />
                {notification.message}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <SocketContext.Provider
      value={{
        socket,
        gameState,
        createGame,
        joinGame,
        startGame,
        submitGuess
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}