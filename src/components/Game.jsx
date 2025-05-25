import React, { useState, useEffect } from 'react';
import Board from './Board';
import MeeplePlacement from './MeeplePlacement';
import { 
  initializeBoard, 
  TILES, 
  findPossiblePlacements, 
  placeTile, 
  placeMeeple,
  MEEPLE_TYPES,
  getValidRotations,
  getMeeplePlacements
} from '../utils/gameLogic';

const Game = () => {
  const [gameState, setGameState] = useState(null);
  const [possiblePlacements, setPossiblePlacements] = useState([]);
  const [gamePhase, setGamePhase] = useState('PLAYER_TURN'); // PLAYER_TURN, MEEPLE_PLACEMENT, COMPUTER_TURN
  const [lastPlacedTile, setLastPlacedTile] = useState(null);
  const [availableMeepleTypes, setAvailableMeepleTypes] = useState([]);
  const [selectedPosition, setSelectedPosition] = useState(null); // { x, y }
  const [currentRotation, setCurrentRotation] = useState(0);
  const [validRotations, setValidRotations] = useState([]);
  
  // New meeple placement states
  const [meeplePlacementMode, setMeeplePlacementMode] = useState(false);
  const [selectedMeepleSpot, setSelectedMeepleSpot] = useState(-1);
  const [meeplePlacementTile, setMeeplePlacementTile] = useState(null);

  // Initialize the game
  useEffect(() => {
    const initialGameState = initializeBoard();
    setGameState(initialGameState);
  }, []);

  // Calculate possible placements when the current tile changes
  useEffect(() => {
    if (!gameState) return;

    // Only show possible placements when in PLAYER_TURN and NOT in meeple placement mode
    if (gamePhase === 'PLAYER_TURN' && !meeplePlacementMode) {
      const currentTileType = gameState.currentTile;
      const currentTile = TILES[currentTileType];
      const placements = findPossiblePlacements(gameState.board, currentTile);
      setPossiblePlacements(placements);
    } else {
      setPossiblePlacements([]);
    }
  }, [gameState, gamePhase, meeplePlacementMode]);

  // Handle empty tile click
  const handleEmptyTileClick = (x, y) => {
    if (gamePhase !== 'PLAYER_TURN' || meeplePlacementMode) return;

    // Get valid rotations for this position
    const validRots = getValidRotations(gameState.board, x, y, TILES[gameState.currentTile]);
    
    if (validRots.length > 0) {
      setSelectedPosition({ x, y });
      setCurrentRotation(validRots[0]); // Start with first valid rotation
      setValidRotations(validRots);
    }
  };

  // Handle selected tile click (for rotation)
  const handleSelectedTileClick = () => {
    if (!selectedPosition || validRotations.length === 0 || meeplePlacementMode) return;

    // Find next valid rotation
    const currentIndex = validRotations.indexOf(currentRotation);
    const nextIndex = (currentIndex + 1) % validRotations.length;
    setCurrentRotation(validRotations[nextIndex]);
  };

  // Handle confirm placement - now enters meeple placement mode
  const handleConfirmPlacement = () => {
    if (!selectedPosition || gamePhase !== 'PLAYER_TURN' || meeplePlacementMode) return;

    const currentTileType = gameState.currentTile;
    const newGameState = placeTile(gameState, selectedPosition.x, selectedPosition.y, currentTileType, currentRotation);
    setGameState(newGameState);
    setLastPlacedTile({ ...selectedPosition, rotation: currentRotation, tileType: currentTileType });
    
    // Enter meeple placement mode
    setMeeplePlacementMode(true);
    setMeeplePlacementTile({ x: selectedPosition.x, y: selectedPosition.y, rotation: currentRotation, tileType: currentTileType });
    setSelectedMeepleSpot(-1);
    
    // Reset tile selection states
    setSelectedPosition(null);
    setCurrentRotation(0);
    setValidRotations([]);
  };

  // Handle meeple spot click
  const handleMeepleSpotClick = (spotIndex) => {
    if (!meeplePlacementMode) return;
    
    // Toggle selection - if same spot is clicked, deselect it
    if (selectedMeepleSpot === spotIndex) {
      setSelectedMeepleSpot(-1);
    } else {
      setSelectedMeepleSpot(spotIndex);
    }
  };

  // Handle meeple placement confirmation
  const handleMeepleConfirm = () => {
    if (!meeplePlacementMode || !lastPlacedTile) return;

    let finalGameState = gameState;
    
    // Place meeple if one is selected
    if (selectedMeepleSpot !== -1) {
      const { x, y } = lastPlacedTile;
      finalGameState = placeMeeple(finalGameState, x, y, selectedMeepleSpot, 0); // Player ID is 0
    }
    
    // Update game state with the final state (with or without meeple)
    setGameState(finalGameState);
    
    // Exit meeple placement mode
    setMeeplePlacementMode(false);
    setSelectedMeepleSpot(-1);
    setMeeplePlacementTile(null);
    
    // Move to computer's turn
    setGamePhase('COMPUTER_TURN');
    setTimeout(handleComputerTurn, 1000); // Delay for better UX
  };

  // Handle meeple placement cancellation
  const handleMeepleCancel = () => {
    if (!meeplePlacementMode || !lastPlacedTile) return;

    // Remove the placed tile and go back to tile placement
    const { x, y } = lastPlacedTile;
    const newBoard = gameState.board.map(row => [...row]);
    newBoard[y][x] = null;
    
    const newGameState = {
      ...gameState,
      board: newBoard,
      placedTiles: gameState.placedTiles - 1
    };
    
    setGameState(newGameState);
    setMeeplePlacementMode(false);
    setSelectedMeepleSpot(-1);
    setMeeplePlacementTile(null);
    setLastPlacedTile(null);
    
    // Go back to tile placement with the same tile
    setSelectedPosition({ x, y });
    setCurrentRotation(lastPlacedTile.rotation);
    const validRots = getValidRotations(newGameState.board, x, y, TILES[gameState.currentTile]);
    setValidRotations(validRots);
  };

  // Handle meeple placement (legacy - keeping for compatibility)
  const handleMeeplePlaced = (meepleType) => {
    if (!lastPlacedTile || gamePhase !== 'MEEPLE_PLACEMENT') return;

    const { x, y } = lastPlacedTile;
    const newGameState = placeMeeple(gameState, x, y, meepleType, 0); // Player ID is 0
    setGameState(newGameState);
    
    // Move to computer's turn
    setGamePhase('COMPUTER_TURN');
    setTimeout(handleComputerTurn, 1000); // Delay for better UX
  };

  // Skip meeple placement (legacy - keeping for compatibility)
  const handleSkipMeeple = () => {
    setGamePhase('COMPUTER_TURN');
    setTimeout(handleComputerTurn, 1000); // Delay for better UX
  };

  // Computer's turn
  const handleComputerTurn = () => {
    if (!gameState) return;

    // Get a random tile for the computer
    const computerTileType = gameState.currentTile;
    const computerTile = TILES[computerTileType];
    
    // Find possible placements
    const placements = findPossiblePlacements(gameState.board, computerTile);
    
    if (placements.length > 0) {
      // Choose a random placement
      const randomIndex = Math.floor(Math.random() * placements.length);
      const { x, y } = placements[randomIndex];
      
      // Get valid rotations and choose one
      const validRots = getValidRotations(gameState.board, x, y, computerTile);
      const rotation = validRots[Math.floor(Math.random() * validRots.length)];
      
      // Place the tile
      const newGameState = placeTile(gameState, x, y, computerTileType, rotation);
      
      // Decide whether to place a meeple (50% chance)
      let finalGameState = newGameState;
      if (Math.random() > 0.5) {
        // Get available meeple placements for this tile
        const meeplePlacements = getMeeplePlacements(computerTileType, rotation);
        
        if (meeplePlacements.length > 0) {
          // Choose a random meeple placement
          const randomSpotIndex = Math.floor(Math.random() * meeplePlacements.length);
          
          // Place the meeple
          finalGameState = placeMeeple(newGameState, x, y, randomSpotIndex, 1); // Computer ID is 1
        }
      }
      
      setGameState(finalGameState);
    }
    
    // Back to player's turn
    setGamePhase('PLAYER_TURN');
  };

  if (!gameState) {
    return <div>Loading game...</div>;
  }

  return (
    <div style={{ 
      height: 'calc(100vh - 60px)', // Full height minus navbar
      position: 'relative',
      overflow: 'hidden'
    }}>
      <Board 
        gameState={gameState}
        possiblePlacements={possiblePlacements}
        onEmptyTileClick={handleEmptyTileClick}
        onSelectedTileClick={handleSelectedTileClick}
        selectedPosition={selectedPosition}
        currentRotation={currentRotation}
        currentTile={gameState.currentTile}
        onConfirmPlacement={handleConfirmPlacement}
        meeplePlacementMode={meeplePlacementMode}
        meeplePlacementTile={meeplePlacementTile}
        selectedMeepleSpot={selectedMeepleSpot}
        onMeepleSpotClick={handleMeepleSpotClick}
        onMeepleConfirm={handleMeepleConfirm}
        onMeepleCancel={handleMeepleCancel}
      />
      
      {gamePhase === 'MEEPLE_PLACEMENT' && (
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000
        }}>
          <MeeplePlacement 
            onMeeplePlaced={handleMeeplePlaced}
            onSkip={handleSkipMeeple}
            availableTypes={availableMeepleTypes}
          />
        </div>
      )}
    </div>
  );
};

export default Game;
