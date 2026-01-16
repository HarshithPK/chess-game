import { useAppSelector } from '../app/hooks';

function WaitingOverlay() {
    const { gameStatus, myColor } = useAppSelector((s) => s.chess);

    // Spectators should NOT see this
    if (myColor === null) return null;

    if (gameStatus !== 'waiting') return null;

    return (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-black/60 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3 text-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/30 border-t-white" />
                <p className="text-sm text-white/90">Waiting for opponent to join…</p>
                <p className="text-xs text-white/50">Share the game link to invite them</p>
            </div>
        </div>
    );
}

export default WaitingOverlay;
