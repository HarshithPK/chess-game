import type { BoardState, GameEndReason } from './chess';

export type PlayerColor = 'white' | 'black';

export interface Player {
    socketId: string;
    color: PlayerColor;
    playerId: string;
}

export interface ServerGame {
    id: string;
    status: 'waiting' | 'active' | 'ended';
    board: BoardState;
    turn: PlayerColor;
    enPassantTarget: number | null;

    players: {
        white?: Player;
        black?: Player;
    };

    winner: PlayerColor;
    endReason: GameEndReason;

    disconnectedColor?: PlayerColor;
    disconnectedDeadline?: number;
}
