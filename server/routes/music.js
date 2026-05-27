const express = require('express');
const router = express.Router();
const path = require('path');
const spotify = require('../utils/spotify-utils.js');
const db = require('../utils/db.js');

const QUEUE_WAIT_MINUTES = 30;


if (process.env.SPOTIFY_TOKEN) {
  spotify.setToken(process.env.SPOTIFY_TOKEN);
}


/**
 * GET /music
 * 
 * Returns the HTML page for adding and removing music
 */
router.get('/', (req, res) => {
  res.redirect('/html/music.html');
});


/**
 * GET /music/search?search={}
 *
 * Takes a query parameter called `search` and returns any relevant search results
 * available on Spotify.
 */
router.get('/search', (req, res) => {
  const search = (req.query.search || '').trim();
  console.log(`REQUEST: GET, /music/search, search: ${search}`)

  if (!search) {
    return res.status(400).json({ error: 'Missing search query.' });
  }

  spotify.searchTracks(search)
  .then(data => {

    if (!Array.isArray(data)) {
      console.error('Unexpected Spotify search response:', data);
      return res.status(502).json({ error: 'Unexpected response from Spotify.' });
    }

    var response = [];
    for (const hit of data) {
      try {
        response.push(
          {
            "track": hit.name,
            "artist": hit.artists[0].name,
            "album": hit.album.name,
            "album_image": hit.album.images[2]?.url ?? hit.album.images[0]?.url ?? null,
            "duration": hit.duration_ms,
            "uri": hit.uri
          }
        );
      } catch (hitErr) {
        console.warn('Skipping malformed track result:', hitErr.message);
      }
    }

    res.set('Content-Type', 'application/json');
    res.send(response);
  })
  .catch(err => {
    console.error('Spotify search error:', err);
    res.status(502).json({ error: 'Failed to search Spotify.' });
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

  if (!trackId) {
    return res.status(400).json({ error: 'Missing trackId.' });
  }

  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }

  const [fname, lname] = req.user.split('_');

  getUsersNextQueueTime(fname, lname)
  .then(nextTime => {

    // bypass limits for admin
    if (req.user != 'JESSE_SMREKAR' && (!nextTime || nextTime > new Date())) {
      const data = { success: false, message: 'TOO_SOON', time: nextTime };
      res.set('Content-Type', 'application/json');
      return res.send(data);
    }

    return spotify.addToQueue(trackId)
    .then(() => updateUserNextQueueTime(fname, lname))
    .then(() => {
      res.set('Content-Type', 'application/json');
      res.send({ success: true });
    });
  })
  .catch(err => {
    console.error('Queue error:', err);
    res.status(500).json({ success: false, message: 'UNKNOWN' });
  });
});


async function getUsersNextQueueTime(fname, lname) {
    if (!fname || !lname) return null;
    try {
        var result = await db.read(`SELECT NEXT_MUSIC_QUEUE_DATE FROM USERS WHERE FIRST_NAME = '${fname.toUpperCase()}' AND LAST_NAME = '${lname.toUpperCase()}'`);
        return !!result && result.length > 0 ? result[0].next_music_queue_date : null;
    } catch (err) {
        console.error('Error reading queue time:', err);
        return null;
    }
}


function updateUserNextQueueTime(fname, lname) {
    if (!fname || !lname) return Promise.resolve();
    return db.write(`UPDATE users SET next_music_queue_date = NOW() + INTERVAL '${QUEUE_WAIT_MINUTES} minutes' WHERE first_name = '${fname.toUpperCase()}' AND last_name = '${lname.toUpperCase()}'`)
        .catch(err => console.error('Error updating queue time:', err));
}

module.exports = router;
