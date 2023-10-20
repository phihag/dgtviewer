#!/usr/bin/env node

const express = require('express');
const http = require('http');
const { ArgumentParser } = require('argparse');
const { SerialPort } = require('serialport');

const {promisify} = require('util');

async function wait(ms) {
    await new Promise(resolve => setTimeout(resolve, ms));
}


async function main() {
    const parser = new ArgumentParser();
    parser.add_argument('-p', '--port', { help: 'Port to use %(default)s', default: 3000, type: 'int'});
    const args = parser.parse_args();

    const app = express();
    app.get('/', (req, res) => {
      res.send('Hello World!')
    })

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
