import { useAppSelector } from '../app/hooks';

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}

function EvalBar() {
    const evalData = useAppSelector((s) => s.chess.engineEval);
    const myColor = useAppSelector((s) => s.chess.myColor);

    let percentage = 50;
    let label = '0.00';

    if (evalData) {
        if (evalData.type === 'cp') {
            // Clamp centipawns to avoid extreme jumps
            const cp = clamp(evalData.value, -1000, 1000);

            // Convert cp → bar percentage (white advantage)
            percentage = 50 + cp / 20;
            percentage = clamp(percentage, 0, 100);

            label = (cp / 100).toFixed(2);
        } else {
            // Mate score
            percentage = evalData.value > 0 ? 100 : 0;
            label = `#${Math.abs(evalData.value)}`;
        }
    }

    /**
     * 🔁 Perspective flip
     * - White player: white advantage grows upward
     * - Black player: white advantage grows downward
     */
    const whiteHeight = myColor === 'black' ? 100 - percentage : percentage;

    return (
        <div className="relative h-130 w-12 overflow-hidden rounded-full bg-slate-900 shadow-xl">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-linear-to-b from-black via-transparent to-white/20" />

            {/* White advantage bar */}
            <div
                className="absolute bottom-0 w-full bg-white transition-all duration-500 ease-in-out"
                style={{ height: `${whiteHeight}%` }}
            />

            {/* Center marker */}
            <div className="absolute inset-x-0 top-1/2 h-px bg-cyan-400/40" />

            {/* Eval label */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md bg-black/70 px-2 py-0.5 text-xs font-bold text-white shadow">
                {label}
            </div>

            {/* Glow for decisive advantage */}
            {Math.abs(percentage - 50) > 30 && (
                <div
                    className={`pointer-events-none absolute inset-0 ${
                        percentage > 50
                            ? 'shadow-[inset_0_0_20px_rgba(255,255,255,0.35)]'
                            : 'shadow-[inset_0_0_20px_rgba(0,0,0,0.6)]'
                    }`}
                />
            )}
        </div>
    );
}

export default EvalBar;
