import { useAppDispatch, useAppSelector } from '../app/hooks';
import { setMoveAnnotation } from '../features/chess/chessSlice';

const ANNOTATIONS = ['!!', '!', '!?', '?!', '?', '??'] as const;

function annotationColor(a: string) {
    if (a === '!!' || a === '!') return 'text-vs-success';
    if (a === '!?' || a === '?!') return 'text-vs-warning';
    return 'text-vs-error';
}

export default function MoveHistoryPanel() {
    const dispatch = useAppDispatch();
    const moveHistory = useAppSelector((s) => s.chess.moveHistory);

    if (moveHistory.length === 0) {
        return (
            <div className="border-vs-border bg-vs-card text-vs-text-secondary flex h-130 w-64 items-center justify-center rounded-xl border text-sm shadow-lg">
                <span>No moves yet</span>
            </div>
        );
    }

    return (
        <div className="bg-vs-card border-vs-border w-80 rounded-xl border p-4 shadow-lg">
            <h3 className="text-vs-text-secondary mb-3 text-sm font-semibold">Move History</h3>

            <ol className="max-h-90 space-y-1 overflow-y-auto pr-1 text-sm">
                {moveHistory.map((move, index) => {
                    const moveNumber = Math.floor(index / 2) + 1;
                    const isWhite = index % 2 === 0;

                    return (
                        <li
                            key={index}
                            className={`group flex items-center gap-2 rounded-md px-2 py-1 hover:bg-slate-700/40 ${index === moveHistory.length - 1 ? 'border-l-2 border-blue-400 bg-blue-500/10' : ''} `}
                        >
                            {isWhite && (
                                <span className="text-vs-text-secondary w-6 text-right">
                                    {moveNumber}.
                                </span>
                            )}
                            {!isWhite && <span className="w-6" />}

                            <span className="text-vs-text whitespace-nowrap">
                                {move.notation}
                                {move.annotation && (
                                    <span
                                        className={`ml-1 font-bold ${annotationColor(
                                            move.annotation
                                        )}`}
                                    >
                                        {move.annotation}
                                    </span>
                                )}
                            </span>

                            {/* Annotation menu */}
                            <div className="ml-auto hidden gap-1 group-hover:flex">
                                {ANNOTATIONS.map((a) => (
                                    <button
                                        key={a}
                                        onClick={() =>
                                            dispatch(
                                                setMoveAnnotation({
                                                    index,
                                                    annotation: a,
                                                })
                                            )
                                        }
                                        className="rounded bg-slate-700/80 px-1.5 text-xs text-slate-200 hover:bg-slate-600"
                                        title={`Mark as ${a}`}
                                    >
                                        {a}
                                    </button>
                                ))}
                                <button
                                    onClick={() =>
                                        dispatch(
                                            setMoveAnnotation({
                                                index,
                                                annotation: null,
                                            })
                                        )
                                    }
                                    className="rounded bg-slate-700/80 px-1.5 text-xs text-slate-300 hover:bg-slate-600"
                                    title="Clear annotation"
                                >
                                    ×
                                </button>
                            </div>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}
