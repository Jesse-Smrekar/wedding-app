// Library Imports
const express = require('express');
const path = require('path');
const https = require('https');
const fs = require('fs');

// Other JS files
const utils = require('./server/utils/utils.js');
const auth = require('./server/utils/auth.js');
const db = require('./server/utils/db.js');


// Server Constants
const app = express();
app.use(utils.logRequest);
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true })); // For URL-encoded data

if (!process.env.DEBUG) {
  app.use(auth.auth);
}
const sslOptions = {
  key: fs.readFileSync('./certs/server.key'),
  cert: fs.readFileSync('./certs/server.crt')
};
const server = https.createServer(sslOptions, app);


// ==========================================================================
// || Exposed APIs                                                         ||
// ==========================================================================
app.get('/styles.css', (req, res) => {

  res.set('Content-Type', 'text/css');
  res.sendFile(path.join(__dirname, 'public', 'styles.css'));  
});


// home page
app.get('/', (req, res) => {

  res.set('Content-Type', 'text/html');
  res.sendFile(path.join(__dirname, 'public', '/html/home.html'));  
});


// login page
app.get('/login', (req, res) => {

  res.set('Content-Type', 'text/html');
  res.sendFile(path.join(__dirname, 'public', '/html/login.html'));  
});


app.get('/favicon.ico', (req, res) => {

  res.set('Content-Type', 'image/png');
  res.sendFile(path.join(__dirname, 'public', 'images', 'diamond-ring.png'));
});


// login user
app.post('/login/user', async (req, res) => {
  console.log("REQUEST: POST, /login/user");
  auth.generateJWT(req.body.fname, req.body.lname)
  .then( token => {

    console.log(`>>> User: ${req.body.fname} ${req.body.lname} logged in`);

    res.cookie('jwt', token, {
          httpOnly: false, // Prevents client-side JavaScript access to the cookie
          secure: false, //process.env.NODE_ENV === 'production', // Use 'secure' in production for HTTPS
          maxAge: auth.JWT_TTL_MILLIS
      });
    res.redirect('/');
  });

});


// mount admin endpoints
const adminEndpoints = require('./server/routes/admin.js');
app.use('/admin', adminEndpoints);

// mount photos endpoints
const photosEndpoints = require('./server/routes/photos.js');
app.use('/photos', photosEndpoints);


// mount music endpoints
const musicEndpoints = require('./server/routes/music.js');
app.use('/music', musicEndpoints);

// spotify auth endpoint
const spotifyEndpoints = require('./server/routes/spotify.js');
app.use('/spotify', spotifyEndpoints);





// Start the app
app.listen(process.env.HTTP_PORT, () => {
  console.log(`✅ Server listening on port ${process.env.HTTP_PORT}`);
  console.log(`Access by IP: ${utils.getLocalIP()}`)
});

// start https server
server.listen(process.env.HTTPS_PORT, () => {
  console.log(`✅HTTPS available on port ${process.env.HTTPS_PORT}`);
});

db.init();

fs.appendFile(path.join(__dirname, 'server', 'logs', 'conn_logs.txt'), `\n\n--- SERVER START ${new Date().toISOString()} ---\n\n`, ()=>{});
