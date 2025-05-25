// Protocol adapter to convert between UI format and server protocol format

// Convert current tile format to protocol format
export const tileToProtocol = (tile) => {
  if (!tile || !tile.borders) return null;
  
  const borderMap = {
    'C': 'CITY',
    'R': 'ROAD', 
    'F': 'FIELD'
  };
  
  return {
    id: tile.type ? tile.type.charCodeAt(0) - 65 : 0, // A=0, B=1, etc.
    north: borderMap[tile.borders[0]] || 'FIELD',
    east: borderMap[tile.borders[1]] || 'FIELD',
    south: borderMap[tile.borders[2]] || 'FIELD',
    west: borderMap[tile.borders[3]] || 'FIELD',
    features: [], // Will be populated by server
    hasMonastery: tile.type === 'B', // Simplified - B tiles have monasteries
    hasShield: false // Simplified for now
  };
};

// Convert protocol tile format to current UI format
export const tileFromProtocol = (protocolTile) => {
  if (!protocolTile) return null;
  
  const borderMap = {
    'CITY': 'C',
    'ROAD': 'R',
    'FIELD': 'F'
  };
  
  const type = String.fromCharCode(65 + (protocolTile.id || 0)); // 0=A, 1=B, etc.
  
  return {
    borders: [
      borderMap[protocolTile.north] || 'F',
      borderMap[protocolTile.east] || 'F', 
      borderMap[protocolTile.south] || 'F',
      borderMap[protocolTile.west] || 'F'
    ],
    type: type,
    x: protocolTile.position?.x,
    y: protocolTile.position?.y,
    rotation: protocolTile.rotation || 0,
    meeple: protocolTile.meeples && protocolTile.meeples.length > 0 ? {
      spotIndex: 0, // Simplified
      playerId: protocolTile.meeples[0].playerId
    } : undefined
  };
};

// Convert UI position to protocol position (coordinate system conversion)
export const positionToProtocol = (uiPosition, centerOffset = { x: 50, y: 50 }) => {
  return {
    x: uiPosition.x - centerOffset.x,
    y: uiPosition.y - centerOffset.y
  };
};

// Convert protocol position to UI position
export const positionFromProtocol = (protocolPosition, centerOffset = { x: 50, y: 50 }) => {
  return {
    x: protocolPosition.x + centerOffset.x,
    y: protocolPosition.y + centerOffset.y
  };
};

// Convert rotation from degrees to protocol format (0-3)
export const rotationToProtocol = (degrees) => {
  return Math.floor(degrees / 90) % 4;
};

// Convert protocol rotation to degrees
export const rotationFromProtocol = (protocolRotation) => {
  return (protocolRotation || 0) * 90;
};

// Create a message with proper protocol format
export const createMessage = (type, data = {}) => {
  return {
    type,
    data,
    timestamp: new Date().toISOString(),
    messageId: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  };
};

// Convert game state from protocol to UI format
export const gameStateFromProtocol = (protocolGameState) => {
  if (!protocolGameState) return null;
  
  const board = Array(100).fill().map(() => Array(100).fill(null));
  
  // Convert tiles
  if (protocolGameState.tiles) {
    Object.entries(protocolGameState.tiles).forEach(([posKey, tileData]) => {
      const [x, y] = posKey.split(',').map(Number);
      const uiPos = positionFromProtocol({ x, y });
      const uiTile = tileFromProtocol(tileData.tile);
      
      if (uiTile && uiPos.x >= 0 && uiPos.x < 100 && uiPos.y >= 0 && uiPos.y < 100) {
        uiTile.x = uiPos.x;
        uiTile.y = uiPos.y;
        uiTile.rotation = rotationFromProtocol(tileData.rotation);
        
        // Add meeples if present
        if (tileData.meeples && tileData.meeples.length > 0) {
          uiTile.meeple = {
            spotIndex: 0, // Simplified
            playerId: tileData.meeples[0].playerId
          };
        }
        
        board[uiPos.y][uiPos.x] = uiTile;
      }
    });
  }
  
  return {
    board,
    center: { x: 50, y: 50 },
    placedTiles: Object.keys(protocolGameState.tiles || {}).length,
    currentTile: protocolGameState.currentTile ? 
      String.fromCharCode(65 + (protocolGameState.currentTile.id || 0)) : null,
    players: protocolGameState.players || [],
    currentPlayer: protocolGameState.currentPlayer || 0,
    gameStarted: protocolGameState.gameStarted || false,
    gameEnded: protocolGameState.gameEnded || false,
    scores: protocolGameState.scores || {}
  };
};

// Convert UI game state to protocol format (for validation)
export const gameStateToProtocol = (uiGameState) => {
  if (!uiGameState) return null;
  
  const tiles = {};
  
  // Convert board tiles
  for (let y = 0; y < uiGameState.board.length; y++) {
    for (let x = 0; x < uiGameState.board[y].length; x++) {
      const tile = uiGameState.board[y][x];
      if (tile) {
        const protocolPos = positionToProtocol({ x, y });
        const posKey = `${protocolPos.x},${protocolPos.y}`;
        
        tiles[posKey] = {
          tile: tileToProtocol(tile),
          position: protocolPos,
          rotation: rotationToProtocol(tile.rotation || 0),
          meeples: tile.meeple ? [{
            playerId: tile.meeple.playerId,
            featureId: tile.meeple.spotIndex || 0
          }] : []
        };
      }
    }
  }
  
  return {
    tiles,
    currentTile: uiGameState.currentTile ? {
      id: uiGameState.currentTile.charCodeAt(0) - 65
    } : null,
    players: uiGameState.players || [],
    currentPlayer: uiGameState.currentPlayer || 0,
    gameStarted: uiGameState.gameStarted || false,
    gameEnded: uiGameState.gameEnded || false,
    scores: uiGameState.scores || {},
    tilesLeft: 72 - (uiGameState.placedTiles || 0)
  };
};

export default {
  tileToProtocol,
  tileFromProtocol,
  positionToProtocol,
  positionFromProtocol,
  rotationToProtocol,
  rotationFromProtocol,
  createMessage,
  gameStateFromProtocol,
  gameStateToProtocol
};
