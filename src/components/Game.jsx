import React from 'react';
import { useGame } from '../contexts/GameContext.jsx';
import { GAME_PHASES } from '../utils/messageTypes.js';
import Board from './Board.jsx';

const Game = () => {
  const { state, actions } = useGame();

  // Handle empty tile click for tile placement
  const handleEmptyTileClick = (x, y) => {
    if (!state.isMyTurn || state.meeplePlacementMode) return;

    // Check if this position is in valid placements
    const isValidPlacement = state.validPlacements.some(
      placement => placement.position.x === x && placement.position.y === y
    );

    if (isValidPlacement) {
      actions.setSelectedPosition({ x, y });
      actions.setCurrentRotation(0); // Start with 0 rotation
    }
  };

  // Handle selected tile click for rotation
  const handleSelectedTileClick = () => {
    if (!state.selectedPosition || !state.isMyTurn || state.meeplePlacementMode) return;

    // Cycle through rotations (0, 90, 180, 270)
    const newRotation = (state.currentRotation + 90) % 360;
    actions.setCurrentRotation(newRotation);
  };

  // Handle confirm tile placement
  const handleConfirmPlacement = () => {
    if (!state.selectedPosition || !state.isMyTurn || state.meeplePlacementMode) return;

    // Send tile placement to server
    actions.placeTile(state.selectedPosition, state.currentRotation);
    
    // Clear selection
    actions.setSelectedPosition(null);
    actions.setCurrentRotation(0);
  };

  // Handle meeple spot click
  const handleMeepleSpotClick = (spotIndex) => {
    if (!state.meeplePlacementMode || !state.isMyTurn) return;
    
    // Toggle selection
    if (state.selectedMeepleSpot === spotIndex) {
      actions.setSelectedMeepleSpot(-1);
    } else {
      actions.setSelectedMeepleSpot(spotIndex);
    }
  };

  // Handle meeple placement confirmation
  const handleMeepleConfirm = () => {
    if (!state.meeplePlacementMode || !state.isMyTurn) return;

    if (state.selectedMeepleSpot !== -1) {
      // Place meeple
      actions.placeMeeple(state.selectedMeepleSpot);
    } else {
      // Skip meeple placement - send empty meeple placement
      actions.placeMeeple(-1);
    }
    
    // Clear meeple selection
    actions.setSelectedMeepleSpot(-1);
  };

  // Handle meeple placement cancellation
  const handleMeepleCancel = () => {
    if (!state.meeplePlacementMode || !state.isMyTurn) return;

    // For now, just skip meeple placement
    // In a real implementation, we might want to allow going back to tile placement
    actions.placeMeeple(-1);
    actions.setSelectedMeepleSpot(-1);
  };

  // Get current player info
  const getCurrentPlayerInfo = () => {
    if (!state.roomPlayers || !state.currentPlayer) return null;
    return state.roomPlayers.find(p => p.id === state.currentPlayer);
  };

  // Get player color
  const getPlayerColor = (playerId) => {
    const colors = ['#FF5722', '#2196F3', '#4CAF50', '#FF9800', '#9C27B0'];
    const playerIndex = state.roomPlayers.findIndex(p => p.id === playerId);
    return colors[playerIndex % colors.length];
  };

  if (!state.gameState) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingCard}>
          <h2>Loading Game...</h2>
          <p>Waiting for game state from server</p>
        </div>
      </div>
    );
  }

  const currentPlayerInfo = getCurrentPlayerInfo();

  return (
    <div style={styles.container}>
      {/* Game Header */}
      <div style={styles.gameHeader}>
        <div style={styles.gameInfo}>
          <h2 style={styles.gameTitle}>Carcassonne</h2>
          {state.gamePhase === GAME_PHASES.FINISHED ? (
            <div style={styles.gameStatus}>Game Finished!</div>
          ) : (
            <div style={styles.turnInfo}>
              {state.isMyTurn ? (
                <div style={styles.yourTurn}>Your Turn</div>
              ) : (
                <div style={styles.otherTurn}>
                  {currentPlayerInfo ? `${currentPlayerInfo.name}'s Turn` : 'Waiting...'}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={styles.gameActions}>
          <button 
            onClick={actions.leaveRoom}
            style={styles.leaveButton}
          >
            Leave Game
          </button>
        </div>
      </div>

      {/* Players Panel */}
      <div style={styles.playersPanel}>
        {state.roomPlayers.map((player, index) => (
          <div 
            key={player.id} 
            style={{
              ...styles.playerCard,
              ...(player.id === state.currentPlayer ? styles.activePlayer : {}),
              ...(player.id === state.playerId ? styles.currentUser : {})
            }}
          >
            <div 
              style={{
                ...styles.playerAvatar,
                backgroundColor: getPlayerColor(player.id)
              }}
            >
              {player.name.charAt(0).toUpperCase()}
            </div>
            <div style={styles.playerInfo}>
              <div style={styles.playerName}>
                {player.name}
                {player.id === state.playerId && ' (You)'}
              </div>
              <div style={styles.playerScore}>
                Score: {state.gameState?.scores?.[player.id] || 0}
              </div>
              <div style={styles.playerMeeples}>
                Meeples: {7} {/* TODO: Get actual meeple count */}
              </div>
            </div>
            {player.id === state.currentPlayer && (
              <div style={styles.turnIndicator}>⏰</div>
            )}
          </div>
        ))}
      </div>

      {/* Current Tile Display */}
      {state.isMyTurn && state.currentTile && !state.meeplePlacementMode && (
        <div style={styles.currentTilePanel}>
          <div style={styles.currentTileInfo}>
            <h3>Current Tile: {state.currentTile}</h3>
            <p>Click on a highlighted position to place this tile</p>
            {state.selectedPosition && (
              <p>Click the tile again to rotate it, then click the checkmark to confirm</p>
            )}
          </div>
        </div>
      )}

      {/* Meeple Placement Instructions */}
      {state.isMyTurn && state.meeplePlacementMode && (
        <div style={styles.meepleInstructions}>
          <h3>Place a Meeple (Optional)</h3>
          <p>Click on a white spot to place a meeple, or click the checkmark to skip</p>
        </div>
      )}

      {/* Game Board */}
      <Board 
        gameState={state.gameState}
        possiblePlacements={state.isMyTurn && !state.meeplePlacementMode ? state.validPlacements : []}
        onEmptyTileClick={handleEmptyTileClick}
        onSelectedTileClick={handleSelectedTileClick}
        selectedPosition={state.selectedPosition}
        currentRotation={state.currentRotation}
        currentTile={state.currentTile}
        onConfirmPlacement={handleConfirmPlacement}
        meeplePlacementMode={state.meeplePlacementMode}
        meeplePlacementTile={state.meeplePlacementMode ? state.selectedPosition : null}
        selectedMeepleSpot={state.selectedMeepleSpot}
        onMeepleSpotClick={handleMeepleSpotClick}
        onMeepleConfirm={handleMeepleConfirm}
        onMeepleCancel={handleMeepleCancel}
      />
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 60px)',
    backgroundColor: '#f5f5f5'
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 'calc(100vh - 60px)',
    backgroundColor: '#f5f5f5'
  },
  loadingCard: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '8px',
    textAlign: 'center',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  gameHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px 20px',
    backgroundColor: 'white',
    borderBottom: '1px solid #e0e0e0'
  },
  gameInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
  },
  gameTitle: {
    margin: 0,
    color: '#333',
    fontSize: '20px'
  },
  gameStatus: {
    padding: '6px 12px',
    backgroundColor: '#4CAF50',
    color: 'white',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  turnInfo: {
    display: 'flex',
    alignItems: 'center'
  },
  yourTurn: {
    padding: '6px 12px',
    backgroundColor: '#4CAF50',
    color: 'white',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: 'bold',
    animation: 'pulse 2s infinite'
  },
  otherTurn: {
    padding: '6px 12px',
    backgroundColor: '#FF9800',
    color: 'white',
    borderRadius: '4px',
    fontSize: '14px'
  },
  gameActions: {
    display: 'flex',
    gap: '10px'
  },
  leaveButton: {
    padding: '8px 16px',
    backgroundColor: '#F44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  playersPanel: {
    display: 'flex',
    gap: '10px',
    padding: '15px 20px',
    backgroundColor: 'white',
    borderBottom: '1px solid #e0e0e0',
    overflowX: 'auto'
  },
  playerCard: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '2px solid transparent',
    minWidth: '200px'
  },
  activePlayer: {
    border: '2px solid #4CAF50',
    backgroundColor: '#e8f5e8'
  },
  currentUser: {
    border: '2px solid #2196F3',
    backgroundColor: '#e3f2fd'
  },
  playerAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '16px',
    fontWeight: 'bold',
    marginRight: '12px'
  },
  playerInfo: {
    flex: 1
  },
  playerName: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '2px'
  },
  playerScore: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '2px'
  },
  playerMeeples: {
    fontSize: '12px',
    color: '#666'
  },
  turnIndicator: {
    fontSize: '20px',
    marginLeft: '10px'
  },
  currentTilePanel: {
    padding: '15px 20px',
    backgroundColor: '#e3f2fd',
    borderBottom: '1px solid #e0e0e0'
  },
  currentTileInfo: {
    textAlign: 'center'
  },
  meepleInstructions: {
    padding: '15px 20px',
    backgroundColor: '#fff3e0',
    borderBottom: '1px solid #e0e0e0',
    textAlign: 'center'
  }
};

export default Game;
