/**
 * The following endpoint(s) are used when needing to re-authenticate with spotify. 
 * If the SPOTIFY_AUTHZ_CODE is populated with a fresh value in the .env file then 
 * calling /spotify/login can be bypassed. 
 * 
 * Spotify API docs: https://developer.spotify.com/documentation/web-api/tutorials/code-flow
 */

const express = require('express');
const router = express.Router();
const spotify = require('../utils/spotify-utils.js');





/**
 * GET /spotify/auth/redirect?code={}
 * 
 * This is the callback endpoint for Spotify OAuth. It redirects back to the home page.
 */
router.get('/auth/redirect', (req, res) => {
  const code = req.query.code;
  console.log(`REQUEST: GET, /spotify/auth/redirect, request: ${code}`)

  spotify.login(code);
  res.redirect('/');
});

module.exports = router;
