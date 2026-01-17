import { useState } from 'react';

import { useAppSelector } from '../app/hooks';

function InviteLink() {
    const gameId = useAppSelector((s) => s.chess.gameId);
    const gameStatus = useAppSelector((s) => s.chess.gameStatus);
    const myColor = useAppSelector((s) => s.chess.myColor);

    const [copied, setCopied] = useState(false);

    // 🔒 Only show for creator while waiting
    if (!gameId || gameStatus !== 'waiting' || myColor !== 'white') {
        return null;
    }

    const inviteUrl = `${window.location.origin}/play/${gameId}`;

    async function copyLink() {
        await navigator.clipboard.writeText(inviteUrl);
        setCopied(true);

        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <div className="w-full max-w-md rounded-xl bg-slate-800 p-4 shadow-lg">
            <p className="mb-2 text-sm font-medium text-slate-200">Invite your opponent</p>

            <div className="flex items-center gap-2">
                <input
                    readOnly
                    value={inviteUrl}
                    className="flex-1 rounded-md bg-slate-900 px-3 py-2 text-xs text-slate-300 outline-none"
                />

                <button
                    onClick={copyLink}
                    className="bg-vs-accent hover:bg-vs-accent/80 rounded-md px-3 py-2 text-xs font-medium text-white transition"
                >
                    {copied ? 'Copied!' : 'Copy'}
                </button>
            </div>

            <p className="mt-2 text-xs text-slate-400">
                The game will start automatically when they join
            </p>
        </div>
    );
}

export default InviteLink;
