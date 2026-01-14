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

export default function Piece({ piece, index, disabled = false }: PieceProps) {
    const ref = useRef<HTMLDivElement | null>(null);

    const dispatch = useAppDispatch();
    const Icon = ICONS[piece.type];

    const isFlipped = useAppSelector((s) => s.chess.isFlipped);

    useEffect(() => {
        if (!ref.current || disabled) return;

        return draggable({
            element: ref.current,

            // ✅ This IS supported
            onDragStart: () => {
                dispatch(clearSelection());
                dispatch(selectPiece(index));
            },

            // ✅ Runs continuously during drag
            // If drag ends without a valid drop, Square.tsx never fires movePiece
            // so we safely clear selection here
            onDrag: ({ location }) => {
                if (location.current.dropTargets.length === 0) {
                    dispatch(clearSelection());
                }
            },

            getInitialData: () => ({
                fromIndex: index,
                piece,
            }),
        });
    }, [index, piece, disabled, dispatch]);

    return (
        <div
            ref={ref}
            className={`transition-transform duration-500 ease-in-out ${isFlipped ? 'rotate-180' : ''} ${
                disabled ? 'cursor-not-allowed opacity-40' : 'cursor-grab active:cursor-grabbing'
            } animate-[pulse_0.6s_ease-out] hover:scale-110 hover:drop-shadow-[0_6px_10px_rgba(0,0,0,0.4)]`}
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
