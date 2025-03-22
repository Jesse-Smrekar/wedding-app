// Library Imports
const express = require('express');
const fs = require('fs');
const path = require('path');

// Other JS files
const utils = require('./utils.js');
const spotify = require('./spotify.js');

// Server Constants
const server = express();
const port = 3000;

server.get('/', (req, res) => {

  res.set('Content-Type', 'text/html');
  res.sendFile(path.join(__dirname, 'public', '/html/home.html'));  
});

server.get('/styles.css', (req, res) => {

  res.set('Content-Type', 'text/css');
  res.sendFile(path.join(__dirname, 'public', 'styles.css'));  
});

server.get('/music', (req, res) => {

  res.set('Content-Type', 'text/html');
  res.sendFile(path.join(__dirname, 'public', '/html/music.html'));  
});


server.get('/music/search', (req, res) => {
  const search = req.query.search;
  console.log(`REQUEST: GET, /music/search, search: ${search}`)

  spotify.searchTracks(search)
  .then(data => {
    res.set('Content-Type', 'application/json');
    res.send(data)
  });
});



spotify.login();

server.use(express.static('public'));
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  console.log(`Access by IP: ${utils.getLocalIP()}`)
});


