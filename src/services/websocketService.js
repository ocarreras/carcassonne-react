// WebSocket service for Carcassonne multiplayer communication
import { config } from '../utils/config.js';
import { MESSAGE_TYPES, CONNECTION_STATES } from '../utils/messageTypes.js';
import { createMessage } from '../utils/protocolAdapter.js';

class WebSocketService {
  constructor() {
    this.ws = null;
    this.connectionState = CONNECTION_STATES.DISCONNECTED;
    this.reconnectAttempts = 0;
    this.reconnectTimer = null;
    this.heartbeatTimer = null;
    this.messageQueue = [];
    this.listeners = new Map();
    this.playerId = null;
    this.playerName = null;
    this.playerColor = null;
    this.messageBuffer = ''; // Buffer for partial messages
  }

  // Add event listener
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  // Remove event listener
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Emit event to listeners
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  // Parse incoming messages - handles multiple JSON objects and partial messages
  parseMessages(rawData) {
    console.log('Raw message data:', rawData); // Debug log
    
    // Add new data to buffer
    this.messageBuffer += rawData;
    
    // Try to extract complete JSON messages
    let startIndex = 0;
    let braceCount = 0;
    let inString = false;
    let escapeNext = false;
    
    for (let i = 0; i < this.messageBuffer.length; i++) {
      const char = this.messageBuffer[i];
      
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      
      if (char === '\\') {
        escapeNext = true;
        continue;
      }
      
      if (char === '"') {
        inString = !inString;
        continue;
      }
      
      if (!inString) {
        if (char === '{') {
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          
          // Found complete JSON object
          if (braceCount === 0) {
            const jsonStr = this.messageBuffer.substring(startIndex, i + 1);
            try {
              const message = JSON.parse(jsonStr);
              this.handleMessage(message);
            } catch (error) {
              console.error('Error parsing JSON message:', error);
              console.error('Problematic JSON:', jsonStr);
            }
            
            // Move to next potential message
            startIndex = i + 1;
          }
        }
      }
    }
    
    // Keep remaining incomplete data in buffer
    this.messageBuffer = this.messageBuffer.substring(startIndex);
    
    // Clear buffer if it gets too large (prevent memory leaks)
    if (this.messageBuffer.length > 10000) {
      console.warn('Message buffer too large, clearing');
      this.messageBuffer = '';
    }
  }

  // Connect to WebSocket server
  connect(playerId, playerName, playerColor = 'red') {
    if (this.connectionState === CONNECTION_STATES.CONNECTING || 
        this.connectionState === CONNECTION_STATES.CONNECTED) {
      return Promise.resolve();
    }

    this.playerId = playerId;
    this.playerName = playerName;
    this.playerColor = playerColor;

    return new Promise((resolve, reject) => {
      try {
        this.connectionState = CONNECTION_STATES.CONNECTING;
        this.emit('connectionStateChanged', this.connectionState);

        this.ws = new WebSocket(config.websocket.url);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.connectionState = CONNECTION_STATES.CONNECTED;
          this.reconnectAttempts = 0;
          this.messageBuffer = ''; // Clear buffer on new connection
          this.emit('connectionStateChanged', this.connectionState);
          
          // Send authentication message
          this.sendMessage(MESSAGE_TYPES.CONNECT, {
            playerId: this.playerId,
            name: this.playerName,
            color: this.playerColor
          });

          // Start heartbeat
          this.startHeartbeat();
          
          // Process queued messages
          this.processMessageQueue();
          
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.parseMessages(event.data);
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket closed:', event.code, event.reason);
          this.connectionState = CONNECTION_STATES.DISCONNECTED;
          this.messageBuffer = ''; // Clear buffer on close
          this.emit('connectionStateChanged', this.connectionState);
          this.stopHeartbeat();
          
          // Attempt reconnection if not intentional
          if (event.code !== 1000) {
            this.attemptReconnection();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.emit('error', { message: 'Connection error', error });
          reject(error);
        };

      } catch (error) {
        this.connectionState = CONNECTION_STATES.FAILED;
        this.emit('connectionStateChanged', this.connectionState);
        reject(error);
      }
    });
  }

  // Disconnect from WebSocket server
  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.connectionState = CONNECTION_STATES.DISCONNECTED;
    this.messageBuffer = ''; // Clear buffer on disconnect
    this.emit('connectionStateChanged', this.connectionState);
  }

  // Attempt to reconnect
  attemptReconnection() {
    if (this.reconnectAttempts >= config.websocket.maxReconnectAttempts) {
      this.connectionState = CONNECTION_STATES.FAILED;
      this.emit('connectionStateChanged', this.connectionState);
      this.emit('error', { 
        message: 'Failed to reconnect after maximum attempts',
        code: 'MAX_RECONNECT_ATTEMPTS'
      });
      return;
    }

    this.connectionState = CONNECTION_STATES.RECONNECTING;
    this.emit('connectionStateChanged', this.connectionState);

    const delay = config.websocket.reconnectInterval * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      console.log(`Reconnection attempt ${this.reconnectAttempts}`);
      this.connect(this.playerId, this.playerName, this.playerColor)
        .catch(() => {
          // Will trigger another reconnection attempt
        });
    }, delay);
  }

  // Start heartbeat to keep connection alive
  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (this.connectionState === CONNECTION_STATES.CONNECTED) {
        this.sendMessage(MESSAGE_TYPES.PING, {});
      }
    }, config.websocket.heartbeatInterval);
  }

  // Stop heartbeat
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // Send message to server
  sendMessage(type, data = {}) {
    const message = createMessage(type, data);
    console.log('Sending message:', message); // Debug log
    
    if (this.connectionState === CONNECTION_STATES.CONNECTED && this.ws) {
      try {
        this.ws.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error('Error sending message:', error);
        this.messageQueue.push(message);
        return false;
      }
    } else {
      // Queue message for later
      this.messageQueue.push(message);
      return false;
    }
  }

  // Process queued messages
  processMessageQueue() {
    while (this.messageQueue.length > 0 && 
           this.connectionState === CONNECTION_STATES.CONNECTED) {
      const message = this.messageQueue.shift();
      try {
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('Error sending queued message:', error);
        // Put message back at front of queue
        this.messageQueue.unshift(message);
        break;
      }
    }
  }

  // Handle incoming messages
  handleMessage(message) {
    console.log('Received message:', message);

    switch (message.type) {
      case MESSAGE_TYPES.CONNECTED:
        this.emit('connected', message.data);
        break;
        
      case MESSAGE_TYPES.ROOMS_LIST:
      case 'LIST_ROOMS': // Handle server's actual message type
        console.log('Processing rooms list:', message.data);
        // Handle different possible data structures
        const rooms = message.data?.rooms || message.data || [];
        console.log('Extracted rooms:', rooms);
        this.emit('roomsList', rooms);
        break;
        
      case MESSAGE_TYPES.ROOM_JOINED:
      case 'ROOM_JOINED': // Handle server's actual message type
        console.log('Room joined:', message.data);
        this.emit('roomJoined', message.data);
        break;
        
      case MESSAGE_TYPES.ROOM_UPDATE:
      case 'ROOM_STATE': // Handle server's actual message type
        console.log('Room update:', message.data);
        this.emit('roomUpdate', message.data);
        break;
        
      case MESSAGE_TYPES.GAME_START:
      case 'GAME_STARTED': // Handle server's actual message type from PROTOCOL.md
        console.log('Game starting:', message.data);
        this.emit('gameStart', message.data);
        break;
        
      case MESSAGE_TYPES.TURN_START:
        this.emit('turnStart', message.data);
        break;
        
      case MESSAGE_TYPES.TILE_PLACED:
        this.emit('tilePlaced', message.data);
        break;
        
      case MESSAGE_TYPES.MEEPLE_PLACED:
        this.emit('meeplePlace', message.data);
        break;
        
      case MESSAGE_TYPES.TURN_END:
        this.emit('turnEnd', message.data);
        break;
        
      case MESSAGE_TYPES.GAME_END:
        this.emit('gameEnd', message.data);
        break;
        
      case MESSAGE_TYPES.GAME_STATE:
        this.emit('gameState', message.data.gameState);
        break;
        
      case MESSAGE_TYPES.ERROR:
        this.emit('error', message.data);
        break;
        
      case MESSAGE_TYPES.PONG:
        // Heartbeat response - connection is alive
        break;
        
      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  // Room management methods
  listRooms() {
    return this.sendMessage(MESSAGE_TYPES.LIST_ROOMS);
  }

  createRoom(roomName, maxPlayers = 4) {
    return this.sendMessage(MESSAGE_TYPES.CREATE_ROOM, {
      roomName,
      maxPlayers
    });
  }

  joinRoom(roomId) {
    console.log('Joining room with ID:', roomId); // Debug log
    return this.sendMessage(MESSAGE_TYPES.JOIN_ROOM, {
      roomId
    });
  }

  leaveRoom(roomId) {
    return this.sendMessage(MESSAGE_TYPES.LEAVE_ROOM, {
      roomId
    });
  }

  addBot(botName, difficulty = 'medium') {
    return this.sendMessage(MESSAGE_TYPES.ADD_BOT, {
      botName,
      difficulty
    });
  }

  startGame() {
    console.log('Sending start game message'); // Debug log
    return this.sendMessage(MESSAGE_TYPES.GAME_START, {});
  }

  // Game action methods
  placeTile(position, rotation) {
    return this.sendMessage(MESSAGE_TYPES.PLACE_TILE, {
      position,
      rotation
    });
  }

  placeMeeple(featureId) {
    return this.sendMessage(MESSAGE_TYPES.PLACE_MEEPLE, {
      featureId
    });
  }

  // Get current connection state
  getConnectionState() {
    return this.connectionState;
  }

  // Check if connected
  isConnected() {
    return this.connectionState === CONNECTION_STATES.CONNECTED;
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

export default websocketService;
