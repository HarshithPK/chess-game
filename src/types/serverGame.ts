import type { BoardState, GameEndReason } from './chess';

export type PlayerColor = 'white' | 'black';

export interface Player {
    socketId: string;
    color: PlayerColor;
}

export interface ServerGame {
    id: string;
    status: 'waiting' | 'active' | 'ended';
    board: BoardState;
    turn: PlayerColor;

    players: {
        white?: Player;
        black?: Player;
    };

    enPassantTarget: number | null;
    winner: PlayerColor;
    endReason: GameEndReason;
}
