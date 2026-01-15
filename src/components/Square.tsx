import { useEffect, useRef } from 'react';
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';

import { useAppDispatch, useAppSelector } from '../app/hooks';
import { selectPiece, clearSelection } from '../features/chess/chessSlice';
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
        turn,
        inCheck,
        gameOver,
        promotion,
        selectedIndex,
        myColor,
        gameId,
    } = useAppSelector((state) => state.chess);

    const square = board[index];
    const piece = square.piece;

    const legalMove = legalMoves.find((m) => m.index === index);

    const row = Math.floor(index / 8);
    const col = index % 8;
    const isDark = (row + col) % 2 === 1;

    const isOrigin = selectedIndex === index;
    const isKingInCheck = piece?.type === 'king' && piece.color === turn && inCheck;

    useEffect(() => {
        if (!ref.current) return;

        return dropTargetForElements({
            element: ref.current,
            onDrop: ({ source }) => {
                if (gameOver || promotion || !legalMove || !gameId) return;

                const fromIndex = source.data.fromIndex as number;
                if (fromIndex === index) return;

                socket.emit('game:move', {
                    gameId,
                    from: fromIndex,
                    to: index,
                });
            },
        });
    }, [gameId, legalMove, gameOver, promotion, index]);

    return (
        <div
            ref={ref}
            style={{
                backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 0)',
                backgroundSize: '14px 14px',
            }}
            className={`flex aspect-square items-center justify-center transition-all duration-150 ${isDark ? 'bg-[#1f2a3a]' : 'bg-[#2c3b52]'} ${isOrigin ? 'shadow-[inset_0_0_0_2px_rgb(59,130,246)]' : ''} ${
                legalMove
                    ? legalMove.capture
                        ? 'shadow-[inset_0_0_0_2px_rgba(239,68,68,0.9)]'
                        : 'shadow-[inset_0_0_0_2px_rgba(16,185,129,0.9)]'
                    : ''
            } ${
                isKingInCheck ? 'bg-red-500/20 shadow-[inset_0_0_0_3px_rgba(239,68,68,0.9)]' : ''
            } `}
            onClick={() => {
                if (gameOver || promotion || !piece || piece.color !== myColor || turn !== myColor)
                    return;

                dispatch(clearSelection());
                dispatch(selectPiece(index));
            }}
        >
            {piece && (
                <Piece
                    piece={piece}
                    index={index}
                    disabled={piece.color !== myColor || turn !== myColor}
                />
            )}
        </div>
    );
}

export default Square;
