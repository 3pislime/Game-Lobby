import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { LogIn, Users, Loader } from 'lucide-react';

interface JoinSessionFormData {
  sessionId: string;
  playerName: string;
}

interface ValidationErrors {
  sessionId?: string;
  playerName?: string;
}

export function JoinSession() {
  const { socket, gameState } = useSocket();
  const [formData, setFormData] = useState<JoinSessionFormData>({
    sessionId: '',
    playerName: ''
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [playerCount, setPlayerCount] = useState<number>(0);

  useEffect(() => {
    if (!socket) return;

    const handlePlayerListUpdate = ({ playerCount }: { playerCount: number }) => {
      setPlayerCount(playerCount);
    };

    socket.on('playerListUpdated', handlePlayerListUpdate);

    return () => {
      socket.off('playerListUpdated', handlePlayerListUpdate);
    };
  }, [socket]);

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Session ID validation
    if (!formData.sessionId) {
      newErrors.sessionId = 'Session ID is required';
    } else if (!/^[a-zA-Z0-9]{4,}$/.test(formData.sessionId)) {
      newErrors.sessionId = 'Session ID must be at least 4 alphanumeric characters';
    }

    // Player name validation
    if (!formData.playerName) {
      newErrors.playerName = 'Player name is required';
    } else if (!/^[a-zA-Z0-9]{2,20}$/.test(formData.playerName)) {
      newErrors.playerName = 'Player name must be 2-20 alphanumeric characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validateForm()) return;

    setIsLoading(true);
    socket?.emit('joinSession', formData, (response: { success: boolean; error?: string }) => {
      setIsLoading(false);
      
      if (!response.success) {
        setErrorMessage(response.error || 'Failed to join session');
        return;
      }

      // Handle successful join (redirect handled by SocketContext)
    });
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
      <h2 className="text-xl font-semibold mb-4 flex items-center text-white">
        <LogIn className="w-5 h-5 mr-2 text-purple-500" />
        Join Session
      </h2>

      {playerCount > 0 && (
        <div className="mb-4 flex items-center text-gray-300 text-sm">
          <Users className="w-4 h-4 mr-2 text-purple-500" />
          {playerCount} player{playerCount !== 1 ? 's' : ''} in session
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-500 bg-opacity-20 border border-red-500 text-red-500 rounded">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Session ID
          </label>
          <input
            type="text"
            value={formData.sessionId}
            onChange={(e) => setFormData(prev => ({ ...prev, sessionId: e.target.value }))}
            className={`w-full bg-gray-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 ${
              errors.sessionId ? 'border border-red-500' : ''
            }`}
            placeholder="Enter session ID"
            disabled={isLoading}
          />
          {errors.sessionId && (
            <p className="mt-1 text-sm text-red-500">{errors.sessionId}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Your Name
          </label>
          <input
            type="text"
            value={formData.playerName}
            onChange={(e) => setFormData(prev => ({ ...prev, playerName: e.target.value }))}
            className={`w-full bg-gray-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 ${
              errors.playerName ? 'border border-red-500' : ''
            }`}
            placeholder="Enter your name"
            disabled={isLoading}
          />
          {errors.playerName && (
            <p className="mt-1 text-sm text-red-500">{errors.playerName}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <Loader className="w-4 h-4 mr-2 animate-spin" />
              Joining...
            </>
          ) : (
            'Join Session'
          )}
        </button>
      </form>
    </div>
  );
}