// Game lobby component for waiting room before game starts
import React from 'react';
import { useGame } from '../contexts/GameContext.jsx';

const GameLobby = () => {
  const { state, actions } = useGame();

  const handleAddBot = () => {
    const botNumber = state.roomPlayers.filter(p => p.isBot).length + 1;
    actions.addBot(`Bot ${botNumber}`, 'medium');
  };

  const handleLeaveRoom = () => {
    actions.leaveRoom();
  };

  const isRoomCreator = () => {
    // Assume first player is room creator for now
    return state.roomPlayers.length > 0 && state.roomPlayers[0].id === state.playerId;
  };

  const canStartGame = () => {
    return state.roomPlayers.length >= 2 && isRoomCreator();
  };

  const canAddBot = () => {
    return state.roomPlayers.length < 5 && isRoomCreator();
  };

  const getPlayerColor = (playerId) => {
    const colors = ['#FF5722', '#2196F3', '#4CAF50', '#FF9800', '#9C27B0'];
    const playerIndex = state.roomPlayers.findIndex(p => p.id === playerId);
    return colors[playerIndex % colors.length];
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Waiting for Players</h1>
        <button onClick={handleLeaveRoom} style={styles.leaveButton}>
          Leave Room
        </button>
      </div>

      <div style={styles.content}>
        <div style={styles.playersSection}>
          <h2 style={styles.sectionTitle}>
            Players ({state.roomPlayers.length}/5)
          </h2>
          
          <div style={styles.playersList}>
            {state.roomPlayers.map((player, index) => (
              <div key={player.id} style={styles.playerCard}>
                <div 
                  style={{
                    ...styles.playerAvatar,
                    backgroundColor: getPlayerColor(player.id)
                  }}
                >
                  {player.name ? player.name.charAt(0).toUpperCase() : '?'}
                </div>
                <div style={styles.playerInfo}>
                  <div style={styles.playerName}>
                    {player.name || 'Unknown Player'}
                    {player.id === state.playerId && ' (You)'}
                    {index === 0 && ' (Host)'}
                  </div>
                  <div style={styles.playerType}>
                    {player.isBot ? 'AI Player' : 'Human Player'}
                  </div>
                  <div style={styles.playerStatus}>
                    {player.isReady ? '✓ Ready' : '⏳ Waiting'}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Empty slots */}
            {Array.from({ length: 5 - state.roomPlayers.length }, (_, index) => (
              <div key={`empty-${index}`} style={styles.emptySlot}>
                <div style={styles.emptyAvatar}>?</div>
                <div style={styles.emptyText}>Waiting for player...</div>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.actionsSection}>
          {isRoomCreator() && (
            <div style={styles.hostActions}>
              <h3 style={styles.hostTitle}>Host Actions</h3>
              
              <button
                onClick={handleAddBot}
                disabled={!canAddBot()}
                style={{
                  ...styles.addBotButton,
                  ...(canAddBot() ? {} : styles.disabledButton)
                }}
              >
                Add Bot Player
              </button>

              <button
                onClick={() => {/* TODO: Start game */}}
                disabled={!canStartGame()}
                style={{
                  ...styles.startGameButton,
                  ...(canStartGame() ? {} : styles.disabledButton)
                }}
              >
                Start Game
              </button>

              <div style={styles.gameInfo}>
                <p style={styles.infoText}>
                  • Minimum 2 players required to start
                </p>
                <p style={styles.infoText}>
                  • You can add AI players to fill empty slots
                </p>
                <p style={styles.infoText}>
                  • Game will start immediately when you click "Start Game"
                </p>
              </div>
            </div>
          )}

          {!isRoomCreator() && (
            <div style={styles.waitingMessage}>
              <h3 style={styles.waitingTitle}>Waiting for Host</h3>
              <p style={styles.waitingText}>
                The host will start the game when ready.
              </p>
              <div style={styles.readyIndicator}>
                <div style={styles.readyDot} />
                <span>You are ready to play!</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={styles.gameRules}>
        <h3 style={styles.rulesTitle}>Game Rules</h3>
        <div style={styles.rulesContent}>
          <div style={styles.ruleItem}>
            <strong>Objective:</strong> Score the most points by placing tiles and meeples strategically
          </div>
          <div style={styles.ruleItem}>
            <strong>Turns:</strong> Players take turns placing tiles and optionally placing meeples
          </div>
          <div style={styles.ruleItem}>
            <strong>Scoring:</strong> Points are earned when roads, cities, and monasteries are completed
          </div>
          <div style={styles.ruleItem}>
            <strong>Meeples:</strong> Each player has 7 meeples to place on features (roads, cities, fields, monasteries)
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '900px',
    margin: '0 auto',
    minHeight: 'calc(100vh - 60px)',
    backgroundColor: '#f5f5f5'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  title: {
    color: '#333',
    margin: 0,
    fontSize: '24px'
  },
  leaveButton: {
    padding: '8px 16px',
    backgroundColor: '#F44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  content: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '30px',
    marginBottom: '30px'
  },
  playersSection: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  sectionTitle: {
    color: '#333',
    marginBottom: '20px',
    fontSize: '18px'
  },
  playersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  playerCard: {
    display: 'flex',
    alignItems: 'center',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '2px solid #e9ecef'
  },
  playerAvatar: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '20px',
    fontWeight: 'bold',
    marginRight: '15px'
  },
  playerInfo: {
    flex: 1
  },
  playerName: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '4px'
  },
  playerType: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '4px'
  },
  playerStatus: {
    fontSize: '14px',
    color: '#4CAF50',
    fontWeight: 'bold'
  },
  emptySlot: {
    display: 'flex',
    alignItems: 'center',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '2px dashed #dee2e6'
  },
  emptyAvatar: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dee2e6',
    color: '#6c757d',
    fontSize: '20px',
    marginRight: '15px'
  },
  emptyText: {
    color: '#6c757d',
    fontStyle: 'italic'
  },
  actionsSection: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    height: 'fit-content'
  },
  hostActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  hostTitle: {
    color: '#333',
    margin: '0 0 10px 0',
    fontSize: '18px'
  },
  addBotButton: {
    padding: '12px 20px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  startGameButton: {
    padding: '15px 25px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  disabledButton: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed'
  },
  gameInfo: {
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    borderLeft: '4px solid #2196F3'
  },
  infoText: {
    margin: '5px 0',
    fontSize: '14px',
    color: '#666'
  },
  waitingMessage: {
    textAlign: 'center'
  },
  waitingTitle: {
    color: '#333',
    marginBottom: '15px'
  },
  waitingText: {
    color: '#666',
    marginBottom: '20px'
  },
  readyIndicator: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    color: '#4CAF50',
    fontSize: '14px'
  },
  readyDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#4CAF50',
    animation: 'pulse 2s infinite'
  },
  gameRules: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  rulesTitle: {
    color: '#333',
    marginBottom: '15px',
    fontSize: '18px'
  },
  rulesContent: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '15px'
  },
  ruleItem: {
    padding: '12px',
    backgroundColor: '#f8f9fa',
    borderRadius: '4px',
    fontSize: '14px',
    color: '#333'
  }
};

export default GameLobby;
