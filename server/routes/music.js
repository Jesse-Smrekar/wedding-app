const express = require('express');
const router = express.Router();
const path = require('path');
const spotify = require('../utils/spotify-utils.js');
const db = require('../utils/db.js');


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
  var data;

  getUsersNextQueueTime(...req.user.split('_'))
  .then(nextTime => {

    if (!nextTime || new Date(nextTime + 'Z') > new Date()) {
      data = {sucess: 'false', message: 'TOO_SOON', time: nextTime};
      res.set('Content-Type', 'application/json');
      res.send(data);
      return;
    }

    spotify.addToQueue(trackId)
    .then(ignore => {

      updateUserNextQueueTime(...req.user.split('_'))
      .then( (succ, err) => {
        data = {success: true};
        if (err) {
          data = {success: false, message: 'UNKNOWN', time: nextTime};
        }
        res.set('Content-Type', 'application/json');
        res.send(data);
      });
    });
  });
});


async function getUsersNextQueueTime(fname, lname) {
    var result = await db.read(`SELECT NEXT_MUSIC_QUEUE_DATE FROM USERS WHERE FIRST_NAME = '${fname.toUpperCase()}' AND LAST_NAME = '${lname.toUpperCase()}'`);
    return !!result && result.length > 0 ? result[0].NEXT_MUSIC_QUEUE_DATE : null; 
}


function updateUserNextQueueTime(fname, lname) {
    return db.write(`UPDATE USERS SET NEXT_MUSIC_QUEUE_DATE = DATETIME('now', '+30 minutes') WHERE FIRST_NAME = '${fname.toUpperCase()}' AND LAST_NAME = '${lname.toUpperCase()}'`);
}

module.exports = router;
