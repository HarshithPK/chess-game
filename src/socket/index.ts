import { io } from 'socket.io-client';

import { store } from '../app/store';
import { setPromotion } from '../features/chess/chessSlice';

const PLAYER_ID_KEY = 'chess_player_id';

function getPlayerId() {
    let id = localStorage.getItem(PLAYER_ID_KEY);
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(PLAYER_ID_KEY, id);
    }
    return id;
}

export const socket = io(import.meta.env.VITE_API_URL, {
    autoConnect: true,
    auth: {
        playerId: getPlayerId(),
    },
});

socket.on(`game:promotionRequired`, ({ index }) => {
    store.dispatch(
        setPromotion({
            index,
        })
    );
});
