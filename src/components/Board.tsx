import { useAppSelector } from '../app/hooks';

import GameOverBanner from './GameOverBanner';
import Square from './Square';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'];

function Board() {
    const board = useAppSelector((state) => state.chess.board);
    const isFlipped = useAppSelector((s) => s.chess.isFlipped);

    const files = isFlipped ? [...FILES].reverse() : FILES;
    const ranks = isFlipped ? RANKS : [...RANKS].reverse();

    return (
        <div className="perspective-1000 relative transition-transform duration-300 ease-out hover:scale-[1.008] hover:shadow-[0_0_0_1px_rgba(59,130,246,0.15)]">
            <GameOverBanner />

            {/* Board container */}
            <div
                className={`border-vs-border transform-style-preserve-3d aspect-square w-[min(90vw,480px)] overflow-hidden rounded-lg border transition-transform duration-1700 ease-in-out ${
                    isFlipped ? 'rotate-180' : ''
                }`}
            >
                <div className="grid h-full w-full grid-cols-8">
                    {board.map((_, index) => (
                        <Square key={index} index={index} />
                    ))}
                </div>
            </div>

            {/* FILE labels (a–h) */}
            <div className="text-vs-text-secondary/70 pointer-events-none absolute right-0 -bottom-5 left-0 flex justify-between px-1 text-xs font-medium">
                {files.map((f) => (
                    <span key={f} className="w-[12.5%] text-center">
                        {f}
                    </span>
                ))}
            </div>

            {/* RANK labels (1–8) */}
            <div className="text-vs-text-secondary/70 pointer-events-none absolute top-0 bottom-0 -left-4 flex flex-col justify-between py-1 text-xs font-medium">
                {ranks.map((r) => (
                    <span key={r} className="flex h-[12.5%] items-center">
                        {r}
                    </span>
                ))}
            </div>
        </div>
    );
}

export default Board;
