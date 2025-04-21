import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { Play, Users, Timer, AlertCircle } from 'lucide-react';

export function GameControls() {
  const { socket, gameState } = useSocket();
  const [playerCount, setPlayerCount] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const isGameMaster = gameState.currentSession?.gameMaster.id === socket?.id;
  const canStartGame = playerCount >= 2 && !isStarting && gameState.currentSession?.status === 'waiting';

  useEffect(() => {
    if (!socket) return;

    const handlePlayerCount = ({ count }: { count: number }) => {
      setPlayerCount(count);
    };

    const handleTimerUpdate = ({ timeRemaining }: { timeRemaining: number }) => {
      setTimeRemaining(timeRemaining);
    };

    const handleSessionStarted = () => {
      setIsStarting(false);
      setError(null);
    };

    const handleStartError = ({ message }: { message: string }) => {
      setError(message);
      setIsStarting(false);
    };

    socket.on('player-count', handlePlayerCount);
    socket.on('timer-update', handleTimerUpdate);
    socket.on('session-started', handleSessionStarted);
    socket.on('start-session-error', handleStartError);

    // Set initial player count from current session
    if (gameState.currentSession) {
      setPlayerCount(gameState.currentSession.players.length);
    }

    return () => {
      socket.off('player-count', handlePlayerCount);
      socket.off('timer-update', handleTimerUpdate);
      socket.off('session-started', handleSessionStarted);
      socket.off('start-session-error', handleStartError);
    };
  }, [socket, gameState.currentSession]);

  const handleStartSession = () => {
    if (!socket || !gameState.currentSession || !canStartGame) return;

    setIsStarting(true);
    setError(null);
    
    socket.emit('start-session', {
      sessionId: gameState.currentSession.id
    });
  };

  if (!isGameMaster) return null;

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Game Controls</h2>
        <div className="flex items-center text-gray-300">
          <Users className="w-4 h-4 mr-2" />
          <span>{playerCount} player{playerCount !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-500 px-4 py-3 rounded flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {timeRemaining !== null && (
        <div className="bg-gray-700 p-4 rounded flex items-center justify-center">
          <Timer className="w-5 h-5 mr-2 text-purple-500" />
          <span className="text-xl font-bold">{timeRemaining}s</span>
        </div>
      )}

      <button
        onClick={handleStartSession}
        disabled={!canStartGame || isStarting}
        className={`w-full py-3 px-4 rounded font-semibold flex items-center justify-center transition-colors ${
          canStartGame
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'bg-gray-600 text-gray-300 cursor-not-allowed'
        }`}
      >
        <Play className="w-5 h-5 mr-2" />
        {isStarting ? 'Starting...' : playerCount < 2 
          ? 'Need at least 2 players'
          : 'Start Game'
        }
      </button>

      {gameState.currentSession?.status === 'active' && (
        <p className="text-center text-gray-400 text-sm">
          Game is in progress
        </p>
      )}
    </div>
  );
}