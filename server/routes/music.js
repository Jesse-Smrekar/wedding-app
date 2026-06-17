const express = require('express');
const router = express.Router();
const path = require('path');
const spotify = require('../utils/spotify-utils.js');
const db = require('../utils/db.js');

const SUPER_USERS = ["JESSE_SMREKAR"];


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

  shouldAllowQueueForUser(fname, lname)
  .then((allowed, nextTime)  => {

    if (!allowed) {
      const data = { success: false, message: 'TOO_SOON', time: nextTime };
      res.set('Content-Type', 'application/json');
      return res.send(data);
    }

    return spotify.addToQueue(trackId)
    .then(() => addQueuedTrackRecord(fname, lname, trackId))
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


/**
 *  GET /music/info
 * 
 *  returns a json object containing the next time (UTC) the user can queue a song.
 *  and the order of their previously queued tracks.
 */
router.get('/info', (req, res) => {

  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }

  const [fname, lname] = req.user.split('_');
  var limitFlag;
  var tracks = [];
  var queue = [];
  getQueuedTracks(fname, lname)
  .then(rows => tracks = rows)
  .then(() => spotify.getQueue())
  .then(data => queue = data)
  .then(() => getQueueLimitFlag())
  .then(flag => limitFlag = flag)
  .then(() => getUsersNextQueueTime(fname, lname))
  .then(nextTime => {

    var queueOrder = [];
    if (!!queue) {
      for (i=0; i<queue.length; i++) {
        if (tracks.includes(queue[i].uri)) {
          queue[i]['order'] = i;
          queueOrder.push(queue[i]);
        }
      }
    }
    

    

    res.set('Content-Type', 'application/json');
    res.send(
      {
        queueLimitEnabled: limitFlag,
        nextQueueTime: nextTime,
        queuedTracks: queueOrder
      }
    );
  })
  .catch(err => {
    console.error('Error getting users next queue time:', err);
    res.status(500).json({ success: false, message: 'UNKNOWN' });
  });
});











// HELPER FUNCTIONS


async function shouldAllowQueueForUser(fname, lname) {

  var limitFlag = await getQueueLimitFlag();

  // bypass limit if disabled or if it's a super user
  if (!limitFlag ||
      !!SUPER_USERS.includes(`${fname.toUpperCase()}_${lname.toUpperCase()}`)) {
    return (true, new Date());
  }

  var time = await getUsersNextQueueTime(fname, lname);
  return (time < new Date(), time);
}

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


function addQueuedTrackRecord(fname, lname, trackId) {
    if (!fname || !lname || !trackId) return Promise.resolve();
  return db.write(`INSERT INTO queued_tracks (user_id, track_id) 
    VALUES ((SELECT id FROM users WHERE first_name = $1 AND last_name = $2), $3)`, [fname, lname, trackId])
    .catch( err => console.error('Error inserting queued track record: ', err));
}

function getQueuedTracks(fname, lname) {
  if (!fname || !lname) return Promise.resolve();
  return db.read(
    ` SELECT queued_tracks.track_id
      FROM queued_tracks
      JOIN users ON queued_tracks.user_id = users.id
      WHERE users.first_name = $1 AND users.last_name = $2`, [fname, lname])
    .then(rows => rows.map(r => r.track_id))
    .catch( err => console.error('Error inserting queued track record: ', err));
}


function updateUserNextQueueTime(fname, lname) {
    if (!fname || !lname) return Promise.resolve();
    return db.write(`UPDATE users SET next_music_queue_date = NOW() + ((SELECT queue_wait_minutes FROM music_settings LIMIT 1) * INTERVAL '1 minute') WHERE first_name = '${fname.toUpperCase()}' AND last_name = '${lname.toUpperCase()}'`)
        .catch(err => console.error('Error updating queue time:', err));
}

function getQueueLimitFlag() {
  return db.read(`SELECT queue_limit_enabled FROM music_settings LIMIT 1`)
  .then(rows => rows[0].queue_limit_enabled)
}

module.exports = router;
