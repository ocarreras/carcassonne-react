// Tile border types: C = City, R = Road, F = Field
// Border order: Top, Right, Bottom, Left

// Tile definitions with their border types
export const TILES = {
  A: { borders: ['F', 'F', 'R', 'F'], type: 'A' },
  B: { borders: ['F', 'F', 'F', 'F'], type: 'B' },
  C: { borders: ['C', 'C', 'C', 'C'], type: 'C' },
  D: { borders: ['C', 'R', 'F', 'R'], type: 'D' },
  E: { borders: ['C', 'F', 'F', 'F'], type: 'E' },
  F: { borders: ['F', 'C', 'F', 'C'], type: 'F' },
  G: { borders: ['F', 'C', 'F', 'C'], type: 'G' },
  H: { borders: ['C', 'F', 'C', 'F'], type: 'H' },
  I: { borders: ['C', 'F', 'F', 'C'], type: 'I' },
  J: { borders: ['C', 'R', 'R', 'F'], type: 'J' },
  K: { borders: ['C', 'F', 'R', 'R'], type: 'K' },
  L: { borders: ['C', 'R', 'R', 'R'], type: 'L' },
  M: { borders: ['C', 'C', 'F', 'F'], type: 'M' },
  N: { borders: ['C', 'C', 'F', 'F'], type: 'N' },
  O: { borders: ['C', 'R', 'R', 'C'], type: 'O' },
  P: { borders: ['C', 'R', 'R', 'C'], type: 'P' },
  Q: { borders: ['C', 'C', 'F', 'C'], type: 'Q' },
  R: { borders: ['C', 'C', 'F', 'C'], type: 'R' },
  S: { borders: ['C', 'C', 'R', 'C'], type: 'S' },
  T: { borders: ['C', 'C', 'R', 'C'], type: 'T' },
  U: { borders: ['R', 'F', 'R', 'F'], type: 'U' },
  V: { borders: ['F', 'F', 'R', 'R'], type: 'V' },
  W: { borders: ['F', 'R', 'R', 'R'], type: 'W' },
  X: { borders: ['R', 'R', 'R', 'R'], type: 'X' }
};

// Initial tile is D
export const INITIAL_TILE = 'D';

// Function to get a random tile type
export const getRandomTile = () => {
  const tileTypes = Object.keys(TILES);
  const randomIndex = Math.floor(Math.random() * tileTypes.length);
  return tileTypes[randomIndex];
};

// Function to rotate a tile (clockwise)
export const rotateTile = (tile, rotations = 1) => {
  const borders = [...tile.borders];
  const rotationCount = rotations % 4;
  
  for (let i = 0; i < rotationCount; i++) {
    // Move the last element to the front
    borders.unshift(borders.pop());
  }
  
  return { ...tile, borders, rotation: rotations };
};

// Function to check if a tile can be placed at a specific position
export const canPlaceTile = (board, x, y, tile) => {
  // Check if the position is already occupied
  if (board[y]?.[x]) {
    return false;
  }
  
  // Check if the position is adjacent to at least one existing tile
  const hasAdjacentTile = (
    board[y-1]?.[x] || // Top
    board[y]?.[x+1] || // Right
    board[y+1]?.[x] || // Bottom
    board[y]?.[x-1]    // Left
  );
  
  if (!hasAdjacentTile) {
    return false;
  }
  
  // Check if the borders match with adjacent tiles
  const topTile = board[y-1]?.[x];
  const rightTile = board[y]?.[x+1];
  const bottomTile = board[y+1]?.[x];
  const leftTile = board[y]?.[x-1];
  
  // Check top border
  if (topTile && tile.borders[0] !== topTile.borders[2]) {
    return false;
  }
  
  // Check right border
  if (rightTile && tile.borders[1] !== rightTile.borders[3]) {
    return false;
  }
  
  // Check bottom border
  if (bottomTile && tile.borders[2] !== bottomTile.borders[0]) {
    return false;
  }
  
  // Check left border
  if (leftTile && tile.borders[3] !== leftTile.borders[1]) {
    return false;
  }
  
  return true;
};

// Function to get valid rotations for a position
export const getValidRotations = (board, x, y, tile) => {
  return [0, 1, 2, 3].filter(rotation => 
    canPlaceTile(board, x, y, rotateTile(tile, rotation))
  );
};

// Function to find all possible placements for a tile
export const findPossiblePlacements = (board, tile) => {
  const possiblePlacements = new Set();
  const boardSize = 100; // Assuming a large enough board
  
  // Check all positions around existing tiles
  for (let y = 0; y < boardSize; y++) {
    for (let x = 0; x < boardSize; x++) {
      // Try all 4 rotations
      for (let rotation = 0; rotation < 4; rotation++) {
        const rotatedTile = rotateTile(tile, rotation);
        if (canPlaceTile(board, x, y, rotatedTile)) {
          // Only store unique positions
          possiblePlacements.add(JSON.stringify({ x, y }));
          break; // Found a valid rotation, no need to check others for this position
        }
      }
    }
  }
  
  // Convert back to array of objects
  return Array.from(possiblePlacements).map(pos => JSON.parse(pos));
};

// Function to initialize the game board with the initial tile
export const initializeBoard = () => {
  const boardSize = 100; // Large enough for any game
  const center = Math.floor(boardSize / 2);
  
  // Create an empty board
  const board = Array(boardSize).fill().map(() => Array(boardSize).fill(null));
  
  // Place the initial tile (D) at the center
  board[center][center] = { ...TILES[INITIAL_TILE], x: center, y: center, rotation: 0 };
  
  return {
    board,
    center,
    placedTiles: 1,
    currentTile: getRandomTile()
  };
};

// Function to place a tile on the board
export const placeTile = (gameState, x, y, tileType, rotation = 0) => {
  const { board } = gameState;
  const tile = { ...TILES[tileType], x, y, rotation };
  const rotatedTile = rotateTile(tile, rotation);
  
  // Create a new board with the tile placed
  const newBoard = board.map(row => [...row]);
  newBoard[y][x] = rotatedTile;
  
  return {
    ...gameState,
    board: newBoard,
    placedTiles: gameState.placedTiles + 1,
    currentTile: getRandomTile()
  };
};

// Meeple placement types
export const MEEPLE_PLACEMENT_TYPES = {
  MONASTERY: 1,
  CITY: 2,
  ROAD: 3,
  FIELD: 4
};

// Legacy meeple types for compatibility
export const MEEPLE_TYPES = {
  ROAD: 'road',
  CITY: 'city',
  MONASTERY: 'monastery',
  FIELD: 'field'
};

// Meeple placement data for each tile type
export const TILE_MEEPLE_PLACEMENTS = {
  A: [
    { column: 0, row: 0, type: MEEPLE_PLACEMENT_TYPES.MONASTERY },
    { column: 20, row: -20, type: MEEPLE_PLACEMENT_TYPES.FIELD },
    { column: 0, row: 25, type: MEEPLE_PLACEMENT_TYPES.ROAD }
  ],
  B: [
    { column: 0, row: 0, type: MEEPLE_PLACEMENT_TYPES.MONASTERY },
    { column: 20, row: -20, type: MEEPLE_PLACEMENT_TYPES.FIELD }
  ],
  C: [
    { column: 0, row: 0, type: MEEPLE_PLACEMENT_TYPES.CITY }
  ],
  D: [
    { column: 0, row: -22, type: MEEPLE_PLACEMENT_TYPES.CITY },
    { column: -15, row: -9, type: MEEPLE_PLACEMENT_TYPES.FIELD },
    { column: 15, row: 16, type: MEEPLE_PLACEMENT_TYPES.FIELD },
    { column: -3, row: 7, type: MEEPLE_PLACEMENT_TYPES.ROAD }
  ],
  E: [
    { column: 0, row: -22, type: MEEPLE_PLACEMENT_TYPES.CITY },
    { column: 0, row: 10, type: MEEPLE_PLACEMENT_TYPES.FIELD }
  ],
  F: [
    { column: 0, row: 0, type: MEEPLE_PLACEMENT_TYPES.CITY },
    { column: 0, row: -22, type: MEEPLE_PLACEMENT_TYPES.FIELD },
    { column: 0, row: 26, type: MEEPLE_PLACEMENT_TYPES.FIELD }
  ],
  G: [
    { column: 0, row: 0, type: MEEPLE_PLACEMENT_TYPES.CITY },
    { column: 0, row: -22, type: MEEPLE_PLACEMENT_TYPES.FIELD },
    { column: 0, row: 26, type: MEEPLE_PLACEMENT_TYPES.FIELD }
  ],
  H: [
    { column: 0, row: -22, type: MEEPLE_PLACEMENT_TYPES.CITY },
    { column: 0, row: 22, type: MEEPLE_PLACEMENT_TYPES.CITY },
    { column: 0, row: 0, type: MEEPLE_PLACEMENT_TYPES.FIELD }
  ],
  I: [
    { column: 0, row: -22, type: MEEPLE_PLACEMENT_TYPES.CITY },
    { column: -22, row: 0, type: MEEPLE_PLACEMENT_TYPES.CITY },
    { column: 5, row: 5, type: MEEPLE_PLACEMENT_TYPES.FIELD }
  ],
  J: [
    { column: 0, row: -22, type: MEEPLE_PLACEMENT_TYPES.CITY },
    { column: -22, row: -4, type: MEEPLE_PLACEMENT_TYPES.FIELD },
    { column: 22, row: 22, type: MEEPLE_PLACEMENT_TYPES.FIELD },
    { column: 2, row: 2, type: MEEPLE_PLACEMENT_TYPES.ROAD }
  ],
  K: [
    { column: 0, row: -22, type: MEEPLE_PLACEMENT_TYPES.CITY },
    { column: 22, row: 10, type: MEEPLE_PLACEMENT_TYPES.FIELD },
    { column: -15, row: 15, type: MEEPLE_PLACEMENT_TYPES.FIELD },
    { column: 7, row: -2, type: MEEPLE_PLACEMENT_TYPES.ROAD }
  ],
  L: [
    { column: 0, row: -22, type: MEEPLE_PLACEMENT_TYPES.CITY },
    { column: -25, row: -15, type: MEEPLE_PLACEMENT_TYPES.FIELD },
    { column: -20, row: 20, type: MEEPLE_PLACEMENT_TYPES.FIELD },
    { column: 20, row: 20, type: MEEPLE_PLACEMENT_TYPES.FIELD },
    { column: 22, row: 0, type: MEEPLE_PLACEMENT_TYPES.ROAD },
    { column: -22, row: 0, type: MEEPLE_PLACEMENT_TYPES.ROAD },
    { column: 0, row: 22, type: MEEPLE_PLACEMENT_TYPES.ROAD }
  ],
  M: [
    { column: 12, row: -12, type: MEEPLE_PLACEMENT_TYPES.CITY },
    { column: -12, row: 12, type: MEEPLE_PLACEMENT_TYPES.FIELD }
  ],
  N: [
    { column: 12, row: -12, type: MEEPLE_PLACEMENT_TYPES.CITY },
    { column: -12, row: 12, type: MEEPLE_PLACEMENT_TYPES.FIELD }
  ],
  O: [
    { column: -12, row: -12, type: MEEPLE_PLACEMENT_TYPES.CITY },
    { column: -12, row: 20, type: MEEPLE_PLACEMENT_TYPES.FIELD },
    { column: 22, row: 22, type: MEEPLE_PLACEMENT_TYPES.FIELD },
    { column: 9, row: 9, type: MEEPLE_PLACEMENT_TYPES.ROAD }
  ],
  P: [
    { column: -12, row: -12, type: MEEPLE_PLACEMENT_TYPES.CITY },
    { column: -12, row: 20, type: MEEPLE_PLACEMENT_TYPES.FIELD },
    { column: 22, row: 22, type: MEEPLE_PLACEMENT_TYPES.FIELD },
    { column: 9, row: 9, type: MEEPLE_PLACEMENT_TYPES.ROAD }
  ],
  Q: [
    { column: 0, row: -10, type: MEEPLE_PLACEMENT_TYPES.CITY },
    { column: 0, row: 22, type: MEEPLE_PLACEMENT_TYPES.FIELD }
  ],
  R: [
    { column: 0, row: -10, type: MEEPLE_PLACEMENT_TYPES.CITY },
    { column: 0, row: 22, type: MEEPLE_PLACEMENT_TYPES.FIELD }
  ],
  S: [
    { column: 0, row: -10, type: MEEPLE_PLACEMENT_TYPES.CITY },
    { column: -15, row: 23, type: MEEPLE_PLACEMENT_TYPES.FIELD },
    { column: 15, row: 23, type: MEEPLE_PLACEMENT_TYPES.FIELD },
    { column: 0, row: 20, type: MEEPLE_PLACEMENT_TYPES.ROAD }
  ],
  T: [
    { column: 0, row: -10, type: MEEPLE_PLACEMENT_TYPES.CITY },
    { column: -15, row: 23, type: MEEPLE_PLACEMENT_TYPES.FIELD },
    { column: 15, row: 23, type: MEEPLE_PLACEMENT_TYPES.FIELD },
    { column: 0, row: 20, type: MEEPLE_PLACEMENT_TYPES.ROAD }
  ],
  U: [
    { column: 19, row: 0, type: MEEPLE_PLACEMENT_TYPES.FIELD },
    { column: -19, row: 0, type: MEEPLE_PLACEMENT_TYPES.FIELD },
    { column: 0, row: 0, type: MEEPLE_PLACEMENT_TYPES.ROAD }
  ],
  V: [
    { column: 10, row: -10, type: MEEPLE_PLACEMENT_TYPES.FIELD },
    { column: -20, row: 17, type: MEEPLE_PLACEMENT_TYPES.FIELD },
    { column: -10, row: 5, type: MEEPLE_PLACEMENT_TYPES.ROAD }
  ],
  W: [
    { column: 0, row: -20, type: MEEPLE_PLACEMENT_TYPES.FIELD },
    { column: -22, row: 20, type: MEEPLE_PLACEMENT_TYPES.FIELD },
    { column: 22, row: 20, type: MEEPLE_PLACEMENT_TYPES.FIELD },
    { column: 20, row: 0, type: MEEPLE_PLACEMENT_TYPES.ROAD },
    { column: -20, row: 0, type: MEEPLE_PLACEMENT_TYPES.ROAD },
    { column: 0, row: 20, type: MEEPLE_PLACEMENT_TYPES.ROAD }
  ],
  X: [
    { column: -20, row: -20, type: MEEPLE_PLACEMENT_TYPES.FIELD },
    { column: 20, row: -20, type: MEEPLE_PLACEMENT_TYPES.FIELD },
    { column: -20, row: 20, type: MEEPLE_PLACEMENT_TYPES.FIELD },
    { column: 20, row: 20, type: MEEPLE_PLACEMENT_TYPES.FIELD },
    { column: 20, row: 0, type: MEEPLE_PLACEMENT_TYPES.ROAD },
    { column: -20, row: 0, type: MEEPLE_PLACEMENT_TYPES.ROAD },
    { column: 0, row: 20, type: MEEPLE_PLACEMENT_TYPES.ROAD },
    { column: 0, row: -20, type: MEEPLE_PLACEMENT_TYPES.ROAD }
  ]
};

// Function to rotate meeple placement coordinates
export const rotateMeeplePlacement = (placement, rotation) => {
  const { column, row } = placement;
  let newColumn = column;
  let newRow = row;
  
  // Apply rotation transformations
  for (let i = 0; i < rotation; i++) {
    const temp = newColumn;
    newColumn = -newRow;
    newRow = temp;
  }
  
  return {
    ...placement,
    column: newColumn,
    row: newRow
  };
};

// Function to get meeple placements for a tile with rotation
export const getMeeplePlacements = (tileType, rotation = 0) => {
  const placements = TILE_MEEPLE_PLACEMENTS[tileType] || [];
  return placements.map(placement => rotateMeeplePlacement(placement, rotation));
};

// Function to check if a meeple can be placed on a specific feature of a tile
export const canPlaceMeeple = (gameState, x, y, meepleType) => {
  // This is a simplified version. In a real game, you would need to check
  // if the feature is already occupied by another meeple.
  const tile = gameState.board[y][x];
  
  if (!tile) {
    return false;
  }
  
  // Check if the tile has the feature type
  switch (meepleType) {
    case MEEPLE_TYPES.ROAD:
      return tile.borders.includes('R');
    case MEEPLE_TYPES.CITY:
      return tile.borders.includes('C');
    case MEEPLE_TYPES.FIELD:
      return tile.borders.includes('F');
    case MEEPLE_TYPES.MONASTERY:
      // For simplicity, let's say any tile can have a monastery
      return true;
    default:
      return false;
  }
};

// Function to place a meeple on a tile
export const placeMeeple = (gameState, x, y, meepleSpotIndex, playerId) => {
  const tile = gameState.board[y][x];
  if (!tile) {
    return gameState;
  }
  
  const newBoard = gameState.board.map(row => [...row]);
  newBoard[y][x] = {
    ...newBoard[y][x],
    meeple: {
      spotIndex: meepleSpotIndex,
      playerId
    }
  };
  
  return {
    ...gameState,
    board: newBoard
  };
};
