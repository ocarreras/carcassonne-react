// Game context for managing global multiplayer state
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import websocketService from '../services/websocketService.js';
import { CONNECTION_STATES, GAME_PHASES } from '../utils/messageTypes.js';
import { gameStateFromProtocol, positionToProtocol, rotationToProtocol } from '../utils/protocolAdapter.js';

// Initial state
const initialState = {
  // Connection state
  connectionState: CONNECTION_STATES.DISCONNECTED,
  
  // Player info
  playerId: null,
  playerName: '',
  playerColor: 'red',
  
  // Current phase
  gamePhase: GAME_PHASES.LOBBY,
  
  // Room state
  currentRoom: null,
  rooms: [],
  roomPlayers: [],
  
  // Game state
  gameState: null,
  currentPlayer: null,
  isMyTurn: false,
  currentTile: null,
  validPlacements: [],
  
  // UI state
  selectedPosition: null,
  currentRotation: 0,
  meeplePlacementMode: false,
  selectedMeepleSpot: -1,
  
  // Error handling
  error: null,
  toast: null
};

// Action types
const ACTION_TYPES = {
  SET_CONNECTION_STATE: 'SET_CONNECTION_STATE',
  SET_PLAYER_INFO: 'SET_PLAYER_INFO',
  SET_GAME_PHASE: 'SET_GAME_PHASE',
  SET_ROOMS: 'SET_ROOMS',
  SET_CURRENT_ROOM: 'SET_CURRENT_ROOM',
  SET_ROOM_PLAYERS: 'SET_ROOM_PLAYERS',
  SET_GAME_STATE: 'SET_GAME_STATE',
  SET_CURRENT_PLAYER: 'SET_CURRENT_PLAYER',
  SET_CURRENT_TILE: 'SET_CURRENT_TILE',
  SET_VALID_PLACEMENTS: 'SET_VALID_PLACEMENTS',
  SET_SELECTED_POSITION: 'SET_SELECTED_POSITION',
  SET_CURRENT_ROTATION: 'SET_CURRENT_ROTATION',
  SET_MEEPLE_PLACEMENT_MODE: 'SET_MEEPLE_PLACEMENT_MODE',
  SET_SELECTED_MEEPLE_SPOT: 'SET_SELECTED_MEEPLE_SPOT',
  SET_ERROR: 'SET_ERROR',
  SET_TOAST: 'SET_TOAST',
  CLEAR_ERROR: 'CLEAR_ERROR',
  CLEAR_TOAST: 'CLEAR_TOAST',
  RESET_GAME: 'RESET_GAME'
};

// Reducer function
function gameReducer(state, action) {
  switch (action.type) {
    case ACTION_TYPES.SET_CONNECTION_STATE:
      return { ...state, connectionState: action.payload };
      
    case ACTION_TYPES.SET_PLAYER_INFO:
      return { 
        ...state, 
        playerId: action.payload.playerId,
        playerName: action.payload.playerName,
        playerColor: action.payload.playerColor
      };
      
    case ACTION_TYPES.SET_GAME_PHASE:
      return { ...state, gamePhase: action.payload };
      
    case ACTION_TYPES.SET_ROOMS:
      return { ...state, rooms: action.payload };
      
    case ACTION_TYPES.SET_CURRENT_ROOM:
      return { ...state, currentRoom: action.payload };
      
    case ACTION_TYPES.SET_ROOM_PLAYERS:
      return { ...state, roomPlayers: action.payload };
      
    case ACTION_TYPES.SET_GAME_STATE:
      return { ...state, gameState: action.payload };
      
    case ACTION_TYPES.SET_CURRENT_PLAYER: {
      const isMyTurn = action.payload === state.playerId;
      return { 
        ...state, 
        currentPlayer: action.payload,
        isMyTurn
      };
    }
      
    case ACTION_TYPES.SET_CURRENT_TILE:
      return { ...state, currentTile: action.payload };
      
    case ACTION_TYPES.SET_VALID_PLACEMENTS:
      return { ...state, validPlacements: action.payload };
      
    case ACTION_TYPES.SET_SELECTED_POSITION:
      return { ...state, selectedPosition: action.payload };
      
    case ACTION_TYPES.SET_CURRENT_ROTATION:
      return { ...state, currentRotation: action.payload };
      
    case ACTION_TYPES.SET_MEEPLE_PLACEMENT_MODE:
      return { ...state, meeplePlacementMode: action.payload };
      
    case ACTION_TYPES.SET_SELECTED_MEEPLE_SPOT:
      return { ...state, selectedMeepleSpot: action.payload };
      
    case ACTION_TYPES.SET_ERROR:
      return { ...state, error: action.payload };
      
    case ACTION_TYPES.SET_TOAST:
      return { ...state, toast: action.payload };
      
    case ACTION_TYPES.CLEAR_ERROR:
      return { ...state, error: null };
      
    case ACTION_TYPES.CLEAR_TOAST:
      return { ...state, toast: null };
      
    case ACTION_TYPES.RESET_GAME:
      return {
        ...initialState,
        connectionState: state.connectionState,
        playerId: state.playerId,
        playerName: state.playerName,
        playerColor: state.playerColor
      };
      
    default:
      return state;
  }
}

// Create context
const GameContext = createContext();

// Context provider component
export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Initialize WebSocket event listeners
  useEffect(() => {
    // Connection state changes
    websocketService.on('connectionStateChanged', (connectionState) => {
      dispatch({ type: ACTION_TYPES.SET_CONNECTION_STATE, payload: connectionState });
    });

    // Connected successfully
    websocketService.on('connected', () => {
      dispatch({ type: ACTION_TYPES.SET_TOAST, payload: { 
        message: 'Connected to server', 
        type: 'success' 
      }});
    });

    // Rooms list received
    websocketService.on('roomsList', (rooms) => {
      dispatch({ type: ACTION_TYPES.SET_ROOMS, payload: rooms });
    });

    // Room joined
    websocketService.on('roomJoined', (data) => {
      dispatch({ type: ACTION_TYPES.SET_CURRENT_ROOM, payload: data.roomId });
      dispatch({ type: ACTION_TYPES.SET_ROOM_PLAYERS, payload: data.players });
      dispatch({ type: ACTION_TYPES.SET_GAME_PHASE, payload: GAME_PHASES.WAITING });
    });

    // Room updated
    websocketService.on('roomUpdate', (data) => {
      dispatch({ type: ACTION_TYPES.SET_ROOM_PLAYERS, payload: data.players });
    });

    // Game started
    websocketService.on('gameStart', (data) => {
      dispatch({ type: ACTION_TYPES.SET_GAME_PHASE, payload: GAME_PHASES.PLAYING });
      dispatch({ type: ACTION_TYPES.SET_ROOM_PLAYERS, payload: data.players });
    });

    // Turn started
    websocketService.on('turnStart', (data) => {
      dispatch({ type: ACTION_TYPES.SET_CURRENT_PLAYER, payload: data.currentPlayer });
      dispatch({ type: ACTION_TYPES.SET_CURRENT_TILE, payload: data.currentTile });
      dispatch({ type: ACTION_TYPES.SET_VALID_PLACEMENTS, payload: data.validPlacements || [] });
    });

    // Tile placed
    websocketService.on('tilePlaced', (data) => {
      if (data.valid) {
        // Enter meeple placement mode if it's our turn
        if (state.isMyTurn) {
          dispatch({ type: ACTION_TYPES.SET_MEEPLE_PLACEMENT_MODE, payload: true });
        }
      } else {
        dispatch({ type: ACTION_TYPES.SET_ERROR, payload: { 
          message: 'Invalid tile placement', 
          code: 'INVALID_PLACEMENT' 
        }});
      }
    });

    // Meeple placed
    websocketService.on('meeplePlace', (data) => {
      if (data.valid) {
        dispatch({ type: ACTION_TYPES.SET_MEEPLE_PLACEMENT_MODE, payload: false });
        dispatch({ type: ACTION_TYPES.SET_SELECTED_MEEPLE_SPOT, payload: -1 });
      }
    });

    // Turn ended
    websocketService.on('turnEnd', (data) => {
      dispatch({ type: ACTION_TYPES.SET_CURRENT_PLAYER, payload: data.nextPlayer });
      dispatch({ type: ACTION_TYPES.SET_MEEPLE_PLACEMENT_MODE, payload: false });
      dispatch({ type: ACTION_TYPES.SET_SELECTED_POSITION, payload: null });
      dispatch({ type: ACTION_TYPES.SET_CURRENT_ROTATION, payload: 0 });
      dispatch({ type: ACTION_TYPES.SET_SELECTED_MEEPLE_SPOT, payload: -1 });
    });

    // Game ended
    websocketService.on('gameEnd', (data) => {
      dispatch({ type: ACTION_TYPES.SET_GAME_PHASE, payload: GAME_PHASES.FINISHED });
      dispatch({ type: ACTION_TYPES.SET_TOAST, payload: { 
        message: `Game ended! Winner: ${data.winner}`, 
        type: 'info' 
      }});
    });

    // Game state update
    websocketService.on('gameState', (protocolGameState) => {
      const uiGameState = gameStateFromProtocol(protocolGameState);
      dispatch({ type: ACTION_TYPES.SET_GAME_STATE, payload: uiGameState });
    });

    // Error handling
    websocketService.on('error', (error) => {
      dispatch({ type: ACTION_TYPES.SET_ERROR, payload: error });
    });

    // Cleanup listeners on unmount
    return () => {
      websocketService.off('connectionStateChanged');
      websocketService.off('connected');
      websocketService.off('roomsList');
      websocketService.off('roomJoined');
      websocketService.off('roomUpdate');
      websocketService.off('gameStart');
      websocketService.off('turnStart');
      websocketService.off('tilePlaced');
      websocketService.off('meeplePlace');
      websocketService.off('turnEnd');
      websocketService.off('gameEnd');
      websocketService.off('gameState');
      websocketService.off('error');
    };
  }, [state.isMyTurn]);

  // Action creators
  const actions = {
    // Connection actions
    connect: (playerId, playerName, playerColor) => {
      dispatch({ type: ACTION_TYPES.SET_PLAYER_INFO, payload: { playerId, playerName, playerColor }});
      return websocketService.connect(playerId, playerName, playerColor);
    },

    disconnect: () => {
      websocketService.disconnect();
      dispatch({ type: ACTION_TYPES.RESET_GAME });
    },

    // Room actions
    listRooms: () => {
      websocketService.listRooms();
    },

    createRoom: (roomName, maxPlayers) => {
      websocketService.createRoom(roomName, maxPlayers);
    },

    joinRoom: (roomId) => {
      websocketService.joinRoom(roomId);
    },

    leaveRoom: () => {
      if (state.currentRoom) {
        websocketService.leaveRoom(state.currentRoom);
        dispatch({ type: ACTION_TYPES.SET_CURRENT_ROOM, payload: null });
        dispatch({ type: ACTION_TYPES.SET_GAME_PHASE, payload: GAME_PHASES.LOBBY });
      }
    },

    addBot: (botName, difficulty) => {
      websocketService.addBot(botName, difficulty);
    },

    // Game actions
    placeTile: (position, rotation) => {
      const protocolPosition = positionToProtocol(position);
      const protocolRotation = rotationToProtocol(rotation);
      websocketService.placeTile(protocolPosition, protocolRotation);
    },

    placeMeeple: (featureId) => {
      websocketService.placeMeeple(featureId);
    },

    // UI actions
    setSelectedPosition: (position) => {
      dispatch({ type: ACTION_TYPES.SET_SELECTED_POSITION, payload: position });
    },

    setCurrentRotation: (rotation) => {
      dispatch({ type: ACTION_TYPES.SET_CURRENT_ROTATION, payload: rotation });
    },

    setSelectedMeepleSpot: (spotIndex) => {
      dispatch({ type: ACTION_TYPES.SET_SELECTED_MEEPLE_SPOT, payload: spotIndex });
    },

    // Error handling
    clearError: () => {
      dispatch({ type: ACTION_TYPES.CLEAR_ERROR });
    },

    clearToast: () => {
      dispatch({ type: ACTION_TYPES.CLEAR_TOAST });
    },

    showToast: (message, type = 'info') => {
      dispatch({ type: ACTION_TYPES.SET_TOAST, payload: { message, type }});
    }
  };

  return (
    <GameContext.Provider value={{ state, actions }}>
      {children}
    </GameContext.Provider>
  );
}

// Custom hook to use game context
export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}

export default GameContext;
