import React from 'react';
import { useSocket } from '../context/SocketContext';
import { Users, Crown } from 'lucide-react';

export function PlayerList() {
  const { gameState } = useSocket();
  const { currentSession } = gameState;

  if (!currentSession) {
    return (
      <div className="text-center text-gray-400 py-8">
        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No active game session</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <Users className="w-5 h-5 mr-2 text-purple-500" />
        Players ({currentSession.players.length})
      </h2>
      <div className="space-y-3">
        {currentSession.players.map((player) => (
          <div
            key={player.id}
            className="flex items-center justify-between bg-gray-700 p-3 rounded"
          >
            <div className="flex items-center">
              {player.id === currentSession.gameMaster.id && (
                <Crown className="w-4 h-4 text-yellow-500 mr-2" />
              )}
              <span>{player.name}</span>
            </div>
            <div className="text-sm text-gray-400">
              Score: {currentSession.scores[player.id]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}