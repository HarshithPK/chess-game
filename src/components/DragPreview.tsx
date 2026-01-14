import {
    ChessKing,
    ChessQueen,
    ChessBishop,
    ChessKnight,
    ChessRook,
    ChessPawn,
} from 'lucide-react';

import type { Piece } from '../types/chess';

const ICONS = {
    king: ChessKing,
    queen: ChessQueen,
    rook: ChessRook,
    bishop: ChessBishop,
    knight: ChessKnight,
    pawn: ChessPawn,
};

export default function DragPreview({ piece }: { piece: Piece }) {
    const Icon = ICONS[piece.type];

    return (
        <div className="pointer-events-none scale-110 opacity-80">
            <Icon
                className={`h-12 w-12 ${
                    piece.color === 'white' ? 'text-slate-100' : 'text-slate-950'
                }`}
                strokeWidth={1.8}
            />
        </div>
    );
}

