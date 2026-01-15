import { useEffect, useState } from 'react';
import { useAppSelector } from '../app/hooks';

export default function DisconnectBanner() {
    const { disconnectedDeadline, disconnectedColor, myColor, gameOver } = useAppSelector(
        (s) => s.chess
    );

    const [secondsLeft, setSecondsLeft] = useState(0);

    useEffect(() => {
        if (!disconnectedDeadline) return;

        const tick = () => {
            const remaining = Math.max(0, Math.ceil((disconnectedDeadline - Date.now()) / 1000));
            setSecondsLeft(remaining);
        };

        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [disconnectedDeadline]);

    if (!disconnectedDeadline || gameOver) return null;

    const isOpponentDisconnected = disconnectedColor !== myColor;

    return (
        <div className="absolute inset-0 top-4 left-1/2 z-40 -translate-x-1/2 rounded-xl bg-amber-500/90 px-6 py-3 text-center shadow-xl">
            <p className="text-sm font-semibold text-black">
                {isOpponentDisconnected ? 'Opponent disconnected' : 'You are disconnected'}
            </p>
            <p className="text-xs text-black/80">Game will end in {secondsLeft}s</p>
        </div>
    );
}
