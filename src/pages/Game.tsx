/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react';
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
import WaitingOverlay from '../components/WaitingOverlay';
import InviteLink from '../components/InviteLink';

function Game() {
    const dispatch = useAppDispatch();
    const { gameId } = useParams<{ gameId: string }>();

    const board = useAppSelector((s) => s.chess.board);
    const turn = useAppSelector((s) => s.chess.turn);
    const enPassantTarget = useAppSelector((s) => s.chess.enPassantTarget);
    const myColor = useAppSelector((s) => s.chess.myColor);
    const gameStatus = useAppSelector((s) => s.chess.gameStatus);

    /* ================= ENGINE ================= */

    useEffect(() => {
        stockfishEngine.init(dispatch);
    }, [dispatch]);

    useEffect(() => {
        if (!board.length) return;

        const castling = getCastlingRights(board);
        const fen = boardToFEN(board, turn, enPassantTarget, castling);
        stockfishEngine.evaluatePosition(fen);
    }, [board, turn, enPassantTarget]);

    /* ================= SOCKET ================= */

    useEffect(() => {
        if (!gameId) return;

        const handleGame = (game: any) => {
            dispatch(setGameFromServer(game));
        };

        socket.on('game:created', handleGame);
        socket.on('game:joined', handleGame);
        socket.on('game:update', handleGame);
        socket.on('game:reconnected', handleGame);
        socket.on('game:spectating', handleGame);

        socket.emit('game:joinOrSpectate', gameId);

        return () => {
            socket.off('game:created', handleGame);
            socket.off('game:joined', handleGame);
            socket.off('game:update', handleGame);
            socket.off('game:reconnected', handleGame);
            socket.off('game:spectating', handleGame);
        };
    }, [dispatch, gameId]);

    /* ================= OPPONENT JOIN TOAST ================= */

    const prevStatusRef = useRef(gameStatus);
    const [showOpponentToast, setShowOpponentToast] = useState(false);

    useEffect(() => {
        if (prevStatusRef.current === 'waiting' && gameStatus === 'active') {
            setShowOpponentToast(true);

            const timer = setTimeout(() => {
                setShowOpponentToast(false);
            }, 2500);

            return () => clearTimeout(timer);
        }

        prevStatusRef.current = gameStatus;
    }, [gameStatus]);

    /* ================= UI ================= */

    return (
        <div className="flex min-h-screen flex-col items-center justify-start gap-6 px-4 py-6">
            {/* ===== HEADER ===== */}
            {myColor === null ? (
                <span className="rounded bg-slate-700 px-3 py-1 text-xs text-slate-200">
                    Spectating
                </span>
            ) : (
                <div className="flex w-full max-w-350 items-center justify-between gap-8">
                    <h2 className="text-lg font-medium">
                        You are playing <span className="text-vs-accent capitalize">{myColor}</span>{' '}
                        — Turn: <span className="text-vs-accent capitalize">{turn}</span>
                    </h2>
                    <ResignButton />
                </div>
            )}

            {/* ===== INVITE LINK ===== */}
            <InviteLink />

            <DisconnectBanner />

            {/* ===== TOAST ===== */}
            {showOpponentToast && (
                <div className="animate-fade-in fixed top-4 z-50 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-lg">
                    Opponent joined — game started ♟️
                </div>
            )}

            {/* ===== MAIN LAYOUT ===== */}
            <div className="flex w-full max-w-350 items-start justify-center gap-8">
                {/* LEFT SIDEBAR */}
                <div className="flex flex-col items-center gap-4">
                    <EvalBar />
                </div>

                {/* BOARD */}
                <div className="relative">
                    <Board />

                    {/* Waiting overlay disappears automatically */}
                    {gameStatus === 'waiting' && <WaitingOverlay />}

                    <PromotionModal />
                </div>

                {/* RIGHT SIDEBAR */}
                <MoveHistoryPanel />
            </div>
        </div>
    );
}

export default Game;
