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
  getValidRotations
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

  // Initialize the game
  useEffect(() => {
    const initialGameState = initializeBoard();
    setGameState(initialGameState);
  }, []);

  // Calculate possible placements when the current tile changes
  useEffect(() => {
    if (!gameState) return;

    if (gamePhase === 'PLAYER_TURN') {
      const currentTileType = gameState.currentTile;
      const currentTile = TILES[currentTileType];
      const placements = findPossiblePlacements(gameState.board, currentTile);
      setPossiblePlacements(placements);
    }
  }, [gameState, gamePhase]);

  // Handle empty tile click
  const handleEmptyTileClick = (x, y) => {
    if (gamePhase !== 'PLAYER_TURN') return;

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
    if (!selectedPosition || validRotations.length === 0) return;

    // Find next valid rotation
    const currentIndex = validRotations.indexOf(currentRotation);
    const nextIndex = (currentIndex + 1) % validRotations.length;
    setCurrentRotation(validRotations[nextIndex]);
  };

  // Handle confirm placement
  const handleConfirmPlacement = () => {
    if (!selectedPosition || gamePhase !== 'PLAYER_TURN') return;

    const currentTileType = gameState.currentTile;
    const newGameState = placeTile(gameState, selectedPosition.x, selectedPosition.y, currentTileType, currentRotation);
    setGameState(newGameState);
    setLastPlacedTile(selectedPosition);
    
    // Determine available meeple types for this tile
    const tile = TILES[currentTileType];
    const meepleTypes = [];
    
    if (tile.borders.includes('R')) meepleTypes.push(MEEPLE_TYPES.ROAD);
    if (tile.borders.includes('C')) meepleTypes.push(MEEPLE_TYPES.CITY);
    if (tile.borders.includes('F')) meepleTypes.push(MEEPLE_TYPES.FIELD);
    meepleTypes.push(MEEPLE_TYPES.MONASTERY); // Simplified: any tile can have a monastery
    
    setAvailableMeepleTypes(meepleTypes);
    setGamePhase('MEEPLE_PLACEMENT');
    
    // Reset selection states
    setSelectedPosition(null);
    setCurrentRotation(0);
    setValidRotations([]);
  };

  // Handle meeple placement
  const handleMeeplePlaced = (meepleType) => {
    if (!lastPlacedTile || gamePhase !== 'MEEPLE_PLACEMENT') return;

    const { x, y } = lastPlacedTile;
    const newGameState = placeMeeple(gameState, x, y, meepleType, 0); // Player ID is 0
    setGameState(newGameState);
    
    // Move to computer's turn
    setGamePhase('COMPUTER_TURN');
    setTimeout(handleComputerTurn, 1000); // Delay for better UX
  };

  // Skip meeple placement
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
      const { x, y, rotation } = placements[randomIndex];
      
      // Place the tile
      const newGameState = placeTile(gameState, x, y, computerTileType, rotation);
      
      // Decide whether to place a meeple (50% chance)
      let finalGameState = newGameState;
      if (Math.random() > 0.5) {
        // Get available meeple types for this tile
        const availableTypes = [];
        if (computerTile.borders.includes('R')) availableTypes.push(MEEPLE_TYPES.ROAD);
        if (computerTile.borders.includes('C')) availableTypes.push(MEEPLE_TYPES.CITY);
        if (computerTile.borders.includes('F')) availableTypes.push(MEEPLE_TYPES.FIELD);
        availableTypes.push(MEEPLE_TYPES.MONASTERY);
        
        if (availableTypes.length > 0) {
          // Choose a random meeple type
          const randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
          
          // Place the meeple
          finalGameState = placeMeeple(newGameState, x, y, randomType, 1); // Computer ID is 1
        }
      }
      
      setGameState(finalGameState);
    }
    
    // Back to player's turn
    setGamePhase('PLAYER_TURN');
  };

  // Render game status
  const renderGameStatus = () => {
    if (!gameState) return null;

    let statusText = '';
    switch (gamePhase) {
      case 'PLAYER_TURN':
        statusText = `Your turn - Place tile ${gameState.currentTile}`;
        break;
      case 'MEEPLE_PLACEMENT':
        statusText = 'Place a meeple or skip';
        break;
      case 'COMPUTER_TURN':
        statusText = 'Computer is thinking...';
        break;
      default:
        statusText = '';
    }

    return (
      <div style={{ 
        padding: '10px', 
        backgroundColor: '#4a6c6f', 
        color: 'white',
        borderRadius: '5px',
        marginBottom: '10px',
        textAlign: 'center',
        fontWeight: 'bold'
      }}>
        {statusText}
      </div>
    );
  };

  // Render current tile preview
  const renderCurrentTile = () => {
    if (!gameState || gamePhase !== 'PLAYER_TURN') return null;

    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: '20px',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: '10px',
        borderRadius: '10px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ marginRight: '15px' }}>
          <h3 style={{ margin: '0 0 5px 0' }}>Current Tile:</h3>
          <div style={{ 
            width: '80px', 
            height: '80px',
            position: 'relative',
            border: '2px solid #4a6c6f',
            borderRadius: '5px'
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              backgroundImage: `url(/base_game/${gameState.currentTile}.png)`,
              backgroundSize: 'cover'
            }} />
            <div 
              onClick={handleConfirmPlacement}
              style={{
                position: 'absolute',
                top: '5px',
                right: '5px',
                width: '20px',
                height: '20px',
                backgroundImage: 'url(/icon-accept-48.png)',
                backgroundSize: 'cover',
                cursor: 'pointer',
                display: selectedPosition ? 'block' : 'none'
              }}
            />
          </div>
        </div>
        <div>
          <p style={{ margin: '0', fontSize: '0.9rem' }}>
            Possible placements: {possiblePlacements.length}
          </p>
          <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem' }}>
            Tiles placed: {gameState.placedTiles}
          </p>
        </div>
      </div>
    );
  };

  if (!gameState) {
    return <div>Loading game...</div>;
  }

  return (
    <div style={{ 
      maxWidth: '1000px', 
      margin: '0 auto', 
      padding: '20px',
      backgroundColor: '#f5f5f5',
      borderRadius: '10px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
    }}>
      <h1 style={{ 
        textAlign: 'center', 
        color: '#333',
        marginBottom: '20px'
      }}>
        Carcassonne
      </h1>
      
      {renderGameStatus()}
      {renderCurrentTile()}
      
      <Board 
        gameState={gameState}
        possiblePlacements={gamePhase === 'PLAYER_TURN' ? possiblePlacements : []}
        onEmptyTileClick={handleEmptyTileClick}
        onSelectedTileClick={handleSelectedTileClick}
        selectedPosition={selectedPosition}
        currentRotation={currentRotation}
        currentTile={gameState.currentTile}
      />
      
      {gamePhase === 'MEEPLE_PLACEMENT' && (
        <MeeplePlacement 
          onMeeplePlaced={handleMeeplePlaced}
          onSkip={handleSkipMeeple}
          availableTypes={availableMeepleTypes}
        />
      )}
    </div>
  );
};

export default Game;
