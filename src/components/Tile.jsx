import React from 'react';
import PropTypes from 'prop-types';

const Tile = ({ type, rotation = 0, x, y, isHighlighted, onClick, meeple, scale = 1 }) => {
  const tileSize = 100 * scale;
  
  const tileStyle = {
    width: `${tileSize}px`,
    height: `${tileSize}px`,
    backgroundImage: type === 'Empty' ? 'url(/Empty.png)' : `url(/base_game/${type}.png)`,
    backgroundSize: 'cover',
    transform: `rotate(${rotation * 90}deg)`,
    position: 'absolute',
    left: `${x}px`,
    top: `${y}px`,
    cursor: onClick ? 'pointer' : 'default',
    border: isHighlighted ? `${2 * scale}px solid yellow` : 'none',
    boxSizing: 'border-box',
    zIndex: 1
  };

  const meepleStyle = meeple ? {
    width: `${30 * scale}px`,
    height: `${30 * scale}px`,
    backgroundImage: `url(/meeples/${meeple.playerId}.png)`,
    backgroundSize: 'cover',
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 2
  } : null;

  const handleTouchStart = (e) => {
    e.preventDefault(); // Prevent default touch behavior
    if (onClick) {
      onClick();
    }
  };

  return (
    <div 
      style={tileStyle} 
      onClick={onClick}
      onTouchStart={handleTouchStart}
      data-testid={`tile-${type}-${x}-${y}`}
    >
      {meeple && <div style={meepleStyle} />}
    </div>
  );
};

Tile.propTypes = {
  type: PropTypes.string.isRequired,
  rotation: PropTypes.number,
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  isHighlighted: PropTypes.bool,
  onClick: PropTypes.func,
  meeple: PropTypes.shape({
    type: PropTypes.string.isRequired,
    playerId: PropTypes.number.isRequired
  }),
  scale: PropTypes.number
};

export default Tile;
