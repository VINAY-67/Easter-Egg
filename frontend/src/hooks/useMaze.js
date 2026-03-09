import { useState, useCallback, useEffect } from 'react';

export const useMaze = (rows = 20, cols = 20) => {
    const [maze, setMaze] = useState([]);
    const [playerPos, setPlayerPos] = useState({ r: 0, c: 0 });
    const [exitPos, setExitPos] = useState({ r: rows - 1, c: cols - 1 });
    const [gameWon, setGameWon] = useState(false);

    const [rDim, setRDim] = useState(rows);
    const [cDim, setCDim] = useState(cols);

    const generateMaze = useCallback(() => {
        const rCount = rows % 2 === 0 ? rows + 1 : rows;
        const cCount = cols % 2 === 0 ? cols + 1 : cols;
        setRDim(rCount);
        setCDim(cCount);

        // Initialize with walls (1)
        let newMaze = Array.from({ length: rCount }, () => Array(cCount).fill(1));

        // 1. Carve the "E" Stencil (The True Path)
        const midRow = Math.floor(rCount / 2);
        const lastRow = rCount - 1;
        const lastCol = cCount - 1;

        // Spine (Col 0)
        for (let r = 0; r <= lastRow; r++) newMaze[r][0] = 0;
        // Top Stroke
        for (let c = 0; c <= lastCol; c++) newMaze[0][c] = 0;
        // Middle Stroke
        for (let c = 0; c <= Math.floor(lastCol * 0.7); c++) newMaze[midRow][c] = 0;
        // Bottom Stroke
        for (let c = 0; c <= lastCol; c++) newMaze[lastRow][c] = 0;

        // 2. Add Decoy Paths (Confusion)
        const carveDecoy = (startR, startC, depth) => {
            if (depth <= 0) return;
            const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]].sort(() => Math.random() - 0.5);

            for (const [dr, dc] of dirs) {
                const nr = startR + dr;
                const nc = startC + dc;
                const nnr = startR + dr * 2;
                const nnc = startC + dc * 2;

                if (nnr > 0 && nnr < lastRow && nnc > 0 && nnc < lastCol && newMaze[nnr][nnc] === 1) {
                    newMaze[nr][nc] = 0;
                    newMaze[nnr][nnc] = 0;
                    carveDecoy(nnr, nnc, depth - 1);
                }
            }
        };

        // Seed some decoys
        for (let r = 1; r < lastRow; r++) {
            if (r !== midRow && newMaze[r][0] === 0) {
                if (Math.random() > 0.6) carveDecoy(r, 0, 5);
            }
        }
        for (let c = 1; c < lastCol; c++) {
            if (newMaze[0][c] === 0 && Math.random() > 0.7) carveDecoy(0, c, 4);
            if (newMaze[lastRow][c] === 0 && Math.random() > 0.7) carveDecoy(lastRow, c, 4);
        }

        // 3. Find "E" Path Solution (BFS) for verification
        const findPath = () => {
            const queue = [[0, 0, []]];
            const visited = new Set(['0,0']);
            while (queue.length > 0) {
                const [r, c, path] = queue.shift();
                if (r === lastRow && c === lastCol) return [...path, { r, c }];

                for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
                    const nr = r + dr, nc = c + dc;
                    if (nr >= 0 && nr < rCount && nc >= 0 && nc < cCount && newMaze[nr][nc] === 0 && !visited.has(`${nr},${nc}`)) {
                        visited.add(`${nr},${nc}`);
                        queue.push([nr, nc, [...path, { r, c }]]);
                    }
                }
            }
            return null;
        };

        const solution = findPath();
        console.log("LEVEL 2 - SECRET E-PATH DECODED (Solution):", solution);
        console.log("LEVEL 2 - Mission: Navigate the 'E' to find the Red Core.");

        setMaze(newMaze);
        setPlayerPos({ r: 0, c: 0 });
        setExitPos({ r: lastRow, c: lastCol });
        setGameWon(false);
    }, [rows, cols]);

    useEffect(() => {
        generateMaze();
    }, [generateMaze]);

    const movePlayer = (dr, dc) => {
        if (gameWon) return;

        setPlayerPos(prev => {
            const nr = prev.r + dr;
            const nc = prev.c + dc;

            if (nr >= 0 && nr < rDim && nc >= 0 && nc < cDim && maze[nr][nc] === 0) {
                if (nr === exitPos.r && nc === exitPos.c) {
                    setGameWon(true);
                }
                return { r: nr, c: nc };
            }
            return prev;
        });
    };

    return { maze, playerPos, exitPos, movePlayer, generateMaze, gameWon, ROWS: rDim, COLS: cDim };
};
