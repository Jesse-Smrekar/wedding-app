const express = require('express');
const router = express.Router();
const path = require('path');
const spotify = require('../utils/spotify-utils.js');
const db = require('../utils/db.js');

const adminList = ['JESSE_SMREKAR'];


/**
 * GET /admin 
 * 
 * Returns the HTML page for admin actions
 */
router.get('/', (req, res) => {
  console.log(`REQUEST: GET, /admin`)

  // rudimentary page-load-only auth
  if (!req.user) {
    res.redirect('/login');
    return;
  } else if (!adminList.includes(req.user)) {
    res.redirect('/');
    return;
  }

  res.set('Content-Type', 'text/html');
  res.sendFile(path.join(__dirname, '../../public', '/html/admin.html'));
});


/**
 * GET /admin/spotify/login
 * 
 * Attempts to get an authorized session from Spotify that can be
 * used by the app later to search for tracks and queue songs.
 * 
 * This must be called by an admin before users are able to use the 
 * music page.
 */
router.get('/spotify/login', (req, res) => {
  console.log(`REQUEST: GET, /admin/spotify/login`)

  spotify.getAuthorization(res);
});




/**
 * GET /admin/users?search={}
 * 
 * Returns the users from the database which match the search criteria.
 */
router.get('/users', (req, res) => {
  const search = req.query.search;
  console.log(`REQUEST: GET, /admin/users, search: ${search}`)

  db.read('SELECT * FROM USERS').then(result => {
    res.set('Content-Type', 'application/json');
    res.send(JSON.stringify(result))
  });
});



router.delete('/users', (req, res) => {
  var fname = req.query.firstName;
  var lname = req.query.lastName;
  console.log(`REQUEST: DELETE, /admin/users`);

    if (fname == "*") {
      console.log("DELETING ALL USERS");
      db.write("DELETE FROM USERS WHERE 1=1");
    } else {
      console.log(`DELETING USER: ${fname} ${lname}`);
      db.write(`DELETE FROM USERS WHERE FIRST_NAME = '${fname.trim().toUpperCase()}' AND LAST_NAME = '${lname.trim().toUpperCase()}'`);
    }

    res.set('Content-Type', 'text/html');
    res.send("OK");
});

module.exports = router;
