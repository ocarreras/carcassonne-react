// Configuration for the Carcassonne multiplayer game
export const config = {
  websocket: {
    url: import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws',
    reconnectInterval: 1000, // Start with 1 second
    maxReconnectAttempts: 3,
    heartbeatInterval: 30000, // 30 seconds
  },
  game: {
    maxPlayers: 5,
    minPlayers: 2,
    turnTimeout: 120000, // 2 minutes per turn
  },
  ui: {
    animationDuration: 300,
    toastDuration: 3000,
  }
};

export default config;
