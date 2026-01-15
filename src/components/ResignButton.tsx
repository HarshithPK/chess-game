import { socket } from '../socket';
import { useAppSelector } from '../app/hooks';

function ResignButton() {
    const gameId = useAppSelector((s) => s.chess.gameId);
    const gameOver = useAppSelector((s) => s.chess.gameOver);

    if (!gameId || gameOver) return null;

    return (
        <button
            onClick={() => socket.emit('game:resign', { gameId })}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
            Resign
        </button>
    );
}

export default ResignButton;
