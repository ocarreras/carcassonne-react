import React from 'react';
import { GameProvider, useGame } from './contexts/GameContext.jsx';
import { GAME_PHASES } from './utils/messageTypes.js';
import NavBar from './components/NavBar.jsx';
import RoomLobby from './components/RoomLobby.jsx';
import GameLobby from './components/GameLobby.jsx';
import Game from './components/Game.jsx';
import './App.css';

// Main app content component
function AppContent() {
  const { state } = useGame();

  const renderCurrentPhase = () => {
    switch (state.gamePhase) {
      case GAME_PHASES.LOBBY:
        return <RoomLobby />;
      case GAME_PHASES.WAITING:
        return <GameLobby />;
      case GAME_PHASES.PLAYING:
      case GAME_PHASES.FINISHED:
        return <Game />;
      default:
        return <RoomLobby />;
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden'
    }}>
      <NavBar />
      {renderCurrentPhase()}
      
      {/* Toast notifications */}
      {state.toast && (
        <Toast 
          message={state.toast.message} 
          type={state.toast.type}
          onClose={() => {/* Will be handled by auto-dismiss */}}
        />
      )}
      
      {/* Error notifications */}
      {state.error && (
        <ErrorModal 
          error={state.error}
          onClose={() => {/* Will be handled by context */}}
        />
      )}
    </div>
  );
}

// Toast notification component
function Toast({ message, type, onClose }) {
  const { actions } = useGame();

  React.useEffect(() => {
    const timer = setTimeout(() => {
      actions.clearToast();
    }, 3000);

    return () => clearTimeout(timer);
  }, [actions]);

  const getToastStyle = () => {
    const baseStyle = {
      position: 'fixed',
      top: '80px',
      right: '20px',
      padding: '12px 20px',
      borderRadius: '4px',
      color: 'white',
      fontSize: '14px',
      zIndex: 2000,
      maxWidth: '300px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      animation: 'slideInRight 0.3s ease-out'
    };

    switch (type) {
      case 'success':
        return { ...baseStyle, backgroundColor: '#4CAF50' };
      case 'error':
        return { ...baseStyle, backgroundColor: '#F44336' };
      case 'warning':
        return { ...baseStyle, backgroundColor: '#FF9800' };
      default:
        return { ...baseStyle, backgroundColor: '#2196F3' };
    }
  };

  return (
    <div style={getToastStyle()}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>{message}</span>
        <button
          onClick={() => actions.clearToast()}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            marginLeft: '10px',
            fontSize: '16px'
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}

// Error modal component
function ErrorModal({ error, onClose }) {
  const { actions } = useGame();

  const handleClose = () => {
    actions.clearError();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '30px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: '#F44336',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '12px',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            !
          </div>
          <h2 style={{ margin: 0, color: '#333' }}>Error</h2>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <p style={{ margin: '0 0 10px 0', color: '#333' }}>
            {error.message || 'An unexpected error occurred'}
          </p>
          
          {error.code && (
            <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>
              Error Code: {error.code}
            </p>
          )}
          
          {error.details && (
            <details style={{ marginTop: '10px' }}>
              <summary style={{ cursor: 'pointer', color: '#666' }}>
                Technical Details
              </summary>
              <pre style={{
                marginTop: '10px',
                padding: '10px',
                backgroundColor: '#f5f5f5',
                borderRadius: '4px',
                fontSize: '12px',
                overflow: 'auto'
              }}>
                {JSON.stringify(error.details, null, 2)}
              </pre>
            </details>
          )}
        </div>
        
        <div style={{ textAlign: 'right' }}>
          <button
            onClick={handleClose}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

// Main App component with provider
function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}

export default App;
