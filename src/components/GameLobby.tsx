import React from 'react';
import { useSocket } from '../context/SocketContext';
import { CreateGame } from './CreateGame';
import { JoinGame } from './JoinGame';
import { PlayerList } from './PlayerList';
import { GameStatus } from './GameStatus';
import { Gamepad2, Wifi, WifiOff } from 'lucide-react';

export function GameLobby() {
  const { gameState } = useSocket();
  const { isConnected, currentSession, error } = gameState;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Gamepad2 className="w-10 h-10 text-purple-500 mr-3" />
            <h1 className="text-3xl font-bold">Multiplayer Game Lobby</h1>
          </div>
          <div className={`flex items-center ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
            {isConnected ? <Wifi className="w-5 h-5 mr-2" /> : <WifiOff className="w-5 h-5 mr-2" />}
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-500 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-8">
            {!currentSession ? (
              <>
                <CreateGame />
                <JoinGame />
              </>
            ) : (
              <GameStatus />
            )}
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <PlayerList />
          </div>
        </div>
      </div>
    </div>
  );
}