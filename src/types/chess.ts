export type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';

export type Color = 'white' | 'black';

export type GameEndReason =
    | 'checkmate'
    | 'resign'
    | 'disconnect'
    | 'stalemate'
    | 'threefold'
    | 'fifty-move'
    | 'insufficient-material'
    | 'timeout'
    | null;

export type GameStatus = 'waiting' | 'active' | 'ended';

export interface Piece {
    id: string;
    type: PieceType;
    color: Color;
    hasMoved?: boolean;
}

export type Square = {
    piece: Piece | null;
};

export type BoardState = Square[];
