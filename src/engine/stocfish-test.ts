export function testStockfish() {
    const worker = new Worker('/stockfish/stockfish.js');

    worker.onmessage = (e) => {
        console.log('[SF TEST]', e.data);
    };

    worker.onerror = (e) => {
        console.error('[SF ERROR]', e);
    };

    worker.postMessage('uci');
    worker.postMessage('isready');
}
