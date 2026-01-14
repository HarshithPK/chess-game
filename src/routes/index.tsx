import { createBrowserRouter } from 'react-router-dom';
import Home from '../pages/Home';
import Game from '../pages/Game';

export const router = createBrowserRouter([
    { path: '/', element: <Home /> },
    { path: '/play', element: <Game /> },
]);
