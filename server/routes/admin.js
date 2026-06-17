const express = require('express');
const router = express.Router();
const path = require('path');
const spotify = require('../utils/spotify-utils.js');
const db = require('../utils/db.js');
const music = require('./music.js');

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
 * GET /admin/users?search={}
 *
 * Returns the users from the database which match the search criteria.
 */
router.get('/users', (req, res) => {
  if (!req.user || !adminList.includes(req.user)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const search = req.query.search;
  console.log(`REQUEST: GET, /admin/users, search: ${search}`)

  db.read('SELECT * FROM USERS')
    .then(result => {
      res.set('Content-Type', 'application/json');
      res.send(JSON.stringify(result));
    })
    .catch(err => {
      console.error('Error reading users:', err);
      res.status(500).json({ error: 'Failed to retrieve users.' });
    });
});



router.delete('/users', (req, res) => {
  if (!req.user || !adminList.includes(req.user)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  var fname = req.query.firstName;
  var lname = req.query.lastName;
  console.log(`REQUEST: DELETE, /admin/users`);

  let writePromise;
  if (fname == "*") {
    console.log("DELETING ALL USERS");
    writePromise = db.write("DELETE FROM users WHERE id NOT IN (SELECT id FROM users WHERE first_name = 'JESSE' AND last_name = 'SMREKAR')");
  } else {
    if (!fname || !lname) {
      return res.status(400).json({ error: 'firstName and lastName are required.' });
    }
    console.log(`DELETING USER: ${fname} ${lname}`);
    writePromise = db.write(`DELETE FROM USERS WHERE FIRST_NAME = '${fname.trim().toUpperCase()}' AND LAST_NAME = '${lname.trim().toUpperCase()}'`);
  }

  writePromise
    .then(() => {
      res.set('Content-Type', 'text/html');
      res.send("OK");
    })
    .catch(err => {
      console.error('Error deleting user(s):', err);
      res.status(500).json({ error: 'Failed to delete user(s).' });
    });
});




module.exports = router;
