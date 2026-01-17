import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { initialBoard } from './initialBoard';
import { getLegalMoves, isKingInCheck, hasAnyLegalMoves, type Move } from './moveUtils';
import { toSAN } from '../../engine/toSan';

import type { BoardState, GameEndReason, GameStatus } from '../../types/chess';
import type { PlayerColor, ServerGame } from '../../types/serverGame';

/* =============== HELPERS =============== */

const PLAYER_ID_KEY = 'chess_player_id';

function getPlayerId() {
    return localStorage.getItem(PLAYER_ID_KEY);
}

function withPieceIds(board: BoardState): BoardState {
    return board.map((square) => {
        if (!square.piece) return square;

        return {
            ...square,
            piece: {
                ...square.piece,
                id: square.piece.id ?? crypto.randomUUID(),
            },
        };
    });
}

function normalizeMove(to: number, move: Move, capture: boolean): Move {
    return {
        index: to,
        capture,
        castle: move.castle,
        enPassant: move.enPassant,
    };
}

const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const indexToSquare = (index: number) => `${files[index % 8]}${8 - Math.floor(index / 8)}`;

/* =============== TYPES =============== */

interface MovePayload {
    from: number;
    to: number;
}

type MoveAnnotation = '!!' | '!' | '!?' | '?!' | '?' | '??' | null;

interface EngineEval {
    type: 'cp' | 'mate';
    value: number;
}

interface MoveHistoryItem {
    notation: string;
    annotation: MoveAnnotation;
}

interface PromotionState {
    index: number;
}

interface ChessState {
    board: BoardState;
    turn: 'white' | 'black';
    legalMoves: Move[];
    selectedIndex: number | null;

    gameId: string | null;
    myColor: 'white' | 'black' | null;

    promotion: PromotionState | null;
    inCheck: boolean;
    gameOver: boolean;
    winner: 'white' | 'black' | null;
    endReason: GameEndReason;

    enPassantTarget: number | null;

    lastMoveFrom: number | null;
    lastMoveTo: number | null;

    isFlipped: boolean;

    moveHistory: MoveHistoryItem[];
    engineEval: EngineEval | null;
    lastEvalBeforeMove: number | null;

    disconnectedDeadline: number | null;
    disconnectedColor: PlayerColor | null;

    gameStatus: GameStatus;
}

/* ================== INITIAL STATE ================== */

const initialState: ChessState = {
    board: initialBoard,
    turn: 'white',
    legalMoves: [],
    selectedIndex: null,

    gameId: null,
    myColor: null,

    promotion: null,
    inCheck: false,

    gameOver: false,
    winner: null,
    endReason: null,

    enPassantTarget: null,

    lastMoveFrom: null,
    lastMoveTo: null,

    isFlipped: false,

    moveHistory: [],
    engineEval: null,
    lastEvalBeforeMove: null,

    disconnectedDeadline: null,
    disconnectedColor: null,

    gameStatus: 'waiting',
};

/* ================== SLICE ================== */

const chessSlice = createSlice({
    name: 'chess',
    initialState,
    reducers: {
        /* ---------- SELECTION ---------- */

        selectPiece: (state, action: PayloadAction<number>) => {
            if (state.gameOver || state.promotion) return;
            if (state.myColor !== state.turn) return; // 🔒 LOCK MOVES

            const piece = state.board[action.payload].piece;
            if (!piece || piece.color !== state.turn) return;

            state.selectedIndex = action.payload;
            state.legalMoves = getLegalMoves(state.board, action.payload, state.enPassantTarget);
        },

        clearSelection: (state) => {
            state.selectedIndex = null;
            state.legalMoves = [];
        },

        /* ---------- MOVE PIECE ---------- */

        movePiece: (state, action: PayloadAction<MovePayload>) => {
            if (state.gameOver || state.promotion) return;
            if (state.myColor !== state.turn) return; // 🔒 LOCK MOVES

            const { from, to } = action.payload;
            const movingPiece = state.board[from].piece;
            if (!movingPiece) return;

            const move = state.legalMoves.find((m) => m.index === to);
            if (!move) return;

            const opponent = movingPiece.color === 'white' ? 'black' : 'white';

            const fromSquare = indexToSquare(from);
            const toSquare = indexToSquare(to);

            let notation = `${fromSquare} → ${toSquare}`;

            if (move.enPassant !== undefined && movingPiece.type === 'pawn') {
                state.board[move.enPassant].piece = null;
                notation = `${fromSquare} × ${toSquare}`;
            }

            if (movingPiece.type === 'king' && Math.abs(from - to) === 2) {
                const rookFrom = to > from ? from + 3 : from - 4;
                const rookTo = to > from ? from + 1 : from - 1;

                state.board[rookTo].piece = {
                    ...state.board[rookFrom].piece!,
                    hasMoved: true,
                };
                state.board[rookFrom].piece = null;

                notation = to > from ? 'O-O' : 'O-O-O';
            }

            if (move.capture) {
                notation = `${fromSquare} × ${toSquare}`;
            }

            state.board[to].piece = { ...movingPiece, hasMoved: true };
            state.board[from].piece = null;

            state.enPassantTarget =
                movingPiece.type === 'pawn' && Math.abs(from - to) === 16 ? (from + to) / 2 : null;

            state.turn = opponent;

            state.inCheck = isKingInCheck(state.board, state.turn);

            if (state.inCheck && !hasAnyLegalMoves(state.board, state.turn)) {
                state.gameOver = true;
                state.winner = opponent === 'white' ? 'black' : 'white';
            }

            state.lastMoveFrom = from;
            state.lastMoveTo = to;

            state.moveHistory.push({ notation, annotation: null });

            state.selectedIndex = null;
            state.legalMoves = [];
        },

        toggleBoard: (state) => {
            state.isFlipped = !state.isFlipped;
        },

        setMoveAnnotation: (
            state,
            action: PayloadAction<{ index: number; annotation: MoveAnnotation }>
        ) => {
            const move = state.moveHistory[action.payload.index];
            if (move) {
                move.annotation = action.payload.annotation;
            }
        },

        setEngineEval: (state, action: PayloadAction<EngineEval>) => {
            const prevEval = state.engineEval;
            state.engineEval = action.payload;

            // We only auto-annotate once, right after a move
            if (
                state.lastEvalBeforeMove === null ||
                prevEval === null ||
                prevEval.type !== 'cp' ||
                action.payload.type !== 'cp'
            ) {
                return;
            }

            const lastMoveIndex = state.moveHistory.length - 1;
            if (lastMoveIndex < 0) return;

            const before = state.lastEvalBeforeMove;
            const after = action.payload.value;

            // Determine who made the last move
            const lastMoveByWhite = lastMoveIndex % 2 === 0;

            const evalDiff = lastMoveByWhite ? after - before : before - after;

            let annotation: MoveAnnotation = null;

            if (evalDiff <= -300) annotation = '??';
            else if (evalDiff <= -150) annotation = '?';
            else if (evalDiff <= -75) annotation = '?!';
            else if (evalDiff >= 300) annotation = '!!';
            else if (evalDiff >= 150) annotation = '!';
            else if (evalDiff >= 75) annotation = '!?';

            if (annotation) {
                state.moveHistory[lastMoveIndex].annotation = annotation;
            }

            // Reset so this runs only once per move
            state.lastEvalBeforeMove = null;
        },

        setPromotion: (state, action: PayloadAction<{ index: number }>) => {
            state.promotion = { index: action.payload.index };
        },

        clearPromotion: (state) => {
            state.promotion = null;
        },

        resetGame: (state) => {
            state.board = initialBoard;
            state.turn = 'white';
            state.legalMoves = [];
            state.selectedIndex = null;
            state.promotion = null;
            state.inCheck = false;
            state.gameOver = false;
            state.winner = null;
            state.endReason = null;

            state.enPassantTarget = null;

            state.lastMoveFrom = null;
            state.lastMoveTo = null;

            state.isFlipped = false;

            state.moveHistory = [];
            state.engineEval = null;
            state.lastEvalBeforeMove = null;
        },

        /* ---------- SERVER SYNC ---------- */

        setGameFromServer: (state, action: PayloadAction<ServerGame>) => {
            const prevBoard = state.board;

            state.gameId = action.payload.id;
            state.board = withPieceIds(action.payload.board);
            state.turn = action.payload.turn;
            state.enPassantTarget = action.payload.enPassantTarget;
            state.gameStatus = action.payload.status;

            if (prevBoard.length) {
                let from: number | null = null;
                let to: number | null = null;

                for (let i = 0; i < 64; i++) {
                    if (prevBoard[i].piece && !state.board[i].piece) from = i;
                    if (!prevBoard[i].piece && state.board[i].piece) to = i;
                }

                if (from !== null && to !== null) {
                    const movingPiece = prevBoard[from].piece!;
                    const legalMoves = getLegalMoves(prevBoard, from, state.enPassantTarget);

                    const move = legalMoves.find((m) => m.index === to);

                    if (move) {
                        const wasCapture =
                            prevBoard[to].piece &&
                            prevBoard[to]!.piece!.color !== state.board[to].piece?.color;

                        const sanMove = normalizeMove(to, move!, wasCapture || move!.capture);

                        const opponent = movingPiece.color === 'white' ? 'black' : 'white';
                        const isCheck = isKingInCheck(state.board, opponent);
                        const isMate = isCheck && !hasAnyLegalMoves(state.board, opponent);

                        const san = toSAN({
                            boardBefore: prevBoard,
                            from,
                            to,
                            move: sanMove,
                            isCheck,
                            isMate,
                        });

                        state.moveHistory.push({
                            notation: san,
                            annotation: null,
                        });
                    }
                }
            }

            const myPlayerId = getPlayerId();
            if (action.payload.players.white?.playerId === myPlayerId) {
                state.myColor = 'white';
            } else if (action.payload.players.black?.playerId === myPlayerId) {
                state.myColor = 'black';
            } else {
                state.myColor = null;
            }

            state.selectedIndex = null;
            state.legalMoves = [];
        },
    },
});

export const {
    // Gameplay
    movePiece,
    selectPiece,
    clearSelection,

    // Promotion
    setPromotion,
    clearPromotion,

    // Engine
    setEngineEval,

    // UI
    setMoveAnnotation,
    toggleBoard,
    resetGame,

    // Server Sync
    setGameFromServer,
} = chessSlice.actions;

export default chessSlice.reducer;
