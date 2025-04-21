import { io, Socket } from 'socket.io-client';
import { EventEmitter } from 'events';
import { faker } from '@faker-js/faker';

interface SimulatedClient {
  id: string;
  socket: Socket;
  name: string;
  sessionId: string;
  questionsSubmitted: number;
  guessesSubmitted: number;
  disconnectTimer?: NodeJS.Timeout;
}

class ClientSimulator extends EventEmitter {
  private clients: Map<string, SimulatedClient> = new Map();
  private readonly serverUrl: string;
  private readonly minDisconnectTime: number = 2 * 60 * 1000; // 2 minutes
  private readonly maxDisconnectTime: number = 5 * 60 * 1000; // 5 minutes
  private readonly questionBank: string[] = [
    "What is the capital of France?",
    "How many continents are there?",
    "What is the largest planet in our solar system?",
    "Who wrote Romeo and Juliet?",
    "What is the chemical symbol for gold?"
  ];
  private readonly answerBank: string[] = [
    "Paris",
    "Seven",
    "Jupiter",
    "Shakespeare",
    "Au"
  ];

  constructor(serverUrl: string = 'http://localhost:3000') {
    super();
    this.serverUrl = serverUrl;
  }

  private log(clientId: string, event: string, data?: any) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Client ${clientId}: ${event}`, data || '');
    this.emit('log', { timestamp, clientId, event, data });
  }

  private async measureResponseTime(clientId: string, operation: () => Promise<any>): Promise<number> {
    const start = performance.now();
    await operation();
    const end = performance.now();
    const duration = end - start;
    this.log(clientId, 'Response time', `${duration.toFixed(2)}ms`);
    return duration;
  }

  private generateRandomQuestion(): { question: string; answer: string } {
    const index = Math.floor(Math.random() * this.questionBank.length);
    return {
      question: this.questionBank[index],
      answer: this.answerBank[index]
    };
  }

  private scheduleDisconnect(client: SimulatedClient) {
    const disconnectTime = Math.random() * (this.maxDisconnectTime - this.minDisconnectTime) + this.minDisconnectTime;
    client.disconnectTimer = setTimeout(() => {
      this.log(client.id, 'Scheduled disconnect');
      this.disconnectClient(client.id);
    }, disconnectTime);
  }

  async createClient(sessionId: string): Promise<string> {
    const socket = io(this.serverUrl, {
      reconnection: true,
      timeout: 10000
    });

    const clientId = faker.string.uuid();
    const client: SimulatedClient = {
      id: clientId,
      socket,
      name: faker.internet.userName(),
      sessionId,
      questionsSubmitted: 0,
      guessesSubmitted: 0
    };

    return new Promise((resolve, reject) => {
      socket.on('connect', async () => {
        this.log(clientId, 'Connected');
        
        try {
          await this.measureResponseTime(clientId, () => 
            new Promise((res) => {
              socket.emit('joinSession', {
                sessionId,
                playerName: client.name
              }, (response: { success: boolean; error?: string }) => {
                if (response.success) {
                  this.clients.set(clientId, client);
                  this.scheduleDisconnect(client);
                  this.setupEventListeners(client);
                  res(response);
                } else {
                  reject(new Error(response.error));
                }
              });
            })
          );

          resolve(clientId);
        } catch (error) {
          reject(error);
        }
      });

      socket.on('connect_error', (error) => {
        this.log(clientId, 'Connection error', error.message);
        reject(error);
      });
    });
  }

  private setupEventListeners(client: SimulatedClient) {
    const { socket, id } = client;

    socket.on('sessionCreated', (data) => {
      this.log(id, 'Session created', data);
    });

    socket.on('playerJoined', (data) => {
      this.log(id, 'Player joined', data);
    });

    socket.on('gameStarted', (data) => {
      this.log(id, 'Game started', data);
      this.simulateQuestionSubmission(client);
    });

    socket.on('guessResult', (data) => {
      this.log(id, 'Guess result', data);
    });

    socket.on('gameOver', (data) => {
      this.log(id, 'Game over', data);
    });

    socket.on('disconnect', (reason) => {
      this.log(id, 'Disconnected', reason);
    });

    socket.on('error', (error) => {
      this.log(id, 'Error', error);
    });
  }

  private async simulateQuestionSubmission(client: SimulatedClient) {
    if (client.questionsSubmitted >= 5) return;

    const { question, answer } = this.generateRandomQuestion();
    
    try {
      await this.measureResponseTime(client.id, () =>
        new Promise((resolve) => {
          client.socket.emit('submit_question', {
            sessionId: client.sessionId,
            question,
            answer
          }, resolve);
        })
      );

      client.questionsSubmitted++;
      this.log(client.id, 'Question submitted', { question, answer });

      // Schedule next question
      setTimeout(() => {
        this.simulateQuestionSubmission(client);
      }, Math.random() * 5000 + 2000);
    } catch (error) {
      this.log(client.id, 'Question submission error', error);
    }
  }

  async simulateGuess(clientId: string) {
    const client = this.clients.get(clientId);
    if (!client || client.guessesSubmitted >= 5) return;

    const guess = faker.word.sample();
    
    try {
      await this.measureResponseTime(clientId, () =>
        new Promise((resolve) => {
          client.socket.emit('submitGuess', {
            sessionId: client.sessionId,
            guess
          }, resolve);
        })
      );

      client.guessesSubmitted++;
      this.log(clientId, 'Guess submitted', { guess });
    } catch (error) {
      this.log(clientId, 'Guess submission error', error);
    }
  }

  disconnectClient(clientId: string) {
    const client = this.clients.get(clientId);
    if (!client) return;

    if (client.disconnectTimer) {
      clearTimeout(client.disconnectTimer);
    }

    client.socket.disconnect();
    this.clients.delete(clientId);
    this.log(clientId, 'Manually disconnected');
  }

  async startSimulation(numClients: number, sessionId: string) {
    try {
      const clientPromises = Array(numClients)
        .fill(null)
        .map(() => this.createClient(sessionId));

      const clientIds = await Promise.all(clientPromises);
      this.log('Simulator', 'Simulation started', { numClients, clientIds });
      return clientIds;
    } catch (error) {
      this.log('Simulator', 'Simulation error', error);
      throw error;
    }
  }

  stopSimulation() {
    for (const [clientId, client] of this.clients) {
      if (client.disconnectTimer) {
        clearTimeout(client.disconnectTimer);
      }
      client.socket.disconnect();
      this.clients.delete(clientId);
    }
    this.log('Simulator', 'Simulation stopped');
  }

  getConnectedClients(): string[] {
    return Array.from(this.clients.keys());
  }

  getClientStats(): Record<string, { questions: number; guesses: number }> {
    const stats: Record<string, { questions: number; guesses: number }> = {};
    for (const [clientId, client] of this.clients) {
      stats[clientId] = {
        questions: client.questionsSubmitted,
        guesses: client.guessesSubmitted
      };
    }
    return stats;
  }
}

export default ClientSimulator;