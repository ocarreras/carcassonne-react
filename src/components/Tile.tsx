import React from "react";
import { PlacedTile, Rotation } from "../types"; // Corrected import path

// Props for the Tile component
interface TileProps {
  tileData: PlacedTile | { type: 'Empty'; x: number; y: number; rotation?: Rotation; meeple?: null }; // Can be a placed tile or an empty slot representation
  isHighlighted?: boolean;
  onClick?: () => void;
  onConfirm?: () => void; // For confirming placement
  scale?: number;
  isSelected?: boolean; // If the tile is the currently selected one to be placed
  // x and y are part of tileData, no need to pass them separately if using PlacedTile
  // type, rotation, meeple are also part of tileData
}

const Tile: React.FC<TileProps> = ({
  tileData,
  isHighlighted = false,
  onClick,
  onConfirm,
  scale = 1,
  isSelected = false,
}) => {
  const tileSize = 100 * scale;

  // Extract properties from tileData
  const { type, x, y, rotation = 0 } = tileData; // Removed meeple from destructuring

  const containerStyle: React.CSSProperties = {
    position: "absolute",
    left: `${x * (tileSize / (scale === 0.5 ? 2:1))}px`, // Adjust positioning based on scale for board view vs current tile view
    top: `${y * (tileSize / (scale === 0.5 ? 2:1))}px`,
    width: `${tileSize}px`,
    height: `${tileSize}px`,
  };

  const tileStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    backgroundImage:
      type === "Empty" ? "url(/Empty.png)" : `url(/base_game/${type}.png)`,
    backgroundSize: "cover",
    transform: `rotate(${rotation * 90}deg)`,
    cursor: onClick ? "pointer" : "default",
    border: isHighlighted ? `${Math.max(1, 2 * scale)}px solid yellow` : "none", // Ensure border is visible at small scales
    boxSizing: "border-box",
    zIndex: 1,
  };

  const meepleActual = tileData.meeple; // Use meeple from tileData directly

  const meepleStyle: React.CSSProperties | undefined = meepleActual
    ? {
        width: `${30 * scale}px`,
        height: `${30 * scale}px`,
        backgroundImage: `url(/meeples/${meepleActual.playerId}.png)`, // Assuming playerId is number, adjust if string
        backgroundSize: "cover",
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 2,
      }
    : undefined;

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault(); // Prevent default touch behavior
    if (onClick) {
      onClick();
    }
  };

  const handleConfirmClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (onConfirm) {
        onConfirm();
    }
  };
  
  const handleConfirmTouch = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onConfirm) {
        onConfirm();
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
        {meepleActual && <div style={meepleStyle} />}
      </div>
      {isSelected && type !== "Empty" && onConfirm && (
        <div
          onClick={handleConfirmClick}
          onTouchStart={handleConfirmTouch}
          style={{
            position: "absolute",
            top: `${5 * scale}px`,
            right: `${5 * scale}px`,
            width: `${Math.max(15, 20 * scale)}px`, // Ensure visible at small scale
            height: `${Math.max(15, 20 * scale)}px`,
            backgroundImage: "url(/icon-accept-48.png)",
            backgroundSize: "cover",
            cursor: "pointer",
            zIndex: 3,
            borderRadius: "50%" // Make it round
          }}
          data-testid="confirm-placement-button"
        />
      )}
    </div>
  );
};

export default Tile;
