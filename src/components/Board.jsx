import React, { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import Tile from './Tile';

const Board = ({ gameState, possiblePlacements, onTilePlaced, currentTile }) => {
  const { board, center } = gameState;
  const boardRef = useRef(null);
  const [boardSize, setBoardSize] = useState({ width: 0, height: 0 });

  // Calculate board dimensions based on placed tiles
  useEffect(() => {
    if (!board) return;

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    // Find the boundaries of placed tiles
    for (let y = 0; y < board.length; y++) {
      for (let x = 0; x < board[y].length; x++) {
        if (board[y][x]) {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }
    }

    // Add some padding
    minX = Math.max(0, minX - 2);
    minY = Math.max(0, minY - 2);
    maxX = Math.min(board[0].length - 1, maxX + 2);
    maxY = Math.min(board.length - 1, maxY + 2);

    setBoardSize({
      width: (maxX - minX + 1) * 100,
      height: (maxY - minY + 1) * 100
    });
  }, [board]);

  // Render tiles
  const renderTiles = () => {
    if (!board) return null;

    const tiles = [];

    for (let y = 0; y < board.length; y++) {
      for (let x = 0; x < board[y].length; x++) {
        const tile = board[y][x];
        if (tile) {
          tiles.push(
            <Tile
              key={`${x}-${y}`}
              type={tile.type}
              rotation={tile.rotation || 0}
              x={x - center}
              y={y - center}
              meeple={tile.meeple}
            />
          );
        }
      }
    }

    // Render possible placements for the current tile
    if (possiblePlacements && currentTile) {
      possiblePlacements.forEach(({ x, y, rotation }) => {
        tiles.push(
          <Tile
            key={`placement-${x}-${y}-${rotation}`}
            type={currentTile}
            rotation={rotation}
            x={x - center}
            y={y - center}
            isHighlighted={true}
            onClick={() => onTilePlaced(x, y, rotation)}
          />
        );
      });
    }

    return tiles;
  };

  return (
    <div
      style={{
        width: '100%',
        height: '600px',
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#f0e6d2',
        border: '1px solid #ccc'
      }}
    >
      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={3}
        initialPositionX={boardSize.width / 2}
        initialPositionY={boardSize.height / 2}
      >
        <TransformComponent>
          <div
            ref={boardRef}
            style={{
              width: boardSize.width || 1000,
              height: boardSize.height || 1000,
              position: 'relative',
              backgroundImage: 'url(/wood.jpg)',
              backgroundSize: 'cover'
            }}
          >
            {renderTiles()}
          </div>
        </TransformComponent>
      </TransformWrapper>
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
