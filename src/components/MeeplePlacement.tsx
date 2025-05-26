import React from 'react';
import { MEEPLE_TYPES, MeepleType } from '../types'; // Corrected import path

interface MeeplePlacementProps {
  onMeeplePlaced: (meepleType: MeepleType) => void;
  onSkip: () => void;
  availableTypes?: MeepleType[]; // Optional: for scenarios where not all meeple types are placeable
}

const MeeplePlacement: React.FC<MeeplePlacementProps> = ({
  onMeeplePlaced,
  onSkip,
  availableTypes,
}) => {
  const buttonStyle: React.CSSProperties = {
    padding: '10px 15px',
    margin: '5px',
    borderRadius: '5px',
    border: 'none',
    // backgroundColor: '#4a6c6f', // Will be set by getMeepleTypeColor
    color: 'white',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'background-color 0.3s',
    minWidth: '100px', // Ensure buttons have a decent size
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '15px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // Slightly more opaque
    borderRadius: '10px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    margin: '20px 0',
    textAlign: 'center',
  };

  const headerStyle: React.CSSProperties = {
    marginBottom: '15px',
    color: '#333',
    fontSize: '1.2rem',
  };

  const buttonsContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
  };

  // Filter available meeple types
  // Use Object.values(MEEPLE_TYPES) to get the enum values
  const meepleTypesToDisplay = (Object.values(MEEPLE_TYPES) as MeepleType[]).filter(type =>
    !availableTypes || availableTypes.includes(type)
  );

  // Helper function to format meeple type for display
  const formatMeepleType = (type: MeepleType): string => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Helper function to get color for meeple type
  const getMeepleTypeColor = (type: MeepleType): string => {
    switch (type) {
      case MEEPLE_TYPES.ROAD:
        return '#8B4513'; // Brown
      case MEEPLE_TYPES.CITY:
        return '#4A6C6F'; // Teal (original was similar)
      case MEEPLE_TYPES.MONASTERY:
        return '#800080'; // Purple
      case MEEPLE_TYPES.FIELD:
        return '#228B22'; // Forest Green
      default:
        return '#6c757d'; // Default grey
    }
  };
  
  const handleButtonClick = (type: MeepleType) => (_e: React.MouseEvent<HTMLButtonElement>) => {
    onMeeplePlaced(type);
  };

  const handleButtonTouch = (type: MeepleType) => (e: React.TouchEvent<HTMLButtonElement>) => {
    e.preventDefault();
    onMeeplePlaced(type);
  };
  
  const handleSkipClick = (_e: React.MouseEvent<HTMLButtonElement>) => {
    onSkip();
  };

  const handleSkipTouch = (e: React.TouchEvent<HTMLButtonElement>) => {
    e.preventDefault();
    onSkip();
  };


  return (
    <div style={containerStyle} data-testid="meeple-placement-module">
      <h3 style={headerStyle}>Place a Meeple?</h3>
      <div style={buttonsContainerStyle}>
        {meepleTypesToDisplay.map(type => (
          <button
            key={type}
            style={{
              ...buttonStyle,
              backgroundColor: getMeepleTypeColor(type),
            }}
            onClick={handleButtonClick(type)}
            onTouchStart={handleButtonTouch(type)}
            data-testid={`meeple-button-${type}`}
          >
            {formatMeepleType(type)}
          </button>
        ))}
        <button
          style={{
            ...buttonStyle,
            backgroundColor: '#999', // Skip button color
          }}
          onClick={handleSkipClick}
          onTouchStart={handleSkipTouch}
          data-testid="skip-meeple-button"
        >
          Skip
        </button>
      </div>
    </div>
  );
};

export default MeeplePlacement;
