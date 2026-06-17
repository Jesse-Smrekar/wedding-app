const express = require('express');
const router = express.Router();
const path = require('path');
const spotify = require('../utils/spotify-utils.js');
const db = require('../utils/db.js');

const adminList = ['JESSE_SMREKAR'];



/**
 * GET /musicadmin
 *
 * Returns the HTML page for music admin actions.
 */
router.get('/', (req, res) => {
  console.log(`REQUEST: GET, /musicadmin`);

  if (!req.user) {
    res.redirect('/login');
    return;
  } else if (!adminList.includes(req.user)) {
    res.redirect('/');
    return;
  }

  res.set('Content-Type', 'text/html');
  res.sendFile(path.join(__dirname, '../../public', '/html/musicadmin.html'));
});



/**
 * GET /musicadmin/settings
 *
 * Returns the current music settings.
 */
router.get('/settings', (req, res) => {
  if (!req.user || !adminList.includes(req.user)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  db.read(`SELECT queue_limit_enabled, queue_wait_minutes, explicit_allowed FROM music_settings LIMIT 1`)
  .then(rows => {
    const row = rows[0] || {};
    res.set('Content-Type', 'application/json');
    res.send(JSON.stringify({
      queueLimitEnabled: row.queue_limit_enabled,
      queueWaitMinutes: row.queue_wait_minutes,
      explicitAllowed: row.explicit_allowed,
    }));
  })
  .catch(err => {
    console.error('Error reading music settings:', err);
    res.status(500).json({ error: 'Failed to read music settings.' });
  });
});



/**
 * GET /musicadmin/spotify/login
 * 
 * Attempts to get an authorized session from Spotify that can be
 * used by the app later to search for tracks and queue songs.
 * 
 * This must be called by an admin before users are able to use the 
 * music page.
 */
router.get('/spotify/login', (req, res) => {
  console.log(`REQUEST: GET, /admin/spotify/login`)
  if (!req.user || !adminList.includes(req.user)) {
	return res.status(403).json({ error: 'Forbidden' });
  }

  spotify.getAuthorization(res);
});



/**
 * PATCH /musicadmin/toggle-queue-limit
 * 
 * Toggles the limit on users ability to queue songs.
 */
router.patch('/toggle-queue-limit', (req, res) => {
  if (!req.user || !adminList.includes(req.user)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  db.write(`UPDATE music_settings SET queue_limit_enabled = NOT queue_limit_enabled RETURNING queue_limit_enabled`)
  .then(result => {
    res.set('Content-Type', 'application/json');
    res.send(JSON.stringify({ queueLimitEnabled: result[0].queue_limit_enabled }));
  })
  .catch(err => {
    console.error('Error toggling music queue limit:', err);
    res.status(500).json({ error: 'Failed to toggle music queue limit.' });
  });

});


/**
 * PATCH /musicadmin/queue-limit?minutes=<mins>
 * 
 * Update the duration of the queueing wait time.
 */
router.patch('/queue-limit', (req, res) => {
  if (!req.user || !adminList.includes(req.user)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const newMins = req.query.minutes;

  if (Number.isNaN(newMins) || newMins < 0) {
	return res.status(400).json({ error: 'Invalid minutes.' });
  }

  db.write(`UPDATE music_settings SET queue_wait_minutes = $1 returning queue_wait_minutes`, [newMins])
  .then(result => {
    res.set('Content-Type', 'application/json');
    res.send(JSON.stringify({ queueWaitMinutes: result[0].queue_wait_minutes }));
  })
  .catch(err => {
    console.error('Error toggling music queue limit:', err);
    res.status(500).json({ error: 'Failed to toggle music queue limit.' });
  });

});



/**
 * PATCH /musicadmin/toggle-queue-limit
 * 
 * Toggles the if users are able to queue explicit songs.
 */
router.patch('/toggle-explicit', (req, res) => {
  if (!req.user || !adminList.includes(req.user)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

    db.write(`UPDATE music_settings SET explicit_allowed = NOT explicit_allowed RETURNING explicit_allowed`)
  .then(result => {
    res.set('Content-Type', 'application/json');
    res.send(JSON.stringify({ explicitAllowed: result[0].explicit_allowed }));
  })
  .catch(err => {
    console.error('Error toggling explicit songs:', err);
    res.status(500).json({ error: 'Failed to toggle explicit songs setting.' });
  });

});


module.exports = router;
