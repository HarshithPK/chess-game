import type { Move } from '../features/chess/moveUtils';
import type { BoardState } from '../types/chess';

const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

const indexToSquare = (i: number) => `${files[i % 8]}${8 - Math.floor(i / 8)}`;

function pieceLetter(type: string) {
    switch (type) {
        case 'king':
            return 'K';
        case 'queen':
            return 'Q';
        case 'rook':
            return 'R';
        case 'bishop':
            return 'B';
        case 'knight':
            return 'N';
        default:
            return '';
    }
}

export function toSAN({
    boardBefore,
    from,
    to,
    move,
    isCheck,
    isMate,
}: {
    boardBefore: BoardState;
    from: number;
    to: number;
    move: Move;
    isCheck: boolean;
    isMate: boolean;
}) {
    const piece = boardBefore[from].piece!;
    const target = indexToSquare(to);

    // Castling
    if (piece.type === 'king' && Math.abs(from - to) === 2) {
        return to > from ? 'O-O' : 'O-O-O';
    }

    let san = '';

    if (piece.type !== 'pawn') {
        san += pieceLetter(piece.type);
    }

    if (piece.type === 'pawn' && move.capture) {
        san += files[from % 8];
    }

    if (move.capture) san += 'x';

    san += target;

    if (move.promotion) {
        san += `=${pieceLetter(move.promotion)}`;
    }

    if (isMate) san += '#';
    else if (isCheck) san += '+';

    return san;
}
