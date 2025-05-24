import React from "react";
import PropTypes from "prop-types";

const Tile = ({
  type,
  rotation = 0,
  x,
  y,
  isHighlighted,
  onClick,
  onConfirm,
  meeple,
  scale = 1,
  isSelected = false,
}) => {
  const tileSize = 100 * scale;

  const containerStyle = {
    position: "absolute",
    left: `${x}px`,
    top: `${y}px`,
    width: `${tileSize}px`,
    height: `${tileSize}px`,
  };

  const tileStyle = {
    width: "100%",
    height: "100%",
    backgroundImage:
      type === "Empty" ? "url(/Empty.png)" : `url(/base_game/${type}.png)`,
    backgroundSize: "cover",
    transform: `rotate(${rotation * 90}deg)`,
    cursor: onClick ? "pointer" : "default",
    border: isHighlighted ? `${2 * scale}px solid yellow` : "none",
    boxSizing: "border-box",
    zIndex: 1,
  };

  const meepleStyle = meeple
    ? {
        width: `${30 * scale}px`,
        height: `${30 * scale}px`,
        backgroundImage: `url(/meeples/${meeple.playerId}.png)`,
        backgroundSize: "cover",
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 2,
      }
    : null;

  const handleTouchStart = (e) => {
    e.preventDefault(); // Prevent default touch behavior
    if (onClick) {
      onClick();
    }
  };

  return (
    <div style={containerStyle}>
      <div
        style={tileStyle}
        onClick={onClick}
        onTouchStart={handleTouchStart}
        data-testid={`tile-${type}-${x}-${y}`}
      >
        {meeple && <div style={meepleStyle} />}
      </div>
      {isSelected && type !== "Empty" && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onConfirm();
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onConfirm();
          }}
          style={{
            position: "absolute",
            top: "5px",
            right: "5px",
            width: `${20 * scale}px`,
            height: `${20 * scale}px`,
            backgroundImage: "url(/icon-accept-48.png)",
            backgroundSize: "cover",
            cursor: "pointer",
            zIndex: 3,
          }}
        />
      )}
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
    playerId: PropTypes.number.isRequired,
  }),
  scale: PropTypes.number,
  isSelected: PropTypes.bool,
  onConfirm: PropTypes.func,
};

export default Tile;
