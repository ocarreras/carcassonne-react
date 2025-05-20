import React from 'react';
import PropTypes from 'prop-types';

const Tile = ({ type, rotation = 0, x, y, isHighlighted, onClick, meeple }) => {
  const tileStyle = {
    width: '100px',
    height: '100px',
    backgroundImage: `url(/base_game/${type}.png)`,
    backgroundSize: 'cover',
    transform: `rotate(${rotation * 90}deg)`,
    position: 'absolute',
    left: `${x * 100}px`,
    top: `${y * 100}px`,
    cursor: onClick ? 'pointer' : 'default',
    border: isHighlighted ? '2px solid yellow' : 'none',
    boxSizing: 'border-box',
    zIndex: 1
  };

  const meepleStyle = meeple ? {
    width: '30px',
    height: '30px',
    backgroundImage: `url(/meeples/${meeple.playerId}.png)`,
    backgroundSize: 'cover',
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 2
  } : null;

  return (
    <div 
      style={tileStyle} 
      onClick={onClick}
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
  })
};

export default Tile;
