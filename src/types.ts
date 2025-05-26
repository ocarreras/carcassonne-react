// src/types.ts

export type BorderType = 'C' | 'R' | 'F'; // City, Road, Field

export type Rotation = 0 | 1 | 2 | 3; // 0: 0deg, 1: 90deg, 2: 180deg, 3: 270deg

export interface TileDefinition {
  borders: [BorderType, BorderType, BorderType, BorderType];
  type: string; // e.g., 'A', 'B', 'C' ...
  // Potentially add other properties like special features (monastery, etc.)
}

export interface Meeple {
  type: MeepleType;
  playerId: number; // Or string, depending on player identification
  // positionOnTile?: any; // For more granular meeple placement on features
}

export interface PlacedTile extends TileDefinition {
  x: number;
  y: number;
  rotation: Rotation;
  meeple?: Meeple | null;
}

export type Board = (PlacedTile | null)[][];

export interface Coordinates {
  x: number;
  y: number;
}

// Represents the type of meeple that can be placed
export enum MEEPLE_TYPES {
  ROAD = 'road',
  CITY = 'city',
  MONASTERY = 'monastery',
  FIELD = 'field',
}

export type MeepleType = MEEPLE_TYPES; // Added MeepleType alias

export type GamePhase = 'PLAYER_TURN' | 'MEEPLE_PLACEMENT' | 'COMPUTER_TURN' | 'GAME_OVER';

export interface Player {
  id: number; // Or string
  name: string;
  score: number;
  meeplesRemaining: number;
}

export interface GameState {
  board: Board;
  boardSize: number; // Keep track of the dynamic board size or use a fixed large one
  center: Coordinates; // Center of the board, useful for initial placement
  placedTiles: number;
  currentTile: string | null; // Type of the tile to be placed next (e.g., 'A', 'D')
  currentPlayerId: number; // ID of the player whose turn it is
  players: Player[]; // Array of players
  tileDeck: string[]; // Represents the bag of tiles
  gamePhase: GamePhase;
  lastPlacedTilePosition?: Coordinates | null;
  availableMeepleTypesForPlacement?: MeepleType[];
  // Add any other relevant game state properties here, e.g.:
  // lastPlacedTile?: PlacedTile; // This could be the full PlacedTile object if needed
  // possibleMoves?: Coordinates[]; // For highlighting valid moves
}

// Type for the TILES constant in gameLogic
export interface TilesCollection {
  [key: string]: TileDefinition;
}
