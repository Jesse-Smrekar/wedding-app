const express = require('express');
const router = express.Router();
const path = require('path');
const spotify = require('../utils/spotify-utils.js');


if (process.env.SPOTIFY_TOKEN) {
  spotify.setToken(process.env.SPOTIFY_TOKEN);
}


/**
 * GET /music
 * 
 * Returns the HTML page for adding and removing music
 */
router.get('/', (req, res) => {

  res.set('Content-Type', 'text/html');
  res.sendFile(path.join(__dirname, '../../public', '/html/music.html'));  
});


/**
 * GET /music/search?search={}
 * 
 * Takes a query parameter called `search` and returns any relevant search results
 * available on Spotify.
 */
router.get('/search', (req, res) => {
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


/**
 * POST /music/queue
 * 
 * Add a track to the current Spotify queue.
 */
router.post('/queue/:trackId', (req, res) => {
  const trackId = req.params.trackId;
  console.log(`REQUEST: POST, /music/queue, trackId: ${trackId}`)

  spotify.addToQueue(trackId)
  .then(data => {
    res.set('Content-Type', 'application/json');
    res.send(data)
  });
});

module.exports = router;
