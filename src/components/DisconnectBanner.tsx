/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { useAppSelector } from '../app/hooks';

function formatSeconds(ms: number) {
    return Math.max(0, Math.ceil(ms / 1000));
}

export default function DisconnectBanner() {
    const { disconnectedColor, disconnectedDeadline, gameOver } = useAppSelector((s) => s.chess);

    const [remaining, setRemaining] = useState<number | null>(null);

    useEffect(() => {
        if (!disconnectedDeadline) {
            setRemaining(null);
            return;
        }

        const update = () => {
            const diff = disconnectedDeadline - Date.now();
            setRemaining(formatSeconds(diff));
        };

        update();
        const interval = setInterval(update, 1000);

        return () => clearInterval(interval);
    }, [disconnectedDeadline]);

    // Nothing to show
    if (!disconnectedColor || !disconnectedDeadline || gameOver) return null;

    return (
        <div className="relative z-40 mb-2 w-full max-w-120 rounded-xl border border-red-500/30 bg-red-900/30 px-4 py-3 shadow-lg backdrop-blur">
            <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-red-200">
                    {disconnectedColor === 'white' ? 'White' : 'Black'} disconnected
                </span>

                <span className="font-mono text-red-300">
                    {remaining !== null ? `${remaining}s to forfeit` : ''}
                </span>
            </div>
        </div>
    );
}
