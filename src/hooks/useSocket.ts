import { useEffect, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Game } from '../types/game';

const SOCKET_URL = 'http://localhost:3000';

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [game, setGame] = useState<Game | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const newSocket = io(SOCKET_URL);

    newSocket.on('connect', () => {
      setIsConnected(true);
      setError(null);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('error', ({ message }) => {
      setError(message);
    });

    newSocket.on('gameCreated', ({ gameId }) => {
      setGame({ id: gameId, players: [{ id: newSocket.id, ready: false }], state: 'waiting' });
    });

    newSocket.on('playerJoined', ({ game: updatedGame }) => {
      setGame(updatedGame);
    });

    newSocket.on('playerLeft', ({ game: updatedGame }) => {
      setGame(updatedGame);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const createGame = useCallback(() => {
    socket?.emit('createGame');
  }, [socket]);

  const joinGame = useCallback((gameId: string) => {
    socket?.emit('joinGame', { gameId });
  }, [socket]);

  return {
    isConnected,
    game,
    error,
    createGame,
    joinGame
  };
}