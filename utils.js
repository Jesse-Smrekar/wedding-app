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

module.exports = {
    getLocalIP
};