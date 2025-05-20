import React from 'react';
import PropTypes from 'prop-types';
import { MEEPLE_TYPES } from '../utils/gameLogic';

const MeeplePlacement = ({ onMeeplePlaced, onSkip, availableTypes }) => {
  const buttonStyle = {
    padding: '10px 15px',
    margin: '5px',
    borderRadius: '5px',
    border: 'none',
    backgroundColor: '#4a6c6f',
    color: 'white',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'background-color 0.3s'
  };

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '15px',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: '10px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    margin: '20px 0'
  };

  const headerStyle = {
    marginBottom: '15px',
    color: '#333',
    fontSize: '1.2rem'
  };

  const buttonsContainerStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center'
  };

  // Filter available meeple types
  const meepleTypes = Object.values(MEEPLE_TYPES).filter(type => 
    !availableTypes || availableTypes.includes(type)
  );

  return (
    <div style={containerStyle}>
      <h3 style={headerStyle}>Place a meeple?</h3>
      <div style={buttonsContainerStyle}>
        {meepleTypes.map(type => (
          <button
            key={type}
            style={{
              ...buttonStyle,
              backgroundColor: getMeepleTypeColor(type)
            }}
            onClick={() => onMeeplePlaced(type)}
          >
            {formatMeepleType(type)}
          </button>
        ))}
        <button 
          style={{
            ...buttonStyle,
            backgroundColor: '#999'
          }}
          onClick={onSkip}
        >
          Skip
        </button>
      </div>
    </div>
  );
};

// Helper function to format meeple type for display
const formatMeepleType = (type) => {
  return type.charAt(0).toUpperCase() + type.slice(1);
};

// Helper function to get color for meeple type
const getMeepleTypeColor = (type) => {
  switch (type) {
    case MEEPLE_TYPES.ROAD:
      return '#8B4513'; // Brown
    case MEEPLE_TYPES.CITY:
      return '#4a6c6f'; // Teal
    case MEEPLE_TYPES.MONASTERY:
      return '#800080'; // Purple
    case MEEPLE_TYPES.FIELD:
      return '#228B22'; // Forest Green
    default:
      return '#4a6c6f';
  }
};

MeeplePlacement.propTypes = {
  onMeeplePlaced: PropTypes.func.isRequired,
  onSkip: PropTypes.func.isRequired,
  availableTypes: PropTypes.arrayOf(PropTypes.string)
};

export default MeeplePlacement;
