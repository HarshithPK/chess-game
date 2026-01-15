import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { BoardState, GameEndReason } from '../../types/chess';
import { initialBoard } from './initialBoard';
import { getLegalMoves, isKingInCheck, hasAnyLegalMoves, type Move } from './moveUtils';
import type { PlayerColor, ServerGame } from '../../types/serverGame';
import { socket } from '../../socket';

/* =====================================================
   HELPERS
===================================================== */

const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const indexToSquare = (index: number) => `${files[index % 8]}${8 - Math.floor(index / 8)}`;

/* =====================================================
   TYPES
===================================================== */

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

    // arrows
    lastMoveFrom: number | null;
    lastMoveTo: number | null;

    // board orientation
    isFlipped: boolean;

    // analysis
    moveHistory: MoveHistoryItem[];
    engineEval: EngineEval | null;
    lastEvalBeforeMove: number | null;

    disconnectedDeadline: number | null;
    disconnectedColor: PlayerColor | null;
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
};

/* ================== SLICE ================== */

const chessSlice = createSlice({
    name: 'chess',
    initialState,
    reducers: {
        /* ---------- SELECTION ---------- */

        selectPiece: (state, action: PayloadAction<number>) => {
            if (state.gameOver || state.promotion) return;

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

            const { from, to } = action.payload;
            const movingPiece = state.board[from].piece;
            if (!movingPiece) return;

            const prevEval = state.engineEval?.type === 'cp' ? state.engineEval.value : null;
            state.lastEvalBeforeMove = prevEval;

            const move = state.legalMoves.find((m) => m.index === to);
            const opponent = movingPiece.color === 'white' ? 'black' : 'white';

            const fromSquare = indexToSquare(from);
            const toSquare = indexToSquare(to);

            let notation = `${fromSquare} → ${toSquare}`;

            /* ----- EN PASSANT CAPTURE ----- */
            if (move?.enPassant !== undefined && movingPiece.type === 'pawn') {
                state.board[move.enPassant].piece = null;
                notation = `${fromSquare} × ${toSquare}`;
            }

            /* ----- CASTLING ----- */
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

            /* ----- NORMAL CAPTURE ----- */
            if (move?.capture) {
                notation = `${fromSquare} × ${toSquare}`;
            }

            /* ----- MOVE PIECE ----- */
            state.board[to].piece = {
                ...movingPiece,
                hasMoved: true,
            };
            state.board[from].piece = null;

            /* ----- EN PASSANT TARGET ----- */
            state.enPassantTarget =
                movingPiece.type === 'pawn' && Math.abs(from - to) === 16 ? (from + to) / 2 : null;

            /* ----- TURN SWITCH ----- */
            state.turn = opponent;

            /* ----- CHECK / CHECKMATE ----- */
            state.inCheck = isKingInCheck(state.board, state.turn);

            if (state.inCheck && !hasAnyLegalMoves(state.board, state.turn)) {
                state.gameOver = true;
                state.winner = opponent === 'white' ? 'black' : 'white';
            }

            /* ----- LAST MOVE ARROW ----- */
            state.lastMoveFrom = from;
            state.lastMoveTo = to;

            /* ----- MOVE HISTORY ----- */
            state.moveHistory.push({
                notation,
                annotation: null,
            });

            state.selectedIndex = null;
            state.legalMoves = [];
        },

        /* ---------- UI / ANALYSIS ---------- */
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

        setPromotion: (state, action: PayloadAction<{ index: number }>) => {
            state.promotion = { index: action.payload.index };
        },

        clearPromotion: (state) => {
            state.promotion = null;
        },

        /* ---------- ENGINE ---------- */

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

        setGameFromServer: (state, action: PayloadAction<ServerGame>) => {
            state.gameId = action.payload.id;
            state.board = action.payload.board;
            state.turn = action.payload.turn;
            state.enPassantTarget = action.payload.enPassantTarget;
            state.gameOver = action.payload.status === 'ended';
            state.winner = action.payload.winner ?? null;
            state.endReason = action.payload.endReason ?? null;

            state.disconnectedDeadline = action.payload.disconnectedDeadline ?? null;
            state.disconnectedColor = action.payload.disconnectedColor ?? null;

            // Determine user color
            if (action.payload.players.white?.socketId === socket.id) {
                state.myColor = 'white';
            } else if (action.payload.players.black?.socketId === socket.id) {
                state.myColor = 'black';
            } else {
                state.myColor = null;
            }

            state.selectedIndex = null;
            state.legalMoves = [];
        },
    },
});

/* =====================================================
   EXPORTS
===================================================== */

export const {
    movePiece,
    selectPiece,
    clearSelection,
    setPromotion,
    clearPromotion,
    toggleBoard,
    setMoveAnnotation,
    setEngineEval,
    resetGame,
    setGameFromServer,
} = chessSlice.actions;

export default chessSlice.reducer;
