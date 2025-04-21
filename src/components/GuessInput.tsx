import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { Send, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

interface GuessResult {
  success: boolean;
  message: string;
  attemptsLeft: number;
}

export function GuessInput() {
  const { socket, gameState } = useSocket();
  const [guess, setGuess] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | null; message: string | null }>({
    type: null,
    message: null
  });
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [isDisabled, setIsDisabled] = useState(false);

  useEffect(() => {
    if (!socket) return;

    const handleGuessResult = (result: GuessResult) => {
      setFeedback({
        type: result.success ? 'success' : 'error',
        message: result.message
      });
      setAttemptsLeft(result.attemptsLeft);
      
      if (result.success || result.attemptsLeft === 0) {
        setIsDisabled(true);
      }
    };

    const handleGameOver = (data: { winner: string; correctAnswer: string; finalScores: Record<string, number> }) => {
      setIsDisabled(true);
      setFeedback({
        type: 'success',
        message: `Game Over! Winner: ${data.winner}. The correct answer was: ${data.correctAnswer}`
      });
    };

    socket.on('guessResult', handleGuessResult);
    socket.on('gameOver', handleGameOver);

    return () => {
      socket.off('guessResult', handleGuessResult);
      socket.off('gameOver', handleGameOver);
    };
  }, [socket]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim() || !socket || !gameState.currentSession) return;

    socket.emit('submitGuess', {
      sessionId: gameState.currentSession.id,
      guess: guess.trim()
    });

    setGuess('');
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Make Your Guess</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">Attempts Left:</span>
          <span className={`font-bold ${attemptsLeft > 1 ? 'text-green-500' : 'text-red-500'}`}>
            {attemptsLeft}
          </span>
        </div>
      </div>

      {feedback.message && (
        <div
          className={`flex items-center p-4 rounded-lg ${
            feedback.type === 'success'
              ? 'bg-green-500/20 border border-green-500 text-green-500'
              : 'bg-red-500/20 border border-red-500 text-red-500'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 mr-2" />
          ) : (
            <AlertCircle className="w-5 h-5 mr-2" />
          )}
          {feedback.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <input
            type="text"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder="Enter your guess..."
            className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isDisabled}
          />
          {isDisabled && (
            <div className="absolute inset-0 bg-gray-900 bg-opacity-50 rounded-lg flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-500" />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isDisabled || !guess.trim()}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <Send className="w-4 h-4 mr-2" />
          Submit Guess
        </button>
      </form>

      {gameState.currentSession?.status === 'active' && (
        <div className="text-center text-sm text-gray-400">
          Game is active - make your guess!
        </div>
      )}
    </div>
  );
}