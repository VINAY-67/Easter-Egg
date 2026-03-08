import React from 'react';

const colors = ["", "blue", "green", "red", "purple", "maroon", "turquoise", "black", "gray"];

const Cell = ({ cellData, onClick, onContextMenu }) => {
    const { isRevealed, isMine, isFlagged, neighborMines } = cellData;

    const content = isRevealed ? (
        isMine ? "" : (neighborMines > 0 ? neighborMines : "")
    ) : (
        isFlagged ? "🌸" : ""
    );

    const className = `cell ${isRevealed ? "revealed" : ""} ${isRevealed && isMine ? "jasmine" : ""}`;

    return (
        <div
            className={className}
            onClick={onClick}
            onContextMenu={onContextMenu}
            style={{
                color: isRevealed && !isMine && neighborMines > 0 ? colors[neighborMines] : "inherit"
            }}
        >
            {content}
        </div>
    );
};

export default React.memo(Cell);
