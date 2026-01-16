import { useAppSelector } from '../app/hooks';
import Square from './Square';
import GameOverBanner from './GameOverBanner';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'];

function Board() {
    const board = useAppSelector((s) => s.chess.board);
    const myColor = useAppSelector((s) => s.chess.myColor);

    const isFlipped = myColor === 'black';

    const files = isFlipped ? [...FILES].reverse() : FILES;
    const ranks = isFlipped ? RANKS : [...RANKS].reverse();

    return (
        <div className="relative">
            <GameOverBanner />

            <div
                className={`aspect-square w-[min(90vw,480px)] overflow-hidden rounded-lg border ${
                    isFlipped ? 'rotate-180' : ''
                }`}
            >
                <div className="grid h-full w-full grid-cols-8">
                    {board.map((_, index) => (
                        <Square key={index} index={index} />
                    ))}
                </div>
            </div>

            <div className="absolute right-0 -bottom-5 left-0 flex justify-between text-xs opacity-70">
                {files.map((f) => (
                    <span key={f} className="w-[12.5%] text-center">
                        {f}
                    </span>
                ))}
            </div>

            <div className="absolute top-0 bottom-0 -left-4 flex flex-col justify-between text-xs opacity-70">
                {ranks.map((r) => (
                    <span key={r}>{r}</span>
                ))}
            </div>
        </div>
    );
}

export default Board;
