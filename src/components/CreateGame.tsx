import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { PlusCircle, AlertCircle, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export function CreateGame() {
  const { createGame, gameState } = useSocket();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    playerName: '',
    question: '',
    answer: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // First, check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to create a game');
      }

      // Create game in Supabase
      const { data: game, error: gameError } = await supabase
        .from('games')
        .insert({
          creator_name: user.id,
          question: formData.question,
          answer: formData.answer
        })
        .select()
        .single();

      if (gameError) throw gameError;

      // Create player entry for the creator
      const { error: playerError } = await supabase
        .from('players')
        .insert({
          player_name: user.id,
          game_id: game.game_id
        });

      if (playerError) throw playerError;

      // Update socket state
      createGame({
        ...formData,
        gameId: game.game_id
      });

      // Navigate to game room
      navigate(`/game/${game.game_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create game');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <PlusCircle className="w-5 h-5 mr-2 text-purple-500" />
        Create New Game
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
            Question
          </label>
          <input
            type="text"
            value={formData.question}
            onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
            className="w-full bg-gray-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Enter your question (min 10 characters)"
            required
            minLength={10}
            disabled={isLoading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Answer
          </label>
          <input
            type="text"
            value={formData.answer}
            onChange={(e) => setFormData(prev => ({ ...prev, answer: e.target.value }))}
            className="w-full bg-gray-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Enter the answer"
            required
            minLength={1}
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <Loader className="w-4 h-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Game'
          )}
        </button>
      </form>
    </div>
  );
}