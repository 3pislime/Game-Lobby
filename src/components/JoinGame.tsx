import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { LogIn, AlertCircle, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export function JoinGame() {
  const { joinGame, gameState } = useSocket();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    gameId: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to join a game');
      }

      // Check if game exists
      const { data: game, error: gameError } = await supabase
        .from('games')
        .select()
        .eq('game_id', formData.gameId)
        .single();

      if (gameError || !game) {
        throw new Error('Game not found');
      }

      // Check if player already joined
      const { data: existingPlayer, error: playerCheckError } = await supabase
        .from('players')
        .select()
        .eq('game_id', formData.gameId)
        .eq('player_name', user.id)
        .single();

      if (existingPlayer) {
        throw new Error('You have already joined this game');
      }

      // Join the game
      const { error: joinError } = await supabase
        .from('players')
        .insert({
          player_name: user.id,
          game_id: formData.gameId
        });

      if (joinError) throw joinError;

      // Update socket state
      joinGame({
        gameId: formData.gameId,
        playerId: user.id
      });

      // Navigate to game room
      navigate(`/game/${formData.gameId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join game');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <LogIn className="w-5 h-5 mr-2 text-purple-500" />
        Join Game
      </h2>

      {error && (
        <div className="mb-4 bg-red-500/20 border border-red-500 text-red-500 p-4 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Game ID
          </label>
          <input
            type="text"
            value={formData.gameId}
            onChange={(e) => setFormData(prev => ({ ...prev, gameId: e.target.value }))}
            className="w-full bg-gray-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Enter game ID"
            required
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <Loader className="w-4 h-4 mr-2 animate-spin" />
              Joining...
            </>
          ) : (
            'Join Game'
          )}
        </button>
      </form>
    </div>
  );
}