# Multiplayer Quiz Game

A real-time multiplayer quiz game built with React, Socket.IO, and Express.

## Features

- Real-time multiplayer gameplay
- Custom room creation
- Live player scoring
- Interactive quiz interface
- Comprehensive validation
- Production-ready deployment setup

## Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- A Supabase account for database functionality

## Tech Stack

- Frontend:
  - React
  - Socket.IO Client
  - TailwindCSS
  - Framer Motion
  - TypeScript

- Backend:
  - Express
  - Socket.IO
  - Winston (logging)
  - Zod (validation)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd multiplayer-quiz-game
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file:
   ```bash
   cp .env.example .env
   ```

4. Update the environment variables in `.env` with your configuration.

## Development

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Start the backend server:
   ```bash
   npm run dev:server
   ```

The application will be available at `http://localhost:5173`

## Testing

Run the test simulator:
```bash
npm run test:sim
```

## Production Deployment

1. Build the application:
   ```bash
   npm run build:all
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## Environment Variables

- `NODE_ENV`: Application environment (development/production)
- `PORT`: Server port number
- `CORS_ORIGIN`: Allowed CORS origin
- `LOG_LEVEL`: Logging level
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key

## API Endpoints

### Sessions

- `POST /api/sessions`
  - Create a new game session
  - Body: `{ name: string, playerName: string }`

### Socket.IO Events

#### Client to Server

- `joinSession`: Join an existing session
- `createGame`: Create a new game
- `startGame`: Start a game session
- `submitGuess`: Submit an answer guess

#### Server to Client

- `sessionCreated`: New session created
- `playerJoined`: Player joined the session
- `gameStarted`: Game has started
- `gameOver`: Game has ended

## Project Structure

```
├── src/
│   ├── components/    # React components
│   ├── context/      # React context providers
│   ├── hooks/        # Custom React hooks
│   ├── server/       # Express server
│   │   ├── config/   # Server configuration
│   │   ├── game/     # Game logic
│   │   ├── routes/   # API routes
│   │   └── utils/    # Server utilities
│   ├── tests/        # Test files
│   ├── types/        # TypeScript types
│   └── utils/        # Shared utilities
```

## Troubleshooting

### Common Issues

1. Connection Issues
   - Verify the CORS_ORIGIN matches your frontend URL
   - Check if the server is running on the correct port

2. Database Connection
   - Ensure Supabase credentials are correct
   - Check database permissions

3. Build Errors
   - Clear the dist directory
   - Verify TypeScript configuration
   - Check for missing dependencies

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.