import React, { useEffect, useState } from 'react';
import { Crown, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { QuestionForm } from './QuestionForm';

interface Player {
  id: string;
  name: string;
}

interface GameStatusProps {
  currentGameMasterId: string;
  players: Player[];
  sessionEnded: boolean;
  onGameMasterChange: (newGameMasterId: string) => void;
}

export function GameStatus({
  currentGameMasterId,
  players,
  sessionEnded,
  onGameMasterChange
}: GameStatusProps) {
  const [notification, setNotification] = useState<{
    message: string;
    type: 'info' | 'warning';
  } | null>(null);

  useEffect(() => {
    if (sessionEnded && players.length > 0) {
      rotateGameMaster();
    }
  }, [sessionEnded]);

  const rotateGameMaster = () => {
    try {
      // Find current game master's index
      const currentIndex = players.findIndex(p => p.id === currentGameMasterId);
      
      if (currentIndex === -1) {
        throw new Error('Current game master not found in players list');
      }

      // Calculate next game master's index
      const nextIndex = (currentIndex + 1) % players.length;
      const newGameMaster = players[nextIndex];

      // Update game master
      onGameMasterChange(newGameMaster.id);

      // Show notification
      setNotification({
        message: `${newGameMaster.name} is now the Game Master!`,
        type: 'info'
      });

      // Clear notification after 5 seconds
      setTimeout(() => setNotification(null), 5000);
    } catch (error) {
      setNotification({
        message: error instanceof Error ? error.message : 'Failed to rotate game master',
        type: 'warning'
      });
    }
  };

  const getCurrentGameMaster = (): Player | undefined => {
    return players.find(p => p.id === currentGameMasterId);
  };

  return (
    <div className="space-y-6">
      {/* Game Master Status */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <Crown className="w-6 h-6 text-yellow-500 mr-2" />
            Game Master
          </h2>
        </div>

        <div className="bg-gray-700/50 p-4 rounded-lg">
          <div className="flex items-center">
            <Crown className="w-5 h-5 text-yellow-500 mr-2" />
            <span className="text-lg text-white">
              {getCurrentGameMaster()?.name || 'Unknown'}
            </span>
          </div>
        </div>
      </div>

      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-lg flex items-center ${
              notification.type === 'info'
                ? 'bg-blue-500/20 border border-blue-500 text-blue-500'
                : 'bg-yellow-500/20 border border-yellow-500 text-yellow-500'
            }`}
          >
            <AlertCircle className="w-5 h-5 mr-2" />
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Question Form - Only visible to current game master */}
      {currentGameMasterId === getCurrentGameMaster()?.id && (
        <div className="mt-6">
          <QuestionForm />
        </div>
      )}

      {/* Players List */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold text-white mb-4">Players</h3>
        <div className="space-y-2">
          {players.map((player) => (
            <div
              key={player.id}
              className={`flex items-center justify-between p-3 rounded-lg ${
                player.id === currentGameMasterId
                  ? 'bg-purple-500/20 border border-purple-500'
                  : 'bg-gray-700/50'
              }`}
            >
              <div className="flex items-center">
                {player.id === currentGameMasterId && (
                  <Crown className="w-4 h-4 text-yellow-500 mr-2" />
                )}
                <span className="text-white">{player.name}</span>
              </div>
              {player.id === currentGameMasterId && (
                <span className="text-sm text-purple-400">Current Game Master</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}