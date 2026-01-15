import { useAppDispatch, useAppSelector } from '../app/hooks';
import { resetGame } from '../features/chess/chessSlice';

function GameOverBanner() {
    const dispatch = useAppDispatch();
    const { gameOver, winner, endReason } = useAppSelector((s) => s.chess);

    if (!gameOver || !winner) return null;

    const winnerText = winner === 'white' ? 'White' : 'Black';
    const title =
        endReason === 'resign'
            ? 'Resignation'
            : endReason === 'disconnect'
              ? 'Opponent disconnected'
              : 'Checkmate';

    return (
        <>
            {/* Backdrop */}
            <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm" />

            {/* Modal */}
            <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center">
                <div className="animate-scale-in pointer-events-auto w-62.5 rounded-2xl bg-linear-to-br from-slate-900 to-slate-800 px-10 py-7 text-center shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
                    {/* Title */}
                    <h2 className="text-3xl font-semibold tracking-tight text-white">{title}</h2>

                    {/* Subtitle */}
                    <p className="mt-2 text-lg font-semibold text-slate-300">{winnerText} wins</p>

                    {/* Divider */}
                    <div className="mx-auto mt-4 h-px w-20 bg-linear-to-r from-transparent via-slate-500/60 to-transparent" />

                    {/* Actions (optional but recommended) */}
                    <div className="mt-6 flex justify-center gap-3">
                        <button
                            className="bg-vs-accent rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
                            onClick={() => dispatch(resetGame())}
                        >
                            New Game
                        </button>

                        {/* <button className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-600">
                            Analyze
                        </button> */}
                    </div>
                </div>
            </div>
        </>
    );
}

export default GameOverBanner;
