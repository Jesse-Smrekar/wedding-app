const path = require('path');
const fs = require('fs');
const os = require('os');


function getLocalIP() {
    const networkInterfaces = os.networkInterfaces();
    for (const name of Object.keys(networkInterfaces)) {
        for (const net of networkInterfaces[name]) {
            if (net.family === 'IPv4' && !net.internal) {
            return net.address;
            }
        }
    }
}

const LOG_PATH = path.join(__dirname, '..', 'logs', 'conn_logs.txt');
const LOG_DIR  = path.dirname(LOG_PATH);

function logRequest(req, res, next) {
    console.log(`REQUEST: ${req.method}, ${req.url}`);

    var IP = req.ip ? req.ip.split(':').at(-1) : 'unknown';
    var date = new Date().toISOString();
    var message = `${IP}\t${date}\t${req.url}\n`;

    fs.mkdir(LOG_DIR, { recursive: true }, (mkdirErr) => {
        if (mkdirErr) {
            console.warn('Failed to create log directory:', mkdirErr.message);
            return next();
        }
        fs.appendFile(LOG_PATH, message, (err) => {
            if (err) console.warn('Failed to write to conn_logs.txt:', err.message);
            next();
        });
    });
}

module.exports = {
    getLocalIP, logRequest
};
