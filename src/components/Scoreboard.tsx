import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { Trophy, ArrowUpDown, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Score {
  playerId: string;
  playerName: string;
  score: number;
  rank: number;
}

export function Scoreboard() {
  const { socket, gameState } = useSocket();
  const [scores, setScores] = useState<Score[]>([]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!gameState.currentSession) return;

    // Transform session scores into sorted array
    const scoreArray = Object.entries(gameState.currentSession.scores).map(([playerId, score]) => {
      const player = gameState.currentSession!.players.find(p => p.id === playerId);
      return {
        playerId,
        playerName: player?.name || 'Unknown Player',
        score,
        rank: 0
      };
    });

    // Sort and assign ranks
    const sortedScores = scoreArray
      .sort((a, b) => sortOrder === 'desc' ? b.score - a.score : a.score - b.score)
      .map((score, index) => ({ ...score, rank: index + 1 }));

    setScores(sortedScores);
    setIsLoading(false);
  }, [gameState.currentSession, sortOrder]);

  useEffect(() => {
    if (!socket) return;

    const handleScoreUpdate = ({ session }: { session: typeof gameState.currentSession }) => {
      if (!session) return;

      const updatedScores = Object.entries(session.scores).map(([playerId, score]) => {
        const player = session.players.find(p => p.id === playerId);
        return {
          playerId,
          playerName: player?.name || 'Unknown Player',
          score,
          rank: 0
        };
      });

      const sortedScores = updatedScores
        .sort((a, b) => sortOrder === 'desc' ? b.score - a.score : a.score - b.score)
        .map((score, index) => ({ ...score, rank: index + 1 }));

      setScores(sortedScores);
    };

    socket.on('scoreUpdate', handleScoreUpdate);
    socket.on('playerListUpdated', handleScoreUpdate);

    return () => {
      socket.off('scoreUpdate', handleScoreUpdate);
      socket.off('playerListUpdated', handleScoreUpdate);
    };
  }, [socket, sortOrder]);

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  if (isLoading) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex items-center justify-center">
        <Loader className="w-6 h-6 text-purple-500 animate-spin" />
        <span className="ml-2 text-gray-400">Loading scores...</span>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white flex items-center">
          <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
          Leaderboard
        </h2>
        <button
          onClick={toggleSortOrder}
          className="flex items-center text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowUpDown className="w-4 h-4 mr-1" />
          Sort {sortOrder === 'desc' ? 'Ascending' : 'Descending'}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-gray-400 border-b border-gray-700">
              <th className="px-4 py-2 text-left">Rank</th>
              <th className="px-4 py-2 text-left">Player</th>
              <th className="px-4 py-2 text-right">Score</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {scores.map((score) => (
                <motion.tr
                  key={score.playerId}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className={`border-b border-gray-700 ${
                    score.playerId === gameState.socket?.id
                      ? 'bg-purple-500/10'
                      : 'hover:bg-gray-700/50'
                  }`}
                >
                  <td className="px-4 py-2">
                    {score.rank === 1 ? (
                      <span className="text-yellow-500">🏆</span>
                    ) : (
                      score.rank
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <span className={score.playerId === gameState.socket?.id ? 'text-purple-400 font-semibold' : ''}>
                      {score.playerName}
                    </span>
                    {score.playerId === gameState.socket?.id && (
                      <span className="ml-2 text-xs text-purple-400">(You)</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <motion.span
                      key={score.score}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      className="font-mono"
                    >
                      {score.score}
                    </motion.span>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {scores.length === 0 && (
        <div className="text-center text-gray-400 py-4">
          No scores available
        </div>
      )}
    </div>
  );
}