import { useEffect, useRef } from 'react';
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';

import { useAppDispatch, useAppSelector } from '../app/hooks';
import { clearSelection, selectPiece } from '../features/chess/chessSlice';
import { socket } from '../socket';

import Piece from './Piece';

interface SquareProps {
    index: number;
}

function Square({ index }: SquareProps) {
    const ref = useRef<HTMLDivElement | null>(null);
    const dispatch = useAppDispatch();

    const {
        board,
        legalMoves,
        selectedIndex,
        turn,
        myColor,
        gameId,
        gameOver,
        promotion,
        disconnectedColor,
        inCheck,
    } = useAppSelector((s) => s.chess);

    const square = board[index];
    const piece = square?.piece ?? null;

    const legalMove = legalMoves.find((m) => m.index === index);

    const row = Math.floor(index / 8);
    const col = index % 8;
    const isDark = (row + col) % 2 === 1;

    const isOrigin = selectedIndex === index;

    const isKingInCheck = piece?.type === 'king' && piece.color === turn && inCheck;

    // 🔒 GLOBAL LOCK
    const isLocked =
        !gameId || gameOver || promotion !== null || disconnectedColor !== null || turn !== myColor;

    /* ================= DROP ================= */

    useEffect(() => {
        if (!ref.current || isLocked) return;

        return dropTargetForElements({
            element: ref.current,

            onDrop: ({ source }) => {
                const fromIndex = source.data.fromIndex as number;

                if (fromIndex === index) return;
                if (!legalMove) return;

                socket.emit('game:move', {
                    gameId,
                    from: fromIndex,
                    to: index,
                });
            },
        });
    }, [index, legalMove, isLocked, gameId]);

    /* ================= CLICK ================= */

    function handleClick() {
        if (isLocked) return;

        if (!piece) {
            dispatch(clearSelection());
            return;
        }

        if (piece.color !== myColor) return;

        dispatch(selectPiece(index));
    }

    return (
        <div
            ref={ref}
            onClick={handleClick}
            className={`flex aspect-square items-center justify-center transition-all duration-150 ${
                isDark ? 'bg-[#1f2a3a]' : 'bg-[#2c3b52]'
            } ${
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
            }`}
        >
            {piece?.type && (
                <Piece piece={piece} index={index} disabled={isLocked || piece.color !== myColor} />
            )}
        </div>
    );
}

export default Square;
