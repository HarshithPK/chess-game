import { Link } from 'react-router-dom';

function Home() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6">
            <h1 className="text-3xl font-bold">♟ Chess App</h1>

            <Link
                to="/play"
                className="bg-vs-accent hover:bg-vs-accent/80 rounded-lg px-6 py-3 transition"
            >
                Play Game
            </Link>
        </div>
    );
}

export default Home;
