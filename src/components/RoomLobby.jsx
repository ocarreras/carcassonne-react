// Room lobby component for listing and managing game rooms
import React, { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext.jsx';
import { CONNECTION_STATES } from '../utils/messageTypes.js';

const RoomLobby = () => {
  const { state, actions } = useGame();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [playerName, setPlayerName] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  // Auto-connect when component mounts
  useEffect(() => {
    if (state.connectionState === CONNECTION_STATES.DISCONNECTED && !isConnecting) {
      handleConnect();
    }
  }, []);

  // Refresh rooms list when connected
  useEffect(() => {
    if (state.connectionState === CONNECTION_STATES.CONNECTED) {
      actions.listRooms();
    }
  }, [state.connectionState]);

  const handleConnect = async () => {
    if (!playerName.trim()) {
      setPlayerName('Player' + Math.floor(Math.random() * 1000));
    }
    
    setIsConnecting(true);
    const playerId = 'player-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    try {
      await actions.connect(playerId, playerName || 'Player' + Math.floor(Math.random() * 1000), 'red');
    } catch (error) {
      console.error('Connection failed:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleCreateRoom = () => {
    if (roomName.trim()) {
      actions.createRoom(roomName.trim(), maxPlayers);
      setShowCreateModal(false);
      setRoomName('');
    }
  };

  const handleJoinRoom = (roomId) => {
    console.log('Attempting to join room with ID:', roomId); // Debug log
    actions.joinRoom(roomId);
  };

  // Helper function to get room ID from different possible property names
  const getRoomId = (room) => {
    return room.id || room.roomId || room.RoomID || room.ID || '';
  };

  // Helper function to get room name with fallback
  const getRoomName = (room) => {
    return room.name || room.roomName || room.RoomName || 'Unnamed Room';
  };

  // Helper function to get player count with fallback
  const getPlayerCount = (room) => {
    return room.playerCount || room.currentPlayers || room.players?.length || 0;
  };

  // Helper function to get max players with fallback
  const getMaxPlayers = (room) => {
    return room.maxPlayers || room.MaxPlayers || 4;
  };

  // Helper function to get created by with fallback
  const getCreatedBy = (room) => {
    return room.createdBy || room.creator || room.host || 'Unknown';
  };

  // Helper function to check if game started
  const isGameStarted = (room) => {
    return room.gameStarted || room.status === 'playing' || room.status === 'in_progress';
  };

  const getConnectionStatusText = () => {
    switch (state.connectionState) {
      case CONNECTION_STATES.CONNECTING:
        return 'Connecting...';
      case CONNECTION_STATES.CONNECTED:
        return 'Connected';
      case CONNECTION_STATES.RECONNECTING:
        return 'Reconnecting...';
      case CONNECTION_STATES.FAILED:
        return 'Connection Failed';
      default:
        return 'Disconnected';
    }
  };

  const getConnectionStatusColor = () => {
    switch (state.connectionState) {
      case CONNECTION_STATES.CONNECTED:
        return '#4CAF50';
      case CONNECTION_STATES.CONNECTING:
      case CONNECTION_STATES.RECONNECTING:
        return '#FF9800';
      case CONNECTION_STATES.FAILED:
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  // Debug log for rooms
  useEffect(() => {
    if (state.rooms.length > 0) {
      console.log('Current rooms data:', state.rooms);
      state.rooms.forEach((room, index) => {
        console.log(`Room ${index}:`, room);
        console.log(`Room ${index} ID:`, getRoomId(room));
        console.log(`Room ${index} Name:`, getRoomName(room));
      });
    }
  }, [state.rooms]);

  // Show connection screen if not connected
  if (state.connectionState !== CONNECTION_STATES.CONNECTED) {
    return (
      <div style={styles.container}>
        <div style={styles.connectionCard}>
          <h1 style={styles.title}>Carcassonne Multiplayer</h1>
          
          <div style={styles.statusIndicator}>
            <div 
              style={{
                ...styles.statusDot,
                backgroundColor: getConnectionStatusColor()
              }}
            />
            <span style={styles.statusText}>{getConnectionStatusText()}</span>
          </div>

          {state.connectionState === CONNECTION_STATES.DISCONNECTED && (
            <div style={styles.connectForm}>
              <input
                type="text"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                style={styles.input}
                onKeyPress={(e) => e.key === 'Enter' && handleConnect()}
              />
              <button 
                onClick={handleConnect}
                disabled={isConnecting}
                style={styles.connectButton}
              >
                {isConnecting ? 'Connecting...' : 'Connect to Game'}
              </button>
            </div>
          )}

          {state.connectionState === CONNECTION_STATES.FAILED && (
            <div style={styles.errorMessage}>
              <p>Failed to connect to the game server.</p>
              <p>Please check that the server is running on localhost:8080</p>
              <button onClick={handleConnect} style={styles.retryButton}>
                Retry Connection
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Game Rooms</h1>
        <div style={styles.headerActions}>
          <span style={styles.playerInfo}>Welcome, {state.playerName}!</span>
          <button 
            onClick={() => setShowCreateModal(true)}
            style={styles.createButton}
          >
            Create Room
          </button>
          <button 
            onClick={actions.listRooms}
            style={styles.refreshButton}
          >
            Refresh
          </button>
        </div>
      </div>

      <div style={styles.roomsList}>
        {state.rooms.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No active rooms found.</p>
            <p>Create a new room to start playing!</p>
          </div>
        ) : (
          state.rooms.map((room, index) => {
            const roomId = getRoomId(room);
            const roomName = getRoomName(room);
            const playerCount = getPlayerCount(room);
            const maxPlayers = getMaxPlayers(room);
            const createdBy = getCreatedBy(room);
            const gameStarted = isGameStarted(room);
            
            return (
              <div key={roomId || index} style={styles.roomCard}>
                <div style={styles.roomInfo}>
                  <h3 style={styles.roomName}>{roomName}</h3>
                  <p style={styles.roomDetails}>
                    Players: {playerCount}/{maxPlayers}
                  </p>
                  <p style={styles.roomDetails}>
                    Created by: {createdBy}
                  </p>
                  <p style={styles.roomStatus}>
                    Status: {gameStarted ? 'In Progress' : 'Waiting'}
                  </p>
                  {/* Debug info */}
                  <p style={styles.debugInfo}>
                    Room ID: {roomId || 'undefined'}
                  </p>
                </div>
                <div style={styles.roomActions}>
                  <button
                    onClick={() => handleJoinRoom(roomId)}
                    disabled={playerCount >= maxPlayers || gameStarted || !roomId}
                    style={{
                      ...styles.joinButton,
                      ...(playerCount >= maxPlayers || gameStarted || !roomId
                        ? styles.disabledButton : {})
                    }}
                  >
                    {!roomId ? 'No ID' :
                     gameStarted ? 'In Progress' : 
                     playerCount >= maxPlayers ? 'Full' : 'Join'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>Create New Room</h2>
            <div style={styles.modalContent}>
              <input
                type="text"
                placeholder="Room name"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                style={styles.input}
                autoFocus
              />
              <div style={styles.playerCountSelector}>
                <label style={styles.label}>Max Players:</label>
                <select
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                  style={styles.select}
                >
                  <option value={2}>2 Players</option>
                  <option value={3}>3 Players</option>
                  <option value={4}>4 Players</option>
                  <option value={5}>5 Players</option>
                </select>
              </div>
            </div>
            <div style={styles.modalActions}>
              <button
                onClick={() => setShowCreateModal(false)}
                style={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRoom}
                disabled={!roomName.trim()}
                style={{
                  ...styles.createButton,
                  ...(roomName.trim() ? {} : styles.disabledButton)
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '800px',
    margin: '0 auto',
    minHeight: 'calc(100vh - 60px)',
    backgroundColor: '#f5f5f5'
  },
  connectionCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '40px',
    textAlign: 'center',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    maxWidth: '400px',
    margin: '100px auto'
  },
  title: {
    color: '#333',
    marginBottom: '20px',
    fontSize: '24px'
  },
  statusIndicator: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px'
  },
  statusDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    marginRight: '8px'
  },
  statusText: {
    fontSize: '16px',
    color: '#666'
  },
  connectForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  input: {
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px'
  },
  connectButton: {
    padding: '12px 24px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    cursor: 'pointer'
  },
  errorMessage: {
    color: '#F44336',
    textAlign: 'center'
  },
  retryButton: {
    padding: '8px 16px',
    backgroundColor: '#FF9800',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '10px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  playerInfo: {
    color: '#666',
    fontSize: '14px'
  },
  createButton: {
    padding: '8px 16px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  refreshButton: {
    padding: '8px 16px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  roomsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    backgroundColor: 'white',
    borderRadius: '8px',
    color: '#666'
  },
  roomCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  roomInfo: {
    flex: 1
  },
  roomName: {
    margin: '0 0 8px 0',
    color: '#333',
    fontSize: '18px'
  },
  roomDetails: {
    margin: '4px 0',
    color: '#666',
    fontSize: '14px'
  },
  roomStatus: {
    margin: '4px 0',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  debugInfo: {
    margin: '4px 0',
    color: '#999',
    fontSize: '12px',
    fontStyle: 'italic'
  },
  roomActions: {
    marginLeft: '20px'
  },
  joinButton: {
    padding: '8px 16px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  disabledButton: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '30px',
    minWidth: '400px',
    maxWidth: '500px'
  },
  modalTitle: {
    margin: '0 0 20px 0',
    color: '#333'
  },
  modalContent: {
    marginBottom: '20px'
  },
  playerCountSelector: {
    marginTop: '15px'
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    color: '#333',
    fontSize: '14px'
  },
  select: {
    width: '100%',
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px'
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px'
  },
  cancelButton: {
    padding: '8px 16px',
    backgroundColor: '#ccc',
    color: '#333',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  }
};

export default RoomLobby;
