// src/utils/gameLogic.ts

import {
  Board,
  TileDefinition,
  TilesCollection,
  PlacedTile,
  Rotation,
  GameState,
  Coordinates,
  MEEPLE_TYPES, // Enum
  MeepleType,   // Type alias for the enum
  Player,
  BorderType
} from '../types';

// Tile border types: C = City, R = Road, F = Field
// Border order: Top, Right, Bottom, Left

// Tile definitions with their border types
export const TILES: TilesCollection = {
  A: { borders: ['F', 'F', 'R', 'F'], type: 'A' },
  B: { borders: ['F', 'F', 'F', 'F'], type: 'B' },
  C: { borders: ['C', 'C', 'C', 'C'], type: 'C' },
  D: { borders: ['C', 'R', 'F', 'R'], type: 'D' },
  E: { borders: ['C', 'F', 'F', 'F'], type: 'E' },
  F: { borders: ['F', 'C', 'F', 'C'], type: 'F' },
  G: { borders: ['F', 'C', 'F', 'C'], type: 'G' }, // Assuming G is distinct from F, original had same borders
  H: { borders: ['C', 'F', 'C', 'F'], type: 'H' },
  I: { borders: ['C', 'F', 'F', 'C'], type: 'I' },
  J: { borders: ['C', 'R', 'R', 'F'], type: 'J' },
  K: { borders: ['C', 'F', 'R', 'R'], type: 'K' },
  L: { borders: ['C', 'R', 'R', 'R'], type: 'L' },
  M: { borders: ['C', 'C', 'F', 'F'], type: 'M' },
  N: { borders: ['C', 'C', 'F', 'F'], type: 'N' }, // Assuming N is distinct from M
  O: { borders: ['C', 'R', 'R', 'C'], type: 'O' },
  P: { borders: ['C', 'R', 'R', 'C'], type: 'P' }, // Assuming P is distinct from O
  Q: { borders: ['C', 'C', 'F', 'C'], type: 'Q' },
  R: { borders: ['C', 'C', 'F', 'C'], type: 'R' }, // Assuming R is distinct from Q
  S: { borders: ['C', 'C', 'R', 'C'], type: 'S' },
  T: { borders: ['C', 'C', 'R', 'C'], type: 'T' }, // Assuming T is distinct from S
  U: { borders: ['R', 'F', 'R', 'F'], type: 'U' },
  V: { borders: ['F', 'F', 'R', 'R'], type: 'V' },
  W: { borders: ['F', 'R', 'R', 'R'], type: 'W' },
  X: { borders: ['R', 'R', 'R', 'R'], type: 'X' }
};

// Initial tile is D
export const INITIAL_TILE = 'D';

// Helper function for drawing a random tile from the deck (and removing it)
export const getRandomTileFromDeck = (tileDeck: string[]): string | null => {
  if (tileDeck.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * tileDeck.length);
  const tileType = tileDeck[randomIndex];
  tileDeck.splice(randomIndex, 1); // Remove tile from deck
  return tileType;
};

// Function to rotate a tile definition (clockwise)
export const rotateTile = (tile: TileDefinition, rotations: number = 1): TileDefinition & { rotation: Rotation } => {
  const newBorders = [...tile.borders] as [BorderType, BorderType, BorderType, BorderType];
  const currentRotation = (( (tile as PlacedTile).rotation || 0) + rotations) % 4;
  const actualRotationsNeeded = rotations % 4;

  for (let i = 0; i < actualRotationsNeeded; i++) {
    newBorders.unshift(newBorders.pop()!);
  }
  
  return { 
    ...tile, 
    borders: newBorders, 
    rotation: currentRotation as Rotation
  };
};


// Function to check if a tile (with a specific rotation applied to its borders) can be placed at a specific position
export const canPlaceTile = (board: Board, x: number, y: number, tileWithAppliedRotation: TileDefinition): boolean => {
  // Check if the position is within board boundaries (implicit by how board is accessed, but good for clarity)
  // board[y]?.[x] handles out-of-bounds for y, but not x if y is valid.
  if (y < 0 || y >= board.length || x < 0 || x >= (board[0]?.length || 0)) {
      return false; 
  }

  // Check if the position is already occupied
  if (board[y][x]) {
    return false;
  }
  
  // Check if the position is adjacent to at least one existing tile
  // This is true for all tiles after the very first one (which is handled by initializeBoard)
  const hasAdjacentTile = (
    (y > 0 && board[y-1]?.[x]) || 
    (board[y]?.[x+1]) || 
    (y < board.length - 1 && board[y+1]?.[x]) ||
    (board[y]?.[x-1])    
  );
  
  // If it's not the very first tile being placed in an empty board context (which this function isn't typically called for),
  // it must be adjacent to something. The initial tile is placed by initializeBoard without this check.
  // For subsequent tiles, this check is vital.
  let isInitialPlacementPhase = true;
  for(const r of board) {
    for(const c of r) {
      if(c !== null) {
        isInitialPlacementPhase = false;
        break;
      }
    }
    if(!isInitialPlacementPhase) break;
  }
  // The above check for isInitialPlacementPhase is a bit complex.
  // A simpler way to know if we are beyond the first (initial) tile placement is to pass placedTiles count or check if center tile is the only one.
  // However, the original logic for hasAdjacentTile is generally correct for subsequent placements.
  // Let's assume this function is called when there's at least one tile on board (the initial one).
  if (!hasAdjacentTile && !isInitialPlacementPhase) { // If board is not empty, it must be adjacent
      // A special case: if the board is COMPLETELY empty and this is somehow called, it's not valid.
      // But usually, initializeBoard places the first tile.
      // If we count placed tiles, and placedTiles > 0, then hasAdjacentTile must be true.
      // The original code's hasAdjacentTile check is sound for subsequent placements.
      let placedTilesCount = 0;
      board.forEach(row => row.forEach(cell => { if (cell) placedTilesCount++; }));
      if (placedTilesCount > 0 && !hasAdjacentTile) { // If tiles are on board, new one must be adjacent
          return false;
      }
  }

  // Check if the borders match with adjacent tiles
  const topTile: PlacedTile | null = y > 0 ? board[y-1][x] : null;
  const rightTile: PlacedTile | null = x < (board[0]?.length || 0) - 1 ? board[y][x+1] : null;
  const bottomTile: PlacedTile | null = y < board.length - 1 ? board[y+1][x] : null;
  const leftTile: PlacedTile | null = x > 0 ? board[y][x-1] : null;
  
  // Check top border
  if (topTile && tileWithAppliedRotation.borders[0] !== topTile.borders[2]) {
    return false;
  }
  
  // Check right border
  if (rightTile && tileWithAppliedRotation.borders[1] !== rightTile.borders[3]) {
    return false;
  }
  
  // Check bottom border
  if (bottomTile && tileWithAppliedRotation.borders[2] !== bottomTile.borders[0]) {
    return false;
  }
  
  // Check left border
  if (leftTile && tileWithAppliedRotation.borders[3] !== leftTile.borders[1]) {
    return false;
  }
  
  return true;
};

// Function to get valid rotations for a tile at a position
export const getValidRotations = (board: Board, x: number, y: number, tileDef: TileDefinition): Rotation[] => {
  const validRots: Rotation[] = [];
  for (let i = 0; i < 4; i++) {
    const rotation = i as Rotation;
    // Create a temporary definition with rotation for checking, borders are key
    const tempTileWithRotationApplied = rotateTile(tileDef, rotation);
    // Pass the tile definition with its borders already rotated
    if (canPlaceTile(board, x, y, tempTileWithRotationApplied)) {
      validRots.push(rotation);
    }
  }
  return validRots;
};


// Function to find all possible placement coordinates for a tile definition
export const findPossiblePlacements = (board: Board, tileDef: TileDefinition): Coordinates[] => {
  const possiblePlacementCoords = new Set<string>();
  const boardHeight = board.length;
  if (boardHeight === 0) return [];
  const boardWidth = board[0]?.length ?? 0;
  if (boardWidth === 0) return [];

  let existingTileFound = false;
  for (let r = 0; r < boardHeight; r++) {
    for (let c = 0; c < boardWidth; c++) {
      if (board[r][c]) {
        existingTileFound = true;
        break;
      }
    }
    if (existingTileFound) break;
  }

  if (!existingTileFound) { // If board is empty, only center is a valid placement (handled by initializeBoard)
    // This function is for finding placements *after* initial tile.
    // Or, if it must handle it, it should suggest the center if board is empty.
    // For now, assume initial tile is placed.
    // A robust way: if no tiles, place at center (or let UI decide initial placement strategy)
    // However, current Carcassonne rules usually start with one tile.
  }

  for (let y = 0; y < boardHeight; y++) {
    for (let x = 0; x < boardWidth; x++) {
      if (board[y][x]) continue; // Skip occupied cells

      // Check if cell is adjacent to any existing tile (required for all placements after the first)
      const isAdjacentToExistingTile = (
        (y > 0 && !!board[y-1]?.[x]) ||
        (y < boardHeight - 1 && !!board[y+1]?.[x]) ||
        (x > 0 && !!board[y]?.[x-1]) ||
        (x < boardWidth - 1 && !!board[y]?.[x+1])
      );

      if (!isAdjacentToExistingTile && existingTileFound) { // If tiles exist, must be adjacent
          continue;
      }
      
      // Try all 4 rotations
      for (let i = 0; i < 4; i++) {
        const rotation = i as Rotation;
        const rotatedTileDef = rotateTile(tileDef, rotation); // This has { ...tileDef, borders: ..., rotation: ... }
        if (canPlaceTile(board, x, y, rotatedTileDef)) { // Pass the definition with borders in the target orientation
          possiblePlacementCoords.add(JSON.stringify({ x, y }));
          break; // Found a valid rotation for this position, move to next position as per original logic
        }
      }
    }
  }
  return Array.from(possiblePlacementCoords).map(s => JSON.parse(s) as Coordinates);
};


// Function to initialize the game board and state
export const initializeBoard = (boardSize: number = 72, numPlayers: number = 2): GameState => {
  const centerVal = Math.floor(boardSize / 2);
  const center: Coordinates = { x: centerVal, y: centerVal };
  
  const board: Board = Array(boardSize).fill(null).map(() => Array(boardSize).fill(null));
  
  const initialTileDef = TILES[INITIAL_TILE];
  if (!initialTileDef) throw new Error(`Initial tile '${INITIAL_TILE}' not found in TILES collection.`);

  board[center.y][center.x] = {
    ...initialTileDef,
    x: center.x,
    y: center.y,
    rotation: 0 as Rotation,
    meeple: null
  };
  
  const tileDeck: string[] = [];
  // Standard Carcassonne has 71 tiles + 1 start tile. This is a simplified deck.
  Object.keys(TILES).forEach(type => {
    // Example: Add a certain number of each tile type.
    // This count should match standard game distribution for balance.
    // For this example, let's add a few of each, except the start tile.
    if (type === INITIAL_TILE) return; // Start tile already placed
    let count = 3; // Default count
    if (type === 'A' || type === 'B') count = 5; // Example: more of certain types
    if (type === 'X') count = 1; // Example: fewer of specific types
    for (let i = 0; i < count; i++) {
      tileDeck.push(type);
    }
  });
  // Shuffle deck
  for (let i = tileDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tileDeck[i], tileDeck[j]] = [tileDeck[j], tileDeck[i]];
  }


  const players: Player[] = [];
  for (let i = 0; i < numPlayers; i++) {
    players.push({ 
      id: i, 
      name: i === 0 ? "Player 1" : `Computer ${i}` , // Player 1, then Computer 2, etc.
      score: 0, 
      meeplesRemaining: 7 
    });
  }

  return {
    board,
    boardSize,
    center,
    placedTiles: 1,
    currentTile: getRandomTileFromDeck(tileDeck),
    currentPlayerId: 0, // Player 1 starts
    players,
    tileDeck,
    gamePhase: 'PLAYER_TURN' 
  };
};


// Function to place a tile on the board
export const placeTile = (
  gameState: GameState, 
  x: number, y: number, 
  tileType: string, 
  rotation: Rotation,
  isComputerDiscardingMove?: boolean // This parameter is part of a hack in Game.tsx, consider refactoring
): GameState => {
  const { board, tileDeck } = gameState; // Removed players, currentPlayerId
  const tileDefinition = TILES[tileType];
  if (!tileDefinition && !isComputerDiscardingMove) throw new Error(`Tile type ${tileType} not found.`);
  if (isComputerDiscardingMove && !tileDefinition) { // If it's a discard and tile type is dummy, just return with new tile from deck
    const nextTileOnly = getRandomTileFromDeck(tileDeck);
    return {
      ...gameState,
      currentTile: nextTileOnly,
    }
  }
  if(!tileDefinition) throw new Error(`Tile type ${tileType} not found.`); // Should not be reached if isComputerDiscardingMove is true

  // Get the tile definition with borders correctly rotated
  const rotatedTileDefinition = rotateTile(tileDefinition, rotation);
  
  const newTile: PlacedTile = {
    // Spread the original definition for type, etc.
    ...tileDefinition, 
    // Override with placement-specific properties
    x,
    y,
    rotation, // This is the final rotation value for the placed tile
    borders: rotatedTileDefinition.borders, // Use the borders from the rotated definition
    meeple: null
  };
  
  const newBoard = board.map((row, rowIndex) =>
    rowIndex === y ? row.map((cell, colIndex) => (colIndex === x ? newTile : cell)) : row
  );
  
  const nextTile = getRandomTileFromDeck(tileDeck); // tileDeck is already a mutable copy within gameState

  return {
    ...gameState,
    board: newBoard,
    placedTiles: gameState.placedTiles + 1,
    currentTile: nextTile,
    // gamePhase is handled by the reducer in Game.tsx after this function returns
  };
};

// Function to check if a meeple can be placed on a specific feature of a tile
export const canPlaceMeeple = (gameState: GameState, x: number, y: number, meepleType: MeepleType): boolean => {
  const tile = gameState.board[y]?.[x];
  if (!tile || tile.meeple) { // Check if tile exists and no meeple already on it
    return false;
  }
  
  // This is a highly simplified logic. Real logic would check specific segments (city parts, road segments).
  switch (meepleType) {
    case MEEPLE_TYPES.ROAD:
      return tile.borders.includes('R');
    case MEEPLE_TYPES.CITY:
      return tile.borders.includes('C');
    case MEEPLE_TYPES.FIELD:
      // Fields are complex. Simplified: if there's an F border and it's not all city/road.
      return tile.borders.includes('F'); 
    case MEEPLE_TYPES.MONASTERY:
      // Monastery placement depends on tile type property (e.g. if tile.isMonastery)
      // Original simplified: return true. Let's check if it's a "B" type (cloister) as an example
      return tile.type === 'B'; // Example: Type 'B' is a monastery
    default:
      return false;
  }
};

// Function to place a meeple on a tile
export const placeMeeple = (
  gameState: GameState, 
  x: number, y: number, 
  meepleType: MeepleType, 
  playerId: number
): GameState => {
  const player = gameState.players.find(p => p.id === playerId);
  if (!player || player.meeplesRemaining <= 0) {
    console.warn("Player has no meeples left or player not found.");
    return gameState;
  }

  if (!canPlaceMeeple(gameState, x, y, meepleType)) {
    console.warn("Cannot place meeple here.");
    return gameState; 
  }
  
  const newBoard = gameState.board.map((row, rowIndex) => {
    if (rowIndex === y) {
      return row.map((cell, colIndex) => {
        if (colIndex === x && cell) { 
          return {
            ...cell,
            meeple: {
              type: meepleType,
              playerId
            }
          };
        }
        return cell;
      });
    }
    return row;
  });

  const newPlayers = gameState.players.map(p => 
    p.id === playerId ? { ...p, meeplesRemaining: p.meeplesRemaining - 1 } : p
  );
  
  return {
    ...gameState,
    board: newBoard,
    players: newPlayers
    // gamePhase: 'COMPUTER_TURN' // Or next player, Game.tsx usually handles this
  };
};
