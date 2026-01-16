/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';

function Home() {
    const navigate = useNavigate();
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const handleConnect = () => {
            console.log('[SOCKET] connected');
            setReady(true);
        };

        const handleGameCreated = (game: any) => {
            navigate(`/play/${game.id}`);
        };

        // ✅ IMPORTANT: handle already-connected socket
        if (socket.connected) {
            setReady(true);
        }

        socket.on('connect', handleConnect);
        socket.on('game:created', handleGameCreated);

        return () => {
            socket.off('connect', handleConnect);
            socket.off('game:created', handleGameCreated);
        };
    }, [navigate]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6">
            <h1 className="text-3xl font-bold">♟ Chess App</h1>

            <button
                disabled={!ready}
                onClick={() => {
                    console.log('[UI] emitting game:create');
                    socket.emit('game:create');
                }}
                className={`cursor-pointer rounded-lg px-6 py-3 transition ${
                    ready ? 'bg-vs-accent hover:bg-vs-accent/80' : 'cursor-not-allowed bg-slate-600'
                }`}
            >
                {ready ? 'Play Game' : 'Connecting...'}
            </button>
        </div>
    );
}

export default Home;
