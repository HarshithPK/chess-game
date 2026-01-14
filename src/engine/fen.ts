import type { BoardState } from '../types/chess';

const pieceMap: Record<string, string> = {
    pawn: 'p',
    rook: 'r',
    knight: 'n',
    bishop: 'b',
    queen: 'q',
    king: 'k',
};

export function getCastlingRights(board: BoardState): string {
    let rights = '';

    const e1 = board[60].piece;
    const a1 = board[56].piece;
    const h1 = board[63].piece;

    const e8 = board[4].piece;
    const a8 = board[0].piece;
    const h8 = board[7].piece;

    if (e1?.type === 'king' && !e1.hasMoved) {
        if (h1?.type === 'rook' && !h1.hasMoved) rights += 'K';
        if (a1?.type === 'rook' && !a1.hasMoved) rights += 'Q';
    }

    if (e8?.type === 'king' && !e8.hasMoved) {
        if (h8?.type === 'rook' && !h8.hasMoved) rights += 'k';
        if (a8?.type === 'rook' && !a8.hasMoved) rights += 'q';
    }

    return rights || '-';
}

export function boardToFEN(
    board: BoardState,
    turn: 'white' | 'black',
    enPassantTarget: number | null,
    castling: string
): string {
    let fen = '';

    for (let row = 0; row < 8; row++) {
        let empty = 0;

        for (let col = 0; col < 8; col++) {
            const piece = board[row * 8 + col].piece;

            if (!piece) {
                empty++;
            } else {
                if (empty) {
                    fen += empty;
                    empty = 0;
                }
                const p = pieceMap[piece.type];
                fen += piece.color === 'white' ? p.toUpperCase() : p;
            }
        }

        if (empty) fen += empty;
        if (row < 7) fen += '/';
    }

    const ep =
        enPassantTarget !== null
            ? `${'abcdefgh'[enPassantTarget % 8]}${8 - Math.floor(enPassantTarget / 8)}`
            : '-';

    fen += ` ${turn === 'white' ? 'w' : 'b'} ${castling} ${ep} 0 1`;

    console.log('Fen: ', fen);

    return fen;
}
