#!/usr/bin/env node

const fs = require('fs');
const express = require('express');
const http = require('http');
const { ArgumentParser } = require('argparse');
const { SerialPort } = require('serialport');
const path = require('path');

const {promisify} = require('util');

const STATIC_DIR = path.join(__dirname, 'static');

async function wait(ms) {
    await new Promise(resolve => setTimeout(resolve, ms));
}

const EMPTY_POSITION = {};
for (const rank of [8, 7, 6, 5, 4, 3, 2, 1]) {
    for (const file of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
        EMPTY_POSITION[`${file}${rank}`] = null;
    }
}

const FEN_MAP = {
    'whitepawn': 'P',
    'whiteknight': 'N',
    'whitebishop': 'B',
    'whiterook': 'R',
    'whitequeen': 'Q',
    'whiteking': 'K',
    'blackpawn': 'p',
    'blackknight': 'n',
    'blackbishop': 'b',
    'blackrook': 'r',
    'blackqueen': 'q',
    'blackking': 'k',
};

function positionToFEN(position) {
    return [8, 7, 6, 5, 4, 3, 2, 1].map(rank => {
        let res = '';
        let empty = 0;
        for (const file of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
            const piece = position[`${file}${rank}`];
            if (piece === null) {
                empty++;
            } else {
                if (empty > 0) {
                    res += empty;
                }
                res += FEN_MAP[`${piece.color}${piece.role}`];
            }
        }
        if (empty > 0) {
            res += empty;
        }
        return res;
    }).join('/');
}

async function main() {
    const Board = (await import('dgtchess')).default;

    const parser = new ArgumentParser();
    parser.add_argument('-p', '--port', { help: 'Port to use %(default)s', default: 3000, type: 'int'});
    const args = parser.parse_args();

    let state = {
        position: EMPTY_POSITION,
        fen: '8/8/8/8/8/8/8/8',
        connected: false,
    };
    const app = express();
    app.get('/', async (req, res) => {
        res.set('Content-Type', 'text/html');
        const index = await fs.promises.readFile(path.join(STATIC_DIR, 'index.html'));
        res.send(index);
    });
    app.get('/state.json', async (req, res) => {
        res.set('Content-Type', 'application/json');
        res.send(JSON.stringify(state));
    });
    app.use('/static', express.static(STATIC_DIR))

    await promisify(callback => app.listen(args.port, 'localhost', callback))();
    console.log(`Server running at http://localhost:${args.port}/`);

    while (true) {
        const ports = await SerialPort.list();
        const dgtPorts = ports.filter(p => p.vendorId === '045b');
        if (dgtPorts.length === 0) {
            continue;
        }

        const device = dgtPorts[0].path;
        console.log(`Connecting to ${device}`);

        const board = new Board(device);
        const { serialNr, version, position } = await board.reset()
        console.log(serialNr, version, position)
        console.log(`Connected to board ${serialNr} version ${version} at ${device}`);

        const reader = board.getReader();
        while (true) {
            const { value } = await reader.read();
            state.position = value;
            state.fen = positionToFEN(value);
        }
        state.connected = false;
    }
}

if (require.main === module) {
    (async () => {
        try {
            await main();
        } catch (e) {
            console.error(e.stack); // eslint-disable-line no-console
            process.exit(2);
        }
    })();
}
