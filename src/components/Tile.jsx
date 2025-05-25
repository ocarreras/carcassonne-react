import React from "react";
import PropTypes from "prop-types";
import { getMeeplePlacements } from "../utils/gameLogic";

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
  meeplePlacementMode = false,
  selectedMeepleSpot = -1,
  onMeepleSpotClick,
  onMeepleConfirm,
  onMeepleCancel
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

  // Get meeple placements for this tile if in meeple placement mode
  const meeplePlacements = meeplePlacementMode && type !== 'Empty' 
    ? getMeeplePlacements(type, rotation) 
    : [];

  // Render meeple spots
  const renderMeepleSpots = () => {
    if (!meeplePlacementMode || type === 'Empty') return null;

    return meeplePlacements.map((placement, index) => {
      const isSpotSelected = selectedMeepleSpot === index;
      const spotStyle = {
        position: "absolute",
        left: `${50 + placement.column}px`,
        top: `${50 + placement.row}px`,
        width: "20px",
        height: "20px",
        backgroundImage: isSpotSelected 
          ? "url(/meeples/0.png)" 
          : "url(/spot.gif)",
        backgroundSize: "cover",
        cursor: "pointer",
        zIndex: 4,
        transform: "translate(-50%, -50%)"
      };

      return (
        <div
          key={index}
          style={spotStyle}
          onClick={(e) => {
            e.stopPropagation();
            if (onMeepleSpotClick) {
              onMeepleSpotClick(index);
            }
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onMeepleSpotClick) {
              onMeepleSpotClick(index);
            }
          }}
        />
      );
    });
  };

  // Render check/cross buttons for meeple placement
  const renderMeepleButtons = () => {
    if (!meeplePlacementMode || type === 'Empty') return null;

    return (
      <>
        {/* Check button */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            if (onMeepleConfirm) {
              onMeepleConfirm();
            }
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onMeepleConfirm) {
              onMeepleConfirm();
            }
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
            zIndex: 5,
          }}
        />
        {/* Cross button */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            if (onMeepleCancel) {
              onMeepleCancel();
            }
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onMeepleCancel) {
              onMeepleCancel();
            }
          }}
          style={{
            position: "absolute",
            top: "5px",
            right: `${30 * scale}px`,
            width: `${20 * scale}px`,
            height: `${20 * scale}px`,
            backgroundImage: "url(/icon-reject-48.png)",
            backgroundSize: "cover",
            cursor: "pointer",
            zIndex: 5,
          }}
        />
      </>
    );
  };

  // Render existing meeple if placed
  const renderExistingMeeple = () => {
    if (!meeple || meeplePlacementMode) return null;

    const meeplePlacements = getMeeplePlacements(type, rotation);
    const placement = meeplePlacements[meeple.spotIndex];
    
    if (!placement) return null;

    const existingMeepleStyle = {
      position: "absolute",
      left: `${50 + placement.column}px`,
      top: `${50 + placement.row}px`,
      width: "20px",
      height: "20px",
      backgroundImage: `url(/meeples/${meeple.playerId}.png)`,
      backgroundSize: "cover",
      zIndex: 3,
      transform: "translate(-50%, -50%)"
    };

    return <div style={existingMeepleStyle} />;
  };

  return (
    <div style={containerStyle}>
      <div
        style={tileStyle}
        onClick={onClick}
        onTouchStart={handleTouchStart}
        data-testid={`tile-${type}-${x}-${y}`}
      >
        {/* Legacy meeple rendering (centered) */}
        {meeple && !meeplePlacementMode && meeple.spotIndex === undefined && (
          <div style={meepleStyle} />
        )}
      </div>
      
      {/* Render meeple spots for placement */}
      {renderMeepleSpots()}
      
      {/* Render existing meeple at specific spot */}
      {renderExistingMeeple()}
      
      {/* Render meeple placement buttons */}
      {renderMeepleButtons()}
      
      {/* Render tile placement checkmark */}
      {isSelected && type !== "Empty" && !meeplePlacementMode && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            if (onConfirm) {
              onConfirm();
            }
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onConfirm) {
              onConfirm();
            }
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
    type: PropTypes.string,
    playerId: PropTypes.number.isRequired,
    spotIndex: PropTypes.number
  }),
  scale: PropTypes.number,
  isSelected: PropTypes.bool,
  onConfirm: PropTypes.func,
  meeplePlacementMode: PropTypes.bool,
  selectedMeepleSpot: PropTypes.number,
  onMeepleSpotClick: PropTypes.func,
  onMeepleConfirm: PropTypes.func,
  onMeepleCancel: PropTypes.func
};

export default Tile;
