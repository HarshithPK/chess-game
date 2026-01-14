import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../app/hooks';

import { toggleBoard } from '../features/chess/chessSlice';
import { stockfishEngine } from '../engine/stockfish';
import { boardToFEN, getCastlingRights } from '../engine/fen';

import Board from '../components/Board';
import PromotionModal from '../components/PromotionModal';
import MoveHistoryPanel from '../components/MoveHistoryPanel';
import EvalBar from '../components/EvalBar';

function Game() {
    const dispatch = useAppDispatch();

    const board = useAppSelector((s) => s.chess.board);
    const turn = useAppSelector((s) => s.chess.turn);
    const isFlipped = useAppSelector((s) => s.chess.isFlipped);
    const enPassantTarget = useAppSelector((s) => s.chess.enPassantTarget);

    /* ===============================
       ENGINE INIT (ONCE)
    =============================== */
    useEffect(() => {
        stockfishEngine.init(dispatch);
    }, [dispatch]);

    /* ===============================
       AUTO BOARD FLIP
    =============================== */
    useEffect(() => {
        if (turn === 'black' && !isFlipped) dispatch(toggleBoard());
        if (turn === 'white' && isFlipped) dispatch(toggleBoard());
    }, [turn, isFlipped, dispatch]);

    /* ===============================
       ENGINE EVALUATION
    =============================== */
    useEffect(() => {
        const castling = getCastlingRights(board);
        const fen = boardToFEN(board, turn, enPassantTarget, castling);

        console.log('[FEN]', fen); // keep for now
        stockfishEngine.evaluatePosition(fen);
    }, [board, turn, enPassantTarget]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6">
            <h2 className="text-lg">
                Turn: <span className="text-vs-accent">{turn === 'white' ? 'White' : 'Black'}</span>
            </h2>

            <div className="flex items-center gap-6">
                <EvalBar />

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
