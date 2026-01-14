import { useEffect, useRef } from 'react';
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';

import { useAppDispatch, useAppSelector } from '../app/hooks';
import { movePiece, selectPiece, clearSelection } from '../features/chess/chessSlice';

import Piece from './Piece';

interface SquareProps {
    index: number;
}

export default function Square({ index }: SquareProps) {
    const ref = useRef<HTMLDivElement | null>(null);
    const dispatch = useAppDispatch();

    const { board, legalMoves, turn, inCheck, gameOver, promotion, selectedIndex } = useAppSelector(
        (state) => state.chess
    );

    const square = board[index];
    const legalMove = legalMoves.find((m) => m.index === index);
    const piece = square.piece;

    const row = Math.floor(index / 8);
    const col = index % 8;
    const isDark = (row + col) % 2 === 1;

    const isKingInCheck = piece?.type === 'king' && piece.color === turn && inCheck;

    const isOrigin = selectedIndex === index;

    useEffect(() => {
        if (!ref.current) return;

        return dropTargetForElements({
            element: ref.current,
            onDrop: ({ source }) => {
                if (gameOver || promotion) return;

                const fromIndex = source.data.fromIndex as number;
                if (fromIndex === index) return;
                if (!legalMove) return;

                dispatch(movePiece({ from: fromIndex, to: index }));
            },
        });
    }, [dispatch, index, legalMove, gameOver, promotion]);

    return (
        <div
            ref={ref}
            style={{
                backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 0)',
                backgroundSize: '14px 14px',
            }}
            className={`flex aspect-square items-center justify-center transition-all duration-150 ${isDark ? 'bg-[#1f2a3a]' : 'bg-[#2c3b52]'} ${
                isOrigin
                    ? 'rounded-sm shadow-[inset_0_0_0_2px_rgb(59,130,246),0_0_10px_rgba(59,130,246,0.6)]'
                    : ''
            } ${
                legalMove
                    ? legalMove.capture
                        ? 'rounded-sm shadow-[inset_0_0_0_2px_rgba(239,68,68,0.9),0_0_12px_rgba(239,68,68,0.7)]'
                        : 'rounded-sm shadow-[inset_0_0_0_2px_rgba(16,185,129,0.9),0_0_12px_rgba(16,185,129,0.7)]'
                    : ''
            } ${
                isKingInCheck
                    ? 'animate-pulse rounded-sm bg-red-500/20 shadow-[inset_0_0_0_3px_rgba(239,68,68,0.9),0_0_12px_rgba(239,68,68,0.7)]'
                    : ''
            } hover:scale-[1.02]`}
            onClick={() => {
                if (gameOver || promotion) return;
                dispatch(clearSelection());
                dispatch(selectPiece(index));
            }}
        >
            {piece && (
                <Piece
                    piece={piece}
                    index={index}
                    disabled={gameOver || promotion !== null || piece.color !== turn}
                />
            )}
        </div>
    );
}
