// Library Imports
const express = require('express');
const path = require('path');
// const https = require('https');
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
app.use(auth.auth);


// console.log("SERVER SSL KEY: " + process.env.SERVER_SSL_KEY_B64)
// console.log("SERVER SSL CERT: " + process.env.SERVER_SSL_CERT_B64)
// const sslOptions = {
//   key: atob(process.env.SERVER_SSL_KEY_B64),
//   cert: atob(process.env.SERVER_SSL_CERT_B64)
// };
// const server = https.createServer(sslOptions, app);


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

// itinerary page
app.get('/itinerary', (req, res) => {

  res.set('Content-Type', 'text/html');
  res.sendFile(path.join(__dirname, 'public', '/html/itinerary.html'));  
});

// directions page
app.get('/directions', (req, res) => {

  res.set('Content-Type', 'text/html');
  res.sendFile(path.join(__dirname, 'public', '/html/directions.html'));  
});

app.get('/favicon.ico', (req, res) => {

  res.set('Content-Type', 'image/png');
  res.sendFile(path.join(__dirname, 'public', 'images', 'diamond-ring.png'));
});


// login user
app.post('/login/user', async (req, res) => {
  console.log("REQUEST: POST, /login/user");

  const fname = (req.body.fname || '').trim();
  const lname = (req.body.lname || '').trim();

  if (!fname || !lname) {
    return res.status(400).send('First and last name are required.');
  }

  auth.generateJWT(fname, lname)
  .then( token => {

    console.log(`>>> User: ${fname} ${lname} logged in`);

    res.cookie('jwt', token, {
          httpOnly: true, // Prevents client-side JavaScript access to the cookie
          secure: process.env.NODE_ENV === 'production', // Use 'secure' in production for HTTPS
          sameSite: 'lax',
          maxAge: auth.JWT_TTL_MILLIS
      });
    res.redirect('/');
  })
  .catch(err => {
    console.error(`Login error for ${fname} ${lname}:`, err);
    res.status(500).send('Login failed. Please try again.');
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
// server.listen(process.env.HTTPS_PORT, () => {
//   console.log(`✅HTTPS available on port ${process.env.HTTPS_PORT}`);
// });

db.init().catch(err => {
  console.error('❌ Database initialization failed:', err);
});

fs.appendFile(path.join(__dirname, 'server', 'logs', 'conn_logs.txt'), `\n\n--- SERVER START ${new Date().toISOString()} ---\n\n`, ()=>{});

// Global error handler — catches any error passed to next(err) or unhandled throws in async routes
app.use((err, req, res, next) => {
  console.error(`Unhandled error on ${req.method} ${req.path}:`, err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'An unexpected server error occurred.' });
});
