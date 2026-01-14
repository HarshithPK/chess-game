import { ChessQueen, ChessRook, ChessBishop, ChessKnight } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { promotePawn } from '../features/chess/chessSlice';

const OPTIONS = [
    { type: 'queen', Icon: ChessQueen },
    { type: 'rook', Icon: ChessRook },
    { type: 'bishop', Icon: ChessBishop },
    { type: 'knight', Icon: ChessKnight },
] as const;

export default function PromotionModal() {
    const promotion = useAppSelector((s) => s.chess.promotion);
    const dispatch = useAppDispatch();

    if (!promotion) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="rounded-xl bg-slate-800 p-6 shadow-xl">
                <h2 className="mb-4 text-center text-lg font-semibold text-white">
                    Choose Promotion
                </h2>

                <div className="flex gap-4">
                    {OPTIONS.map(({ type, Icon }) => (
                        <button
                            key={type}
                            onClick={() => dispatch(promotePawn(type))}
                            className="rounded-lg bg-slate-700 p-3 hover:bg-slate-600"
                        >
                            <Icon
                                className={`h-10 w-10 ${
                                    promotion.color === 'white'
                                        ? 'text-slate-100'
                                        : 'text-slate-950'
                                }`}
                            />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
