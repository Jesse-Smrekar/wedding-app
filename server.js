// Library Imports
const express = require('express');
const path = require('path');
// Other JS files
const utils = require('./server/utils/utils.js');
const auth = require('./server/utils/auth.js');

// Server Constants
const app = express();
const port = 3000;
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true })); // For URL-encoded data


app.use(utils.logRequest);
app.use(auth.auth);



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


// login user
app.post('/login/user', async (req, res) => {
  console.log("REQUEST: GET, /login/user");

  if (!token) {
    console.log(`No login found for user, creating a new user: ${'jesse smrekar'}`)
      var token = auth.generateJWT('jesse', 'smrekar');
  }

  res.cookie('jwt', token, {
        httpOnly: true, // Prevents client-side JavaScript access to the cookie
        secure: false, //process.env.NODE_ENV === 'production', // Use 'secure' in production for HTTPS
        maxAge: auth.JWT_TTL_MILLIS
    });
  res.set('Content-Type', 'text/html');
  res.sendFile(path.join(__dirname, 'public', '/html/home.html'));  
});


// mount admin endpoints
const adminEndpoints = require('./server/routes/admin.js');
app.use('/admin', adminEndpoints);


// mount music endpoints
const musicEndpoints = require('./server/routes/music.js');
app.use('/music', musicEndpoints);

// spotify auth endpoint
const spotifyEndpoints = require('./server/routes/spotify.js');
app.use('/spotify', spotifyEndpoints);





// Start the app
app.listen(port, () => {
  console.log(`✅ Server listening on port ${port}`);
  console.log(`Access by IP: ${utils.getLocalIP()}`)
});
