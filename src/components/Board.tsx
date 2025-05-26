import React, { useRef, useState, useEffect } from 'react'; // Added React import
import Tile from './Tile.tsx'; // Ensure this path is correct and Tile.tsx is refactored
import { GameState, Coordinates, Rotation, PlacedTile } from '../types'; // Corrected import path
import { TILES } from '../utils/gameLogic'; // Import TILES

interface BoardProps {
  gameState: GameState | null; // Can be null initially
  possiblePlacements: Coordinates[];
  onEmptyTileClick: (x: number, y: number) => void;
  onSelectedTileClick: () => void; // Action when the currently selected tile (already on board preview) is clicked
  selectedPosition: Coordinates | null;
  currentRotation: Rotation;
  currentTileType: string | null; // The type ('A', 'B', etc.) of the tile to be placed
  onConfirmPlacement: () => void;
  boardZoomAndPan: {
    position: Coordinates;
    scale: number;
    setPosition: React.Dispatch<React.SetStateAction<Coordinates>>;
    setScale: React.Dispatch<React.SetStateAction<number>>;
  };
}

const Board: React.FC<BoardProps> = ({
  gameState,
  possiblePlacements,
  onEmptyTileClick,
  onSelectedTileClick,
  selectedPosition,
  currentRotation,
  currentTileType, // This is the string type, e.g., 'A'
  onConfirmPlacement,
  boardZoomAndPan,
}) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const { position, scale, setPosition, setScale } = boardZoomAndPan;

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<Coordinates>({ x: 0, y: 0 });
  
  // For pinch-to-zoom
  const [initialPinchDistance, setInitialPinchDistance] = useState<number | null>(null);
  const [initialScale, setInitialScale] = useState<number>(1);

  // Center the view on initial load (e.g., around the starting tile)
  useEffect(() => {
    if (boardRef.current && gameState && gameState.board.length > 0) {
        // const { clientWidth, clientHeight } = boardRef.current.parentElement!; // clientWidth, clientHeight unused
        // const tileDisplaySize = 100; // The visual size of a tile at scale 1 // tileDisplaySize unused

        // Center on the initial tile (gameState.center gives its board coordinates)
        // Adjust so the center of the board (gameState.center) appears at the center of the viewport
        // const initialX = clientWidth / 2 - (gameState.center.x * tileDisplaySize + tileDisplaySize / 2) * scale; // initialX unused
        // const initialY = clientHeight / 2 - (gameState.center.y * tileDisplaySize + tileDisplaySize / 2) * scale; // initialY unused
        
        // Commenting out initial setPosition to allow Game.tsx to control initial centering
        // setPosition({ x: initialX, y: initialY });
    }
  }, [gameState?.center.x, gameState?.center.y, scale]); // Removed setPosition from deps


  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setPosition((prevPos: Coordinates) => ({ x: prevPos.x + dx, y: prevPos.y + dy }));
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!boardRef.current) return;

    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newScale = Math.max(0.1, Math.min(5, scale * zoomFactor)); // Broader zoom limits

    const rect = boardRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const newPositionX = mouseX - (mouseX - position.x) * (newScale / scale);
    const newPositionY = mouseY - (mouseY - position.y) * (newScale / scale);

    setScale(newScale);
    setPosition({ x: newPositionX, y: newPositionY });
  };
  
  // Touch event handlers
  const getTouchDistance = (touches: React.TouchList): number => { // Changed TouchList to React.TouchList
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getTouchCenter = (touches: React.TouchList): Coordinates => { // Changed TouchList to React.TouchList
    if (touches.length < 2) return { x: touches[0].clientX, y: touches[0].clientY };
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    // e.preventDefault(); // Removing to allow tile click through
    const touches = e.touches;
    if (touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: touches[0].clientX, y: touches[0].clientY });
    } else if (touches.length === 2) {
      setIsDragging(false); // Stop dragging if it was a single touch
      setInitialPinchDistance(getTouchDistance(touches));
      setInitialScale(scale);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // e.preventDefault(); // Removing to see if it helps with click propagation
    if (!boardRef.current) return;
    const touches = e.touches;
    if (touches.length === 1 && isDragging) {
      const dx = touches[0].clientX - dragStart.x;
      const dy = touches[0].clientY - dragStart.y;
      setPosition((prevPos: Coordinates) => ({ x: prevPos.x + dx, y: prevPos.y + dy }));
      setDragStart({ x: touches[0].clientX, y: touches[0].clientY });
    } else if (touches.length === 2 && initialPinchDistance !== null) {
      const currentDistance = getTouchDistance(touches);
      const pinchRatio = currentDistance / initialPinchDistance;
      const newScale = Math.max(0.1, Math.min(5, initialScale * pinchRatio));

      const rect = boardRef.current.getBoundingClientRect();
      const touchCenter = getTouchCenter(touches);
      const centerX = touchCenter.x - rect.left;
      const centerY = touchCenter.y - rect.top;

      const newPositionX = centerX - (centerX - position.x) * (newScale / scale);
      const newPositionY = centerY - (centerY - position.y) * (newScale / scale);
      
      setScale(newScale);
      setPosition({ x: newPositionX, y: newPositionY });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    // e.preventDefault();
    if (e.touches.length < 2) setInitialPinchDistance(null);
    if (e.touches.length < 1) setIsDragging(false);
    // If transitioning from 2 to 1 touch, reset drag start for the remaining touch
    if (e.touches.length === 1) {
        setIsDragging(true); // Re-enable dragging
        setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };


  const renderTiles = (): React.JSX.Element | null => { // Corrected return type to single element or null
    if (!gameState || !gameState.board) return null;
    const { board, center: gameLogicCenter } = gameState; // gameLogicCenter is {x,y} of the initial tile in board array

    const tileElements: React.JSX.Element[] = []; // Changed type

    // Render placed tiles
    board.forEach((row: (PlacedTile | null)[], y: number) => {
      row.forEach((tileData: PlacedTile | null, x: number) => {
        if (tileData) {
          tileElements.push(
            <Tile
              key={`tile-${x}-${y}`}
              tileData={{
                ...tileData,
                // Adjust x, y for rendering relative to the gameLogicCenter
                // The Tile component itself will use these x,y with its own tileSize logic
                x: (x - gameLogicCenter.x), 
                y: (y - gameLogicCenter.y),
              }}
              scale={0.5} // Tiles on board are smaller
            />
          );
        }
      });
    });
    
    // Render possible placements (empty slots)
    if (possiblePlacements && currentTileType) {
      possiblePlacements.forEach((p, index) => {
        const isSelected = selectedPosition && selectedPosition.x === p.x && selectedPosition.y === p.y;
        const tileTypeForDisplay = isSelected ? currentTileType : 'Empty';
        
        let tileDisplayData: PlacedTile | { type: 'Empty'; x: number; y: number; rotation?: Rotation; meeple?: null };

        if (tileTypeForDisplay === 'Empty') {
          tileDisplayData = {
            type: 'Empty',
            x: (p.x - gameLogicCenter.x),
            y: (p.y - gameLogicCenter.y),
            rotation: 0, // Empty tiles don't typically rotate or use currentRotation
            meeple: null,
          };
        } else if (currentTileType) { // Should always be true if tileTypeForDisplay is not 'Empty'
          const tileDef = TILES[currentTileType]; // TILES needs to be imported or accessible
          if (!tileDef) {
            console.error(`Tile definition not found for type: ${currentTileType}`);
            return; // or handle error appropriately
          }
          tileDisplayData = {
            type: currentTileType,
            x: (p.x - gameLogicCenter.x),
            y: (p.y - gameLogicCenter.y),
            rotation: isSelected ? currentRotation : 0, // Should be currentRotation if selected
            borders: tileDef.borders, // Get actual borders from definition
            meeple: null, // Preview tiles don't have meeples yet
          };
        } else {
           // Should not happen given the logic for tileTypeForDisplay
          console.error("Inconsistent state for tileDisplayData");
          return;
        }
        
        tileElements.push(
          <Tile
            key={`possible-${p.x}-${p.y}-${index}`}
            tileData={tileDisplayData}
            isHighlighted={!isSelected} // Highlight if it's a possible placement but not the selected one
            onClick={() => isSelected ? onSelectedTileClick() : onEmptyTileClick(p.x, p.y)}
            onConfirm={isSelected && tileTypeForDisplay !== 'Empty' ? onConfirmPlacement : undefined}
            scale={0.5} // Tiles on board are smaller
            isSelected={Boolean(isSelected)} // Explicitly cast to boolean
          />
        );
      });
    }

    return (
      <div data-testid="tiles-container" style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: `scale(${scale})`,
        transformOrigin: '0 0',
        // width: `${gameState.boardSize * 50}px`, // Assuming tile visual size 50px at scale 1
        // height: `${gameState.boardSize * 50}px`,
      }}>
        {tileElements}
      </div>
    );
  };


  return (
    <div
      style={{
        width: '100%',
        height: 'calc(100vh - 220px)', // Adjusted for header and current tile view
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#d2b48c', // Tan color for background
        border: '1px solid #8B4513', // SaddleBrown border
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none', // Important for custom touch handling
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp} // Stop dragging if mouse leaves the component
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      ref={boardRef}
      data-testid="game-board"
    >
      {/* Optional: could add a background pattern div here if needed */}
      {renderTiles()}
    </div>
  );
};

export default Board;
