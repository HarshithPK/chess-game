import { useEffect, useRef } from 'react';
import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import {
    ChessKing,
    ChessQueen,
    ChessBishop,
    ChessKnight,
    ChessRook,
    ChessPawn,
} from 'lucide-react';

import { useAppDispatch, useAppSelector } from '../app/hooks';
import { selectPiece, clearSelection } from '../features/chess/chessSlice';
import type { Piece as PieceType } from '../types/chess';

const ICONS = {
    king: ChessKing,
    queen: ChessQueen,
    rook: ChessRook,
    bishop: ChessBishop,
    knight: ChessKnight,
    pawn: ChessPawn,
};

interface PieceProps {
    piece: PieceType;
    index: number;
    disabled?: boolean;
}

function Piece({ piece, index, disabled = false }: PieceProps) {
    const ref = useRef<HTMLDivElement | null>(null);
    const dispatch = useAppDispatch();

    const { myColor, turn, gameOver, promotion, disconnectedColor } = useAppSelector(
        (s) => s.chess
    );

    /** ✅ SINGLE SOURCE OF TRUTH FOR INTERACTION */
    const canInteract =
        myColor !== null &&
        !gameOver &&
        promotion === null &&
        disconnectedColor === null &&
        piece.color === myColor &&
        turn === myColor &&
        !disabled;

    // 🔁 Board orientation derived from player color
    const isFlipped = myColor === 'black';

    useEffect(() => {
        if (!ref.current || !canInteract) return;

        return draggable({
            element: ref.current,

            onDragStart: () => {
                dispatch(clearSelection());
                dispatch(selectPiece(index));
            },

            onDrag: ({ location }) => {
                if (location.current.dropTargets.length === 0) {
                    dispatch(clearSelection());
                }
            },

            getInitialData: () => ({
                fromIndex: index,
            }),
        });
    }, [canInteract, index, dispatch]);

    // 🛑 HARD GUARD — prevents all hydration crashes
    if (!piece || !piece.type || !piece.color) {
        return null;
    }

    const Icon = ICONS[piece.type];

    return (
        <div
            ref={ref}
            className={`transition-transform duration-500 ${
                isFlipped ? 'rotate-180' : ''
            } ${canInteract ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none opacity-40'}`}
        >
            <Icon
                className={`h-10 w-10 ${
                    piece.color === 'white' ? 'text-slate-100' : 'text-slate-950'
                }`}
                strokeWidth={1.8}
            />
        </div>
    );
}

export default Piece;
