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

  // Track touch points for pinch-to-zoom
  const [initialPinchDistance, setInitialPinchDistance] = useState(null);
  const [initialScale, setInitialScale] = useState(1);

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

  // Calculate distance between two touch points
  const getTouchDistance = (touches) => {
    if (touches.length < 2) return 0;
    
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Get center point between two touches
  const getTouchCenter = (touches) => {
    if (touches.length < 2) {
      return { x: touches[0].clientX, y: touches[0].clientY };
    }
    
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2
    };
  };

  // Handle touch start
  const handleTouchStart = (e) => {
    e.preventDefault(); // Prevent default touch behavior
    
    const touches = Array.from(e.touches);
    
    if (touches.length === 1) {
      // Single touch - start dragging
      setIsDragging(true);
      setDragStart({ x: touches[0].clientX, y: touches[0].clientY });
    } else if (touches.length === 2) {
      // Two touches - start pinch zoom
      setInitialPinchDistance(getTouchDistance(touches));
      setInitialScale(scale);
    }
  };

  // Handle touch move
  const handleTouchMove = (e) => {
    e.preventDefault(); // Prevent default touch behavior
    
    const touches = Array.from(e.touches);
    
    if (touches.length === 1 && isDragging) {
      // Single touch - dragging
      const dx = touches[0].clientX - dragStart.x;
      const dy = touches[0].clientY - dragStart.y;
      
      setPosition({
        x: position.x + dx,
        y: position.y + dy
      });
      
      setDragStart({ x: touches[0].clientX, y: touches[0].clientY });
    } else if (touches.length === 2 && initialPinchDistance) {
      // Two touches - pinch zoom
      const currentDistance = getTouchDistance(touches);
      const pinchRatio = currentDistance / initialPinchDistance;
      const newScale = Math.max(0.5, Math.min(3, initialScale * pinchRatio));
      
      // Calculate zoom center (center between touch points)
      const rect = boardRef.current.getBoundingClientRect();
      const touchCenter = getTouchCenter(touches);
      const centerX = touchCenter.x - rect.left;
      const centerY = touchCenter.y - rect.top;
      
      // Calculate new position to zoom towards center
      const newPosition = {
        x: centerX - (centerX - position.x) * (newScale / scale),
        y: centerY - (centerY - position.y) * (newScale / scale)
      };
      
      setScale(newScale);
      setPosition(newPosition);
    }
  };

  // Handle touch end
  const handleTouchEnd = (e) => {
    e.preventDefault(); // Prevent default touch behavior
    
    const touches = Array.from(e.touches);
    
    if (touches.length === 0) {
      // All touches ended
      setIsDragging(false);
      setInitialPinchDistance(null);
    } else if (touches.length === 1) {
      // Back to one touch - reset for dragging
      setIsDragging(true);
      setDragStart({ x: touches[0].clientX, y: touches[0].clientY });
      setInitialPinchDistance(null);
    }
  };

  // Handle tile click
  const handleTileClick = (x, y, rotation) => {
    // Convert screen coordinates to board coordinates
    onTilePlaced(x, y, rotation);
  };

  // Render tiles
  const renderTiles = () => {
    if (!board) return null;

    // Create a container for all tiles that will be transformed as a whole
    return (
      <div style={{
        position: 'absolute',
        transform: `scale(${scale})`,
        transformOrigin: '0 0',
        left: `${position.x}px`,
        top: `${position.y}px`
      }}>
        {/* Render placed tiles */}
        {board.map((row, y) => 
          row.map((tile, x) => {
            if (tile) {
              return (
                <Tile
                  key={`${x}-${y}`}
                  type={tile.type}
                  rotation={tile.rotation || 0}
                  x={(x - center) * 100}
                  y={(y - center) * 100}
                  meeple={tile.meeple}
                  scale={1} // Scale is handled by the container
                />
              );
            }
            return null;
          })
        )}

        {/* Render possible placements */}
        {possiblePlacements && currentTile && possiblePlacements.map(({ x, y, rotation }) => (
          <Tile
            key={`placement-${x}-${y}-${rotation}`}
            type={currentTile}
            rotation={rotation}
            x={(x - center) * 100}
            y={(y - center) * 100}
            isHighlighted={true}
            onClick={() => handleTileClick(x, y, rotation)}
            scale={1} // Scale is handled by the container
          />
        ))}
      </div>
    );
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
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none' // Prevent browser's default touch behavior
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
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
