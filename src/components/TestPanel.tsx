import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, RefreshCw, Wifi, WifiOff, Send, Users, AlertCircle } from 'lucide-react';
import ClientSimulator from '../tests/clientSimulator';
import { FormInput } from './FormInput';

interface LogEntry {
  timestamp: string;
  clientId: string;
  event: string;
  data?: any;
}

export function TestPanel() {
  const [sessionId, setSessionId] = useState('');
  const [numClients, setNumClients] = useState(5);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [connectedClients, setConnectedClients] = useState<string[]>([]);
  const [clientStats, setClientStats] = useState<Record<string, { questions: number; guesses: number }>>({});
  const [error, setError] = useState<string | null>(null);
  const simulatorRef = useRef<ClientSimulator | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const handleLog = (entry: LogEntry) => {
    setLogs(prev => [...prev, entry]);
  };

  const startSimulation = async () => {
    if (!sessionId) {
      setError('Session ID is required');
      return;
    }

    try {
      setError(null);
      setIsRunning(true);
      simulatorRef.current = new ClientSimulator();
      
      simulatorRef.current.on('log', handleLog);
      
      const clientIds = await simulatorRef.current.startSimulation(numClients, sessionId);
      setConnectedClients(clientIds);
      
      // Start periodic stats updates
      const statsInterval = setInterval(() => {
        if (simulatorRef.current) {
          setClientStats(simulatorRef.current.getClientStats());
          setConnectedClients(simulatorRef.current.getConnectedClients());
        }
      }, 1000);

      return () => {
        clearInterval(statsInterval);
        if (simulatorRef.current) {
          simulatorRef.current.removeListener('log', handleLog);
        }
      };
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to start simulation');
      setIsRunning(false);
    }
  };

  const stopSimulation = () => {
    if (simulatorRef.current) {
      simulatorRef.current.stopSimulation();
      simulatorRef.current = null;
    }
    setIsRunning(false);
    setConnectedClients([]);
    setClientStats({});
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center">
            {isRunning ? (
              <Wifi className="w-6 h-6 text-green-500 mr-2" />
            ) : (
              <WifiOff className="w-6 h-6 text-red-500 mr-2" />
            )}
            Test Panel
          </h1>
          <div className="flex items-center space-x-4">
            <Users className="w-5 h-5 text-purple-500" />
            <span>{connectedClients.length} clients connected</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-500 p-4 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Configuration</h2>
              <div className="space-y-4">
                <FormInput
                  label="Session ID"
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                  placeholder="Enter session ID"
                  disabled={isRunning}
                />
                <FormInput
                  label="Number of Clients"
                  type="number"
                  min={1}
                  max={10}
                  value={numClients}
                  onChange={(e) => setNumClients(parseInt(e.target.value, 10))}
                  disabled={isRunning}
                />
                <div className="flex space-x-4">
                  <button
                    onClick={isRunning ? stopSimulation : startSimulation}
                    className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center ${
                      isRunning
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {isRunning ? (
                      <>
                        <Square className="w-4 h-4 mr-2" />
                        Stop
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Start
                      </>
                    )}
                  </button>
                  <button
                    onClick={clearLogs}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Clear Logs
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Client Statistics</h2>
              <div className="space-y-2">
                <AnimatePresence>
                  {Object.entries(clientStats).map(([clientId, stats]) => (
                    <motion.div
                      key={clientId}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="bg-gray-700 p-4 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-mono">{clientId.slice(0, 8)}...</span>
                        <div className="flex space-x-4 text-sm">
                          <span>Questions: {stats.questions}</span>
                          <span>Guesses: {stats.guesses}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Event Logs</h2>
            <div className="h-[600px] overflow-y-auto bg-gray-900 rounded-lg p-4 font-mono text-sm">
              {logs.map((log, index) => (
                <div key={index} className="py-1">
                  <span className="text-gray-500">[{log.timestamp}]</span>
                  <span className="text-purple-400"> {log.clientId}: </span>
                  <span className="text-green-400">{log.event}</span>
                  {log.data && (
                    <pre className="text-gray-400 ml-8 mt-1">
                      {typeof log.data === 'string' ? log.data : JSON.stringify(log.data, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}