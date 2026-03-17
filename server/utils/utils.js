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

function logRequest(req, res, next) {
    console.log(`REQUEST: ${req.method}, ${req.url}`);

    var IP = req.ip.split(':').at(-1);
    var date = new Date().toISOString();
    var message = `${IP}\t${date}\t${req.url}\n`;
    fs.appendFile(path.join(__dirname, '..', 'logs', 'conn_logs.txt'), message, ()=>{next();});
}

module.exports = {
    getLocalIP, logRequest
};
