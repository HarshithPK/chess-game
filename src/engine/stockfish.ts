import type { Dispatch } from '@reduxjs/toolkit';
import { setEngineEval } from '../features/chess/chessSlice';

class StockfishEngine {
    private worker: Worker | null = null;
    private ready = false;
    private dispatch: Dispatch | null = null;
    private pendingFen: string | null = null;

    init(dispatch: Dispatch) {
        if (this.worker) return;

        this.dispatch = dispatch;
        this.worker = new Worker('/stockfish/stockfish.js');

        this.worker.onmessage = (e) => {
            const msg = String(e.data);
            this.handleMessage(msg);
        };

        this.worker.onerror = (e) => {
            console.error('[SF ERROR]', e);
        };

        this.send('uci');
    }

    private handleMessage(message: string) {
        if (message === 'uciok') {
            this.send('isready');
            return;
        }

        if (message === 'readyok') {
            this.ready = true;
            this.send('ucinewgame');

            // 🔥 Run analysis if a FEN was queued
            if (this.pendingFen) {
                this.runAnalysis(this.pendingFen);
                this.pendingFen = null;
            }
            return;
        }

        if (message.includes('score cp')) {
            const match = message.match(/score cp (-?\d+)/);
            if (match && this.dispatch) {
                this.dispatch(
                    setEngineEval({
                        type: 'cp',
                        value: parseInt(match[1], 10),
                    })
                );
            }
        }

        if (message.includes('score mate')) {
            const match = message.match(/score mate (-?\d+)/);
            if (match && this.dispatch) {
                this.dispatch(
                    setEngineEval({
                        type: 'mate',
                        value: parseInt(match[1], 10),
                    })
                );
            }
        }
    }

    evaluatePosition(fen: string) {
        if (!this.worker) return;

        // 🧠 Queue if engine not ready yet
        if (!this.ready) {
            this.pendingFen = fen;
            return;
        }

        this.runAnalysis(fen);
    }

    private runAnalysis(fen: string) {
        if (!this.worker) return;

        this.send('stop');
        this.send(`position fen ${fen}`);
        this.send('go depth 15');
    }

    private send(cmd: string) {
        this.worker?.postMessage(cmd);
    }
}

export const stockfishEngine = new StockfishEngine();
