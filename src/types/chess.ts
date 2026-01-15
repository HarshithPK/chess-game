export type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';

export type Color = 'white' | 'black';

export type GameEndReason = 'checkmate' | 'resign' | 'disconnect' | null;

export interface Piece {
    type: PieceType;
    color: Color;
    hasMoved?: boolean;
}

export type Square = {
    piece: Piece | null;
};

export type BoardState = Square[];
