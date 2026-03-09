import { useState, useEffect, useCallback } from 'react';

const ROWS = 9;
const COLS = 9;
const MINES = 10;

const createEmptyBoard = () => {
    return Array.from({ length: ROWS }, () =>
        Array.from({ length: COLS }, () => ({
            isMine: false,
            isRevealed: false,
            isFlagged: false,
            neighborMines: 0
        }))
    );
};

export const useGame = () => {
    const [board, setBoard] = useState(createEmptyBoard());
    const [gameOver, setGameOver] = useState(false);
    const [gameWon, setGameWon] = useState(false);
    const [lossPending, setLossPending] = useState(false); // Used to trigger API call
    const [winPending, setWinPending] = useState(false);

    // Initialize Board
    const initBoard = useCallback(() => {
        let newBoard = createEmptyBoard();
        let minesPlaced = 0;
        while (minesPlaced < MINES) {
            const r = Math.floor(Math.random() * ROWS);
            const c = Math.floor(Math.random() * COLS);
            if (!newBoard[r][c].isMine) {
                newBoard[r][c].isMine = true;
                minesPlaced++;
            }
        }

        // Calculate neighbors
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (!newBoard[r][c].isMine) {
                    let mines = 0;
                    for (let dr = -1; dr <= 1; dr++) {
                        for (let dc = -1; dc <= 1; dc++) {
                            if (r + dr >= 0 && r + dr < ROWS && c + dc >= 0 && c + dc < COLS) {
                                if (newBoard[r + dr][c + dc].isMine) mines++;
                            }
                        }
                    }
                    newBoard[r][c].neighborMines = mines;
                }
            }
        }
        setBoard(newBoard);
        setGameOver(false);
        setGameWon(false);
        setLossPending(false);
        setWinPending(false);

        // Debug: Print mine locations
        const mineLocations = [];
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (newBoard[r][c].isMine) mineLocations.push({ r, c });
            }
        }
        console.log("Jasmine (mine) locations:", mineLocations);
    }, []);

    useEffect(() => {
        initBoard();
    }, [initBoard]);

    // Handle cell click
    const revealCell = (r, c) => {
        if (gameOver || gameWon || board[r][c].isRevealed || board[r][c].isFlagged) return;

        let newBoard = [...board].map(row => [...row]);

        if (newBoard[r][c].isMine) {
            newBoard[r][c].isRevealed = true;
            setBoard(newBoard);
            setGameOver(true); // Stop further clicks immediately
            setLossPending(true); // Trigger API call for life loss
            return;
        }

        // Flood fill (BFS)
        const queue = [[r, c]];

        while (queue.length > 0) {
            const [currR, currC] = queue.shift();
            if (!newBoard[currR][currC].isRevealed) {
                newBoard[currR][currC].isRevealed = true;

                if (newBoard[currR][currC].neighborMines === 0) {
                    for (let dr = -1; dr <= 1; dr++) {
                        for (let dc = -1; dc <= 1; dc++) {
                            const nr = currR + dr;
                            const nc = currC + dc;
                            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !newBoard[nr][nc].isRevealed && !newBoard[nr][nc].isFlagged && !newBoard[nr][nc].isMine) {
                                queue.push([nr, nc]);
                            }
                        }
                    }
                }
            }
        }

        setBoard(newBoard);
        checkWinCondition(newBoard);
    };

    const toggleFlag = (r, c, e) => {
        e.preventDefault();
        if (gameOver || gameWon || board[r][c].isRevealed) return;
        let newBoard = [...board].map(row => [...row]);
        newBoard[r][c].isFlagged = !newBoard[r][c].isFlagged;
        setBoard(newBoard);
    };

    const checkWinCondition = (currentBoard) => {
        // Double check we haven't lost this turn
        let mineHit = false;
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (currentBoard[r][c].isMine && currentBoard[r][c].isRevealed) {
                    mineHit = true;
                    break;
                }
            }
            if (mineHit) break;
        }
        if (mineHit) return;

        let unrevealedSafe = 0;
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (!currentBoard[r][c].isRevealed && !currentBoard[r][c].isMine) {
                    unrevealedSafe++;
                }
            }
        }
        if (unrevealedSafe === 0) {
            setGameWon(true);
            setWinPending(true); // Trigger API
            revealAllMines(currentBoard);
        }
    };

    const revealAllMines = (currentBoard) => {
        let newBoard = [...currentBoard].map(row => [...row]);
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (newBoard[r][c].isMine) {
                    newBoard[r][c].isRevealed = true;
                }
            }
        }
        setBoard(newBoard);
    };

    return {
        board,
        gameOver,
        gameWon,
        lossPending,
        winPending,
        revealCell,
        toggleFlag,
        initBoard,
        setLossPending,
        setWinPending,
        ROWS, COLS
    };
};
