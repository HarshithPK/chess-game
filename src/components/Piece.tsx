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

    const { myColor, turn, gameOver, promotion, isFlipped } = useAppSelector((s) => s.chess);
    const canDrag =
        !disabled && !gameOver && !promotion && piece.color === myColor && turn === myColor;

    useEffect(() => {
        if (!ref.current || !canDrag) return;

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
    }, [canDrag, index, dispatch]);

    return (
        <div
            ref={ref}
            className={`transition-transform duration-300 ease-out ${isFlipped ? 'rotate-180' : ''} ${
                canDrag
                    ? 'cursor-grab hover:scale-110 hover:drop-shadow-[0_6px_10px_rgba(0,0,0,0.4)] active:cursor-grabbing'
                    : 'cursor-not-allowed opacity-40'
            } `}
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
