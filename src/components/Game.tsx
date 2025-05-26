import React, { useState, useEffect, useCallback, useReducer } from 'react';
import Board from './Board.tsx';
import MeeplePlacement from './MeeplePlacement.tsx';
import Tile from './Tile.tsx'; // For current tile preview
import {
  initializeBoard as initializeBoardLogic,
  TILES,
  findPossiblePlacements as findPossiblePlacementsLogic,
  placeTile as placeTileLogic,
  placeMeeple as placeMeepleLogic,
  getValidRotations as getValidRotationsLogic,
  // getRandomTileFromDeck is internal to gameLogic's placeTile etc.
  // getRandomTileType was removed; computer uses gameState.currentTile
} from '../utils/gameLogic.ts'; // Corrected import path
import { 
    GameState, 
    Coordinates, 
    Rotation, 
    MeepleType, 
    // TileDefinition, // Unused
    MEEPLE_TYPES,
    PlacedTile
    // Player // Unused
} from '../types.ts'; // Corrected import path

// --- Game Reducer Logic ---

type GameAction =
  | { type: 'SET_GAME_STATE'; payload: GameState } // For complex updates or initial load
  | { type: 'CONFIRM_TILE_PLACEMENT'; payload: { x: number; y: number; tileType: string; rotation: Rotation } }
  | { type: 'PLACE_MEEPLE'; payload: { x: number; y: number; meepleType: MeepleType; playerId: number } }
  | { type: 'SKIP_MEEPLE_PLACEMENT' }
  | { type: 'TRIGGER_COMPUTER_TURN' } // Action to signify computer's turn should start processing
  | { type: 'COMPUTER_ACTION_COMPLETE'; payload: GameState }; // Computer's turn finished, update state

const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'SET_GAME_STATE':
      return action.payload;

    case 'CONFIRM_TILE_PLACEMENT': {
      if (!state.currentTile) return state;
      const newState = placeTileLogic(state, action.payload.x, action.payload.y, state.currentTile, action.payload.rotation);
      
      const placedTileOnBoard = newState.board[action.payload.y]?.[action.payload.x];
      if (!placedTileOnBoard) return newState; // Should not happen

      const tileDef = TILES[placedTileOnBoard.type];
      const availableMeepleTypes: MeepleType[] = [];
      if (tileDef.borders.includes('R')) availableMeepleTypes.push(MEEPLE_TYPES.ROAD);
      if (tileDef.borders.includes('C')) availableMeepleTypes.push(MEEPLE_TYPES.CITY);
      if (tileDef.borders.includes('F')) availableMeepleTypes.push(MEEPLE_TYPES.FIELD);
      // Example: Type 'B' is a monastery, and 'E' might be another special type
      if (tileDef.type === 'B' || tileDef.type === 'E') { 
         availableMeepleTypes.push(MEEPLE_TYPES.MONASTERY);
      }

      return { 
        ...newState, 
        gamePhase: 'MEEPLE_PLACEMENT',
        lastPlacedTilePosition: { x: action.payload.x, y: action.payload.y },
        availableMeepleTypesForPlacement: availableMeepleTypes,
      };
    }

    case 'PLACE_MEEPLE': {
      const newState = placeMeepleLogic(state, action.payload.x, action.payload.y, action.payload.meepleType, action.payload.playerId);
      return {
        ...newState,
        gamePhase: 'COMPUTER_TURN', 
        lastPlacedTilePosition: null,
        availableMeepleTypesForPlacement: [],
      };
    }

    case 'SKIP_MEEPLE_PLACEMENT':
      return {
        ...state,
        gamePhase: 'COMPUTER_TURN',
        lastPlacedTilePosition: null,
        availableMeepleTypesForPlacement: [],
      };
    
    case 'TRIGGER_COMPUTER_TURN': // This action just signals the phase, actual logic is in useEffect -> handleComputerTurn -> dispatch COMPUTER_ACTION_COMPLETE
        return state; // State change might not be needed here if useEffect handles the async part

    case 'COMPUTER_ACTION_COMPLETE':
        return action.payload; // The new state after computer's turn

    default:
      return state;
  }
};

// --- Game Component ---

const Game: React.FC = () => {
  // useReducer for core game state
  const [gameState, dispatch] = useReducer(gameReducer, undefined, () => initializeBoardLogic(72, 2));

  // Local UI state for player's tile selection process
  const [selectedPosition, setSelectedPosition] = useState<Coordinates | null>(null);
  const [currentRotation, setCurrentRotation] = useState<Rotation>(0);
  const [validRotationsAtSelected, setValidRotationsAtSelected] = useState<Rotation[]>([]);
  const [possiblePlacements, setPossiblePlacements] = useState<Coordinates[]>([]);
  
  // Board zoom and pan state (remains local UI state)
  const [boardPosition, setBoardPosition] = useState<Coordinates>({ x: 0, y: 0 });
  const [boardScale, setBoardScale] = useState<number>(0.5);

  // Effect for initial board centering (once gameState is initialized)
  useEffect(() => {
    if (gameState) {
        const tileDisplaySize = 100 * boardScale; // visual size of tile on board (100px * current board scale)
        const viewportWidth = window.innerWidth * 0.8; // Approximation of board container width
        const viewportHeight = window.innerHeight * 0.6; // Approximation of board container height

        const initialX = viewportWidth / 2 - (gameState.center.x * tileDisplaySize + tileDisplaySize / 2);
        const initialY = viewportHeight / 2 - (gameState.center.y * tileDisplaySize + tileDisplaySize / 2);
        setBoardPosition({ x: initialX, y: initialY });
    }
  }, [gameState?.center.x, gameState?.center.y, boardScale]); // Re-centers if scale changes, or only on init if scale is stable


  // Effect to calculate possible placements when it's player's turn and current tile changes
  useEffect(() => {
    if (gameState.gamePhase === 'PLAYER_TURN' && gameState.currentTile) {
      const currentTileDef = TILES[gameState.currentTile];
      if (currentTileDef) {
        const placements = findPossiblePlacementsLogic(gameState.board, currentTileDef);
        setPossiblePlacements(placements);
      } else {
        setPossiblePlacements([]);
      }
    } else {
      setPossiblePlacements([]); // Clear placements if not player's turn or no current tile
    }
  }, [gameState.gamePhase, gameState.currentTile, gameState.board]);


  // Player actions: Handlers for UI interactions dispatching actions to the reducer
  const handleEmptyTileClick = useCallback((x: number, y: number) => {
    if (gameState.gamePhase !== 'PLAYER_TURN' || !gameState.currentTile) return;
    const currentTileDef = TILES[gameState.currentTile];
    if (!currentTileDef) return;

    const validRots = getValidRotationsLogic(gameState.board, x, y, currentTileDef);
    if (validRots.length > 0) {
      setSelectedPosition({ x, y });
      setCurrentRotation(validRots[0]);
      setValidRotationsAtSelected(validRots);
    } else {
      setSelectedPosition(null);
      setValidRotationsAtSelected([]);
    }
  }, [gameState.gamePhase, gameState.currentTile, gameState.board]);

  const handleSelectedTileClick = useCallback(() => { // For rotating the selected tile
    if (!selectedPosition || validRotationsAtSelected.length === 0) return;
    const currentIndex = validRotationsAtSelected.indexOf(currentRotation);
    const nextIndex = (currentIndex + 1) % validRotationsAtSelected.length;
    setCurrentRotation(validRotationsAtSelected[nextIndex]);
  }, [selectedPosition, currentRotation, validRotationsAtSelected]);

  const handleConfirmPlacement = useCallback(() => {
    if (!selectedPosition || !gameState.currentTile || gameState.gamePhase !== 'PLAYER_TURN') return;
    dispatch({
      type: 'CONFIRM_TILE_PLACEMENT',
      payload: {
        x: selectedPosition.x,
        y: selectedPosition.y,
        tileType: gameState.currentTile, // Reducer uses gameState.currentTile
        rotation: currentRotation,
      },
    });
    setSelectedPosition(null);
    setCurrentRotation(0);
    setValidRotationsAtSelected([]);
  }, [selectedPosition, gameState.currentTile, gameState.gamePhase, currentRotation]);

  const handleMeeplePlaced = useCallback((meepleType: MeepleType) => {
    if (!gameState.lastPlacedTilePosition || gameState.gamePhase !== 'MEEPLE_PLACEMENT') return;
    dispatch({
      type: 'PLACE_MEEPLE',
      payload: {
        x: gameState.lastPlacedTilePosition.x,
        y: gameState.lastPlacedTilePosition.y,
        meepleType,
        playerId: gameState.currentPlayerId,
      },
    });
  }, [gameState.lastPlacedTilePosition, gameState.gamePhase, gameState.currentPlayerId]);

  const handleSkipMeeple = useCallback(() => {
    if (gameState.gamePhase !== 'MEEPLE_PLACEMENT') return;
    dispatch({ type: 'SKIP_MEEPLE_PLACEMENT' });
  }, [gameState.gamePhase]);


  // Computer's Turn Logic (triggered by useEffect watching gamePhase)
  const performComputerTurn = useCallback((currentState: GameState) => { // Removed async as it's not used
    if (!currentState.currentTile) { // No tile for computer (e.g. deck empty)
        dispatch({ type: 'COMPUTER_ACTION_COMPLETE', payload: { ...currentState, gamePhase: currentState.tileDeck.length === 0 ? 'GAME_OVER' : 'PLAYER_TURN', currentPlayerId: 0 } });
        return;
    }
    const computerTileDef = TILES[currentState.currentTile];
    if (!computerTileDef) { // Should not happen
        dispatch({ type: 'COMPUTER_ACTION_COMPLETE', payload: { ...currentState, gamePhase: 'PLAYER_TURN', currentPlayerId: 0 } });
        return;
    }

    const compPlacements = findPossiblePlacementsLogic(currentState.board, computerTileDef);
    let newState = { ...currentState }; // Start with current state

    if (compPlacements.length > 0) {
        const randomPlacement = compPlacements[Math.floor(Math.random() * compPlacements.length)];
        const validRots = getValidRotationsLogic(currentState.board, randomPlacement.x, randomPlacement.y, computerTileDef);
        const randomRotation = validRots.length > 0 ? validRots[Math.floor(Math.random() * validRots.length)] : (0 as Rotation);
        
        newState = placeTileLogic(currentState, randomPlacement.x, randomPlacement.y, currentState.currentTile, randomRotation);
        const placedComputerTile = newState.board[randomPlacement.y]?.[randomPlacement.x];

        if (placedComputerTile && Math.random() > 0.5) {
            const compTileDefForMeeple = TILES[placedComputerTile.type];
            const availableTypes: MeepleType[] = [];
            if (compTileDefForMeeple.borders.includes('R')) availableTypes.push(MEEPLE_TYPES.ROAD);
            if (compTileDefForMeeple.borders.includes('C')) availableTypes.push(MEEPLE_TYPES.CITY);
            if (compTileDefForMeeple.type === 'B' || compTileDefForMeeple.type === 'E') { 
                availableTypes.push(MEEPLE_TYPES.MONASTERY);
            }
            if (availableTypes.length > 0) {
                const randomMeepleType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
                const computerPlayer = newState.players.find(p => p.id === 1); // Assuming computer is player ID 1
                if (computerPlayer && computerPlayer.meeplesRemaining > 0) {
                    newState = placeMeepleLogic(newState, randomPlacement.x, randomPlacement.y, randomMeepleType, 1);
                }
            }
        }
    } else {
        // Computer cannot place tile, try to draw a new tile for itself (if any left) or just pass turn
        console.warn("Computer could not find a placement. Skipping its tile placement.");
        // To prevent infinite loop if computer always gets unplaceable tile, it should "discard" and get new one
        // This is handled by placeTileLogic giving a new currentTile. If deck empty, currentTile becomes null.
        newState = { ...newState, currentTile: placeTileLogic(newState,0,0,"",0,true).currentTile }; // Hack: "discard" by trying dummy placement
    }
    
    // After computer's turn, it's player's turn again
    // Ensure gamePhase reflects GAME_OVER if deck is empty after computer's potential tile draw
    dispatch({ type: 'COMPUTER_ACTION_COMPLETE', payload: { ...newState, gamePhase: newState.tileDeck.length === 0 && !newState.currentTile ? 'GAME_OVER' : 'PLAYER_TURN', currentPlayerId: 0 } });

  }, []); // dispatch is stable; TILES, game logic functions are stable.

  useEffect(() => {
    if (gameState.gamePhase === 'COMPUTER_TURN') {
      const timer = setTimeout(() => {
        performComputerTurn(gameState);
      }, 1000); // Delay for UX
      return () => clearTimeout(timer);
    }
  }, [gameState.gamePhase, performComputerTurn, gameState]); // gameState included to re-trigger if computer turn comes up again with new state


  // --- Render Functions ---
  const renderGameStatus = (): React.JSX.Element | null => { // Changed return type
    if (!gameState) return null;
    const player = gameState.players.find(p => p.id === gameState.currentPlayerId);
    let statusText = `Player: ${player?.name || 'N/A'} (${player?.score} pts, ${player?.meeplesRemaining} meeples) | Tiles left: ${gameState.tileDeck.length}`;

    switch (gameState.gamePhase) {
      case 'PLAYER_TURN':
        statusText += ` | Your turn - Place tile ${gameState.currentTile || 'N/A'}`;
        if (selectedPosition) statusText += ` (Selected: ${selectedPosition.x},${selectedPosition.y} R:${currentRotation})`;
        break;
      case 'MEEPLE_PLACEMENT':
        statusText += ` | Place a meeple or skip on tile at ${gameState.lastPlacedTilePosition?.x}, ${gameState.lastPlacedTilePosition?.y}`;
        break;
      case 'COMPUTER_TURN':
        statusText += ' | Computer is thinking...';
        break;
      case 'GAME_OVER': {
        const p1Score = gameState.players.find(p=>p.id===0)?.score || 0;
        const p2Score = gameState.players.find(p=>p.id===1)?.score || 0;
        statusText = `GAME OVER | Final Scores: Player 1: ${p1Score}, Computer: ${p2Score}`;
        if (p1Score > p2Score) statusText += " | Player 1 Wins!";
        else if (p2Score > p1Score) statusText += " | Computer Wins!";
        else statusText += " | It's a Tie!";
        break;
      }
      default:
        statusText += '';
    }
    return <div style={{ padding: '10px', backgroundColor: '#4a6c6f', color: 'white', borderRadius: '5px', marginBottom: '10px', textAlign: 'center', fontWeight: 'bold' }}>{statusText}</div>;
  };

  const renderCurrentTilePreview = (): React.JSX.Element | null => { // Changed return type
    if (!gameState || gameState.gamePhase !== 'PLAYER_TURN' || !gameState.currentTile) return null;
    const tileDef = TILES[gameState.currentTile];
    if (!tileDef) return null;

    const previewTileData: PlacedTile = {
        ...tileDef, x: 0, y: 0, 
        rotation: selectedPosition ? currentRotation : 0, // Show currentRotation if a spot is selected
        meeple: null,
    };
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px', backgroundColor: 'rgba(255, 255, 255, 0.9)', padding: '10px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h3 style={{ margin: '0 0 10px 0' }}>Current Tile to Place: {gameState.currentTile}</h3>
        <div style={{ width: '100px', height: '100px', position: 'relative' }}>
          <Tile
            tileData={previewTileData}
            scale={1}
            isSelected={!!selectedPosition} // Show confirm button if a board position is selected
            onConfirm={selectedPosition ? handleConfirmPlacement : undefined} // Confirm button on preview tile
             onClick={!selectedPosition ? () => setCurrentRotation(prev => ((prev + 1) % 4) as Rotation) : undefined } // Rotate preview if no spot selected
          />
        </div>
        {selectedPosition && <p style={{margin: '5px 0 0 0', fontSize: '0.9rem', textAlign: 'center'}}>Click tile on board to rotate further. <br/>Click checkmark on preview to confirm.</p>}
        {!selectedPosition && <p style={{margin: '5px 0 0 0', fontSize: '0.9rem', textAlign: 'center'}}>Click preview to pre-rotate. <br/>Click an empty yellow square on board to select placement.</p>}
      </div>
    );
  };

  if (!gameState) return <div>Loading game...</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', backgroundColor: '#e0e0e0', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
      <h1 style={{ textAlign: 'center', color: '#333', marginBottom: '20px' }}>Carcassonne Game (useReducer)</h1>
      {renderGameStatus()}
      {renderCurrentTilePreview()}
      <Board
        gameState={gameState}
        possiblePlacements={possiblePlacements} // Already filtered by phase or empty
        onEmptyTileClick={handleEmptyTileClick}
        onSelectedTileClick={handleSelectedTileClick} // For rotating tile on board
        selectedPosition={selectedPosition}
        currentRotation={currentRotation} // For tile on board
        currentTileType={gameState.currentTile}
        onConfirmPlacement={handleConfirmPlacement} // This is now on the preview tile
        boardZoomAndPan={{ position: boardPosition, scale: boardScale, setPosition: setBoardPosition, setScale: setBoardScale }}
      />
      {gameState.gamePhase === 'MEEPLE_PLACEMENT' && (
        <MeeplePlacement
          onMeeplePlaced={handleMeeplePlaced}
          onSkip={handleSkipMeeple}
          availableTypes={gameState.availableMeepleTypesForPlacement || []}
        />
      )}
    </div>
  );
};

export default Game;
