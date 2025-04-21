import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import { GameLobby } from './components/GameLobby';

function App() {
  return (
    <BrowserRouter>
      <SocketProvider>
        <GameLobby />
      </SocketProvider>
    </BrowserRouter>
  );
}

export default App;