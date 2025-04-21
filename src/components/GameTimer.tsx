import React, { useEffect, useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { Timer, AlertCircle } from 'lucide-react';

export function GameTimer() {
  const { socket, gameState } = useSocket();
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [isExpired, setIsExpired] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!socket) return;

    const handleTimerUpdate = ({ timeRemaining }: { timeRemaining: number }) => {
      setTimeLeft(timeRemaining);
      setIsExpired(timeRemaining <= 0);
    };

    const handleGameOver = ({ reason, correctAnswer }: { reason: string; correctAnswer: string }) => {
      setIsExpired(true);
      if (reason === 'timeout') {
        setError(`Time's up! The correct answer was: ${correctAnswer}`);
      }
    };

    const handleError = ({ message }: { message: string }) => {
      setError(message);
    };

    socket.on('timer-update', handleTimerUpdate);
    socket.on('gameOver', handleGameOver);
    socket.on('error', handleError);

    // Initialize timer from current session if available
    if (gameState.currentSession?.timer) {
      setTimeLeft(gameState.currentSession.timer);
    }

    return () => {
      socket.off('timer-update', handleTimerUpdate);
      socket.off('gameOver', handleGameOver);
      socket.off('error', handleError);
    };
  }, [socket, gameState.currentSession]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTimerClasses = () => {
    if (isExpired) return 'text-red-500';
    if (timeLeft <= 10) return 'text-red-500 animate-pulse';
    if (timeLeft <= 30) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Timer className={`w-5 h-5 mr-2 ${getTimerClasses()}`} />
          <span className="text-sm font-medium text-gray-400">Time Remaining</span>
        </div>
        <span className={`text-2xl font-bold ${getTimerClasses()}`}>
          {formatTime(timeLeft)}
        </span>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-500/20 border border-red-500 text-red-500 rounded-lg flex items-center">
          <AlertCircle className="w-4 h-4 mr-2" />
          {error}
        </div>
      )}

      {timeLeft <= 10 && !isExpired && (
        <div className="mt-2 text-center text-sm text-red-500 animate-pulse">
          Hurry up! Time is running out!
        </div>
      )}
    </div>
  );
}