// Library Imports
const express = require('express');
const fs = require('fs');
const path = require('path');

// Other JS files
const utils = require('./utils.js');
const spotify = require('./spotify.js');
const db = require('./db.js');
var qs = require('querystring');

// Server Constants
const server = express();
const port = 3000;


// -------------------------------------------------------------------------
// COMMON / SHARED REQUESTS

server.get('/styles.css', (req, res) => {

  res.set('Content-Type', 'text/css');
  res.sendFile(path.join(__dirname, 'public', 'styles.css'));  
});










// -------------------------------------------------------------------------
// HTML PAGES

server.get('/', (req, res) => {

  res.set('Content-Type', 'text/html');
  res.sendFile(path.join(__dirname, 'public', '/html/home.html'));  
});


server.get('/music', (req, res) => {

  res.set('Content-Type', 'text/html');
  res.sendFile(path.join(__dirname, 'public', '/html/music.html'));  
});


server.get('/admin', (req, res) => {

  res.set('Content-Type', 'text/html');
  res.sendFile(path.join(__dirname, 'public', '/html/admin.html'));  
});










// -------------------------------------------------------------------------
// ADMIN ENDPOINTS
server.get('/users', (req, res) => {
  const search = req.query.search;
  console.log(`REQUEST: GET, /users, search: ${search}`)

  var response = [];
  db.read('SELECT * FROM USERS')
  .then(result => {
    response = JSON.stringify(result);
  });

  res.set('Content-Type', 'application/json');
  res.send(response)
});











// -------------------------------------------------------------------------
// MUSIC RELATED ENDPOINTS

server.get('/music/search', (req, res) => {
  const search = req.query.search;
  console.log(`REQUEST: GET, /music/search, search: ${search}`)

  spotify.searchTracks(search)
  .then(data => {

    var response = [];
    for (hit of data) {
      response.push(
        {
          "track": hit.name,
          "artist": hit.artists[0].name,
          "album": hit.album.name,
          "album_image": hit.album.images[2].url,
          "duration": hit.duration_ms,
          "uri": hit.uri
        }
      )
    }

    res.set('Content-Type', 'application/json');
    res.send(response)
  });
});


server.get('/music/queue', (req, res) => {
  const trackId = req.query.trackId;
  console.log(`REQUEST: POST, /music/queue, trackId: ${trackId}`)

  spotify.addToQueue(trackId)
  .then(data => {
    res.set('Content-Type', 'application/json');
    res.send(data)
  });
});


/**
 The following endpoints are used when needing to re-authenticate with spotify. 
 If the SPOTIFY_AUTHZ_CODE is populated with a fresh value in the .env file then 
 calling /spotify/login can be bypassed. 

 Spotify API docs: https://developer.spotify.com/documentation/web-api/tutorials/code-flow

*/
server.get('/spotify/login', (req, res) => {
  console.log(`REQUEST: GET, /spotify/login`)

  spotify.getAuthorization(res);
});

server.get('/spotify/auth/redirect', (req, res) => {
  const code = req.query.code;
  console.log(`REQUEST: GET, /spotify/auth/redirect, request: ${code}`)

  spotify.login(code);
  res.redirect('/music');
});



// -------------------------------------------------------------------------
// STARTUP PROCESSSES

if (!!process.env.SPOTIFY_TOKEN) {
  spotify.setToken(process.env.SPOTIFY_TOKEN);
}

db.init();

server.use(express.static('public'));
server.listen(port, () => {
  console.log(`✅ Server listening on port ${port}`);
  console.log(`Access by IP: ${utils.getLocalIP()}`)
});


