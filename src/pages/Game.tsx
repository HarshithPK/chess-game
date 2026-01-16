/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '../app/hooks';
import { setGameFromServer } from '../features/chess/chessSlice';

import { stockfishEngine } from '../engine/stockfish';
import { boardToFEN, getCastlingRights } from '../engine/fen';
import { socket } from '../socket';

import Board from '../components/Board';
import PromotionModal from '../components/PromotionModal';
import MoveHistoryPanel from '../components/MoveHistoryPanel';
import EvalBar from '../components/EvalBar';
import ResignButton from '../components/ResignButton';
import DisconnectBanner from '../components/DisconnectBanner';

function Game() {
    const dispatch = useAppDispatch();
    const { gameId } = useParams<{ gameId: string }>();

    const board = useAppSelector((s) => s.chess.board);
    const turn = useAppSelector((s) => s.chess.turn);
    const enPassantTarget = useAppSelector((s) => s.chess.enPassantTarget);
    const myColor = useAppSelector((s) => s.chess.myColor);

    /* ================= ENGINE INIT ================= */
    useEffect(() => {
        stockfishEngine.init(dispatch);
    }, [dispatch]);

    /* ================= ENGINE EVAL ================= */
    useEffect(() => {
        if (!board.length) return;

        const castling = getCastlingRights(board);
        const fen = boardToFEN(board, turn, enPassantTarget, castling);
        stockfishEngine.evaluatePosition(fen);
    }, [board, turn, enPassantTarget]);

    /* ================= SOCKET SYNC ================= */
    useEffect(() => {
        if (!gameId) return;

        const handleGame = (game: any) => {
            console.log('[SOCKET EVENT RECEIVED]', game);
            dispatch(setGameFromServer(game));
        };

        socket.on('game:state', handleGame);
        socket.on('game:update', handleGame);

        socket.emit('game:state', gameId);

        return () => {
            socket.off('game:state', handleGame);
            socket.off('game:update', handleGame);
        };
    }, [dispatch, gameId]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6">
            {myColor === null ? (
                <span className="rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-300">
                    Spectating
                </span>
            ) : (
                <h2 className="text-lg">
                    You are playing <span className="text-vs-accent capitalize">{myColor}</span> —
                    Turn: <span className="text-vs-accent capitalize">{turn}</span>
                </h2>
            )}

            <DisconnectBanner />

            <div className="flex items-center gap-6">
                <div className="flex items-center gap-4">
                    <EvalBar />
                    {myColor && <ResignButton />}
                </div>

                <div className="relative rounded-2xl bg-linear-to-br from-blue-500/30 via-cyan-400/10 to-indigo-500/30 p-0.5 shadow-[0_0_40px_rgba(59,130,246,0.25)]">
                    <div className="bg-vs-card rounded-2xl p-6">
                        <Board />
                        <PromotionModal />
                    </div>
                </div>

                <MoveHistoryPanel />
            </div>
        </div>
    );
}

export default Game;
