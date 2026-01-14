import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { BoardState } from '../../types/chess';
import { initialBoard } from './initialBoard';
import { getLegalMoves, isKingInCheck, hasAnyLegalMoves, type Move } from './moveUtils';

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
    color: 'white' | 'black';
}

interface ChessState {
    board: BoardState;
    turn: 'white' | 'black';
    legalMoves: Move[];
    selectedIndex: number | null;
    promotion: PromotionState | null;
    inCheck: boolean;
    gameOver: boolean;
    winner: 'white' | 'black' | null;

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
}

/* =====================================================
   INITIAL STATE
===================================================== */

const initialState: ChessState = {
    board: initialBoard,
    turn: 'white',
    legalMoves: [],
    selectedIndex: null,
    promotion: null,
    inCheck: false,
    gameOver: false,
    winner: null,
    enPassantTarget: null,
    lastMoveFrom: null,
    lastMoveTo: null,
    isFlipped: false,
    moveHistory: [],
    engineEval: null,
    lastEvalBeforeMove: null,
};

/* =====================================================
   SLICE
===================================================== */

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

            const row = Math.floor(to / 8);

            /* ----- PROMOTION ----- */
            if (
                movingPiece.type === 'pawn' &&
                ((movingPiece.color === 'white' && row === 0) ||
                    (movingPiece.color === 'black' && row === 7))
            ) {
                state.lastMoveFrom = from;
                state.lastMoveTo = to;

                state.inCheck = isKingInCheck(state.board, opponent);

                state.promotion = {
                    index: to,
                    color: movingPiece.color,
                };

                state.moveHistory.push({
                    notation,
                    annotation: null,
                });

                state.selectedIndex = null;
                state.legalMoves = [];
                return;
            }

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

        /* ---------- PROMOTION ---------- */

        promotePawn: (state, action: PayloadAction<'queen' | 'rook' | 'bishop' | 'knight'>) => {
            if (!state.promotion) return;

            const { index, color } = state.promotion;
            const opponent = color === 'white' ? 'black' : 'white';

            state.board[index].piece = {
                type: action.payload,
                color,
                hasMoved: true,
            };

            state.enPassantTarget = null;

            state.inCheck = isKingInCheck(state.board, opponent);

            if (state.inCheck && !hasAnyLegalMoves(state.board, opponent)) {
                state.gameOver = true;
                state.winner = color;
            }

            // finalize promotion notation
            const last = state.moveHistory.length - 1;
            if (last >= 0) {
                state.moveHistory[last].notation += ` = ${action.payload.toUpperCase()}`;
            }

            state.lastMoveTo = index;
            state.promotion = null;
            state.turn = opponent;
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
            state.enPassantTarget = null;
            state.lastMoveFrom = null;
            state.lastMoveTo = null;
            state.isFlipped = false;
            state.moveHistory = [];
            state.engineEval = null;
            state.lastEvalBeforeMove = null;
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
    promotePawn,
    toggleBoard,
    setMoveAnnotation,
    setEngineEval,
    resetGame,
} = chessSlice.actions;

export default chessSlice.reducer;
