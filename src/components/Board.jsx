import React, { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Tile from './Tile';

const Board = ({ gameState, possiblePlacements, onTilePlaced, currentTile }) => {
  const { board, center } = gameState;
  const boardRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  

  // Initialize viewport size and center the first tile
  useEffect(() => {
    if (boardRef.current) {
      const { clientWidth, clientHeight } = boardRef.current.parentElement;
      setViewportSize({ width: clientWidth, height: clientHeight });
      
      // Center the first tile
      setPosition({
        x: clientWidth / 2 - 50, // 50 is half the tile width
        y: clientHeight / 2 - 50 // 50 is half the tile height
      });
    }
  }, []);

  // Handle mouse down for dragging
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  // Handle mouse move for dragging
  const handleMouseMove = (e) => {
    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      
      setPosition({
        x: position.x + dx,
        y: position.y + dy
      });
      
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  // Handle mouse up to stop dragging
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle mouse wheel for zooming
  const handleWheel = (e) => {
    e.preventDefault();
    
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newScale = Math.max(0.5, Math.min(3, scale * zoomFactor));
    
    // Calculate zoom center (mouse position)
    const rect = boardRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Calculate new position to zoom towards mouse
    const newPosition = {
      x: mouseX - (mouseX - position.x) * (newScale / scale),
      y: mouseY - (mouseY - position.y) * (newScale / scale)
    };
    
    setScale(newScale);
    setPosition(newPosition);
  };

  // Handle tile click
  const handleTileClick = (x, y, rotation) => {
    // Convert screen coordinates to board coordinates
    onTilePlaced(x, y, rotation);
  };

  // Render tiles
  const renderTiles = () => {
    if (!board) return null;

    const tiles = [];

    for (let y = 0; y < board.length; y++) {
      for (let x = 0; x < board[y].length; x++) {
        const tile = board[y][x];
        if (tile) {
          // Calculate position based on center, scale, and position
          const tileX = ((x - center) * 100 * scale) + position.x;
          const tileY = ((y - center) * 100 * scale) + position.y;
          
          tiles.push(
            <Tile
              key={`${x}-${y}`}
              type={tile.type}
              rotation={tile.rotation || 0}
              x={tileX / scale}
              y={tileY / scale}
              meeple={tile.meeple}
              scale={scale}
            />
          );
        }
      }
    }

    // Render possible placements for the current tile
    if (possiblePlacements && currentTile) {
      possiblePlacements.forEach(({ x, y, rotation }) => {
        // Calculate position based on center, scale, and position
        const tileX = ((x - center) * 100 * scale) + position.x;
        const tileY = ((y - center) * 100 * scale) + position.y;
        
        tiles.push(
          <Tile
            key={`placement-${x}-${y}-${rotation}`}
            type={currentTile}
            rotation={rotation}
            x={tileX / scale}
            y={tileY / scale}
            isHighlighted={true}
            onClick={() => handleTileClick(x, y, rotation)}
            scale={scale}
          />
        );
      });
    }

    return tiles;
  };

  // Render minimap
  const renderMinimap = () => {
    const minimapSize = 150;
    const minimapScale = 0.1;
    
    return (
      <div style={{
        position: 'absolute',
        bottom: 10,
        right: 10,
        width: minimapSize,
        height: minimapSize,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        border: '1px solid #ccc',
        borderRadius: '5px',
        overflow: 'hidden',
        zIndex: 10
      }}>
        <div style={{
          position: 'relative',
          transform: `scale(${minimapScale})`,
          transformOrigin: 'top left'
        }}>
          {board && board.map((row, y) => 
            row.map((tile, x) => {
              if (tile) {
                return (
                  <div
                    key={`minimap-${x}-${y}`}
                    style={{
                      position: 'absolute',
                      left: (x - center) * 100,
                      top: (y - center) * 100,
                      width: 100,
                      height: 100,
                      backgroundColor: '#4a6c6f',
                      border: '1px solid #333'
                    }}
                  />
                );
              }
              return null;
            })
          )}
          
          {/* Viewport indicator */}
          <div style={{
            position: 'absolute',
            left: (position.x - viewportSize.width / 2) / scale / minimapScale,
            top: (position.y - viewportSize.height / 2) / scale / minimapScale,
            width: viewportSize.width / scale / minimapScale,
            height: viewportSize.height / scale / minimapScale,
            border: '2px solid red',
            backgroundColor: 'rgba(255, 0, 0, 0.1)'
          }} />
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        width: '100%',
        height: 'calc(100vh - 200px)', // Full screen minus header
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#f0e6d2',
        border: '1px solid #ccc',
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      ref={boardRef}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          backgroundImage: 'url(/wood.jpg)',
          backgroundSize: 'cover'
        }}
      >
        {renderTiles()}
      </div>
      {renderMinimap()}
    </div>
  );
};

Board.propTypes = {
  gameState: PropTypes.shape({
    board: PropTypes.array.isRequired,
    center: PropTypes.number.isRequired,
    placedTiles: PropTypes.number.isRequired,
    currentTile: PropTypes.string
  }).isRequired,
  possiblePlacements: PropTypes.arrayOf(
    PropTypes.shape({
      x: PropTypes.number.isRequired,
      y: PropTypes.number.isRequired,
      rotation: PropTypes.number.isRequired
    })
  ),
  onTilePlaced: PropTypes.func.isRequired,
  currentTile: PropTypes.string
};

export default Board;
