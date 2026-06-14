require('dotenv').config();
var https = require('follow-redirects').https;
var qs = require('querystring');
var db = require('./db.js');

// Spotify auth Authorization Code flow.
// Docs: https://developer.spotify.com/documentation/web-api/tutorials/code-flow

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.SPOTIFY_AUTH_REDIRECT_URL;
const REFRESH_MARGIN_MILLIS = 60 * 1000;


function getAuthorization(res) {

  res.redirect('https://accounts.spotify.com/authorize?' +
    qs.stringify({
      response_type: 'code',
      client_id: CLIENT_ID,
      scope: 'user-read-playback-state user-modify-playback-state user-read-currently-playing',
      redirect_uri: REDIRECT_URI,
      state: randStr(16)
    }));
}


/**
 * POSTs a form body to Spotify's token endpoint and resolves the parsed JSON.
 * Used by both the authorization-code exchange and the refresh flow.
 */
function requestSpotifyToken(postData) {
  return new Promise((resolve, reject) => {
    var options = {
      'method': 'POST',
      'hostname': 'accounts.spotify.com',
      'path': '/api/token',
      'headers': {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + new Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')
      },
      'maxRedirects': 20
    };

    var req = https.request(options, (res) => {
      var chunks = [];

      res.on("data", (chunk) => {
        chunks.push(chunk);
      });

      res.on("end", () => {
        var body = Buffer.concat(chunks).toString();
        if (res.statusCode >= 400) {
          return reject(new Error(`Spotify token endpoint returned ${res.statusCode}: ${body}`));
        }
        try {
          var parsed = JSON.parse(body);
          if (!parsed.access_token) {
            return reject(new Error('Spotify token response did not include an access_token: ' + body));
          }
          resolve(parsed);
        } catch (err) {
          reject(err);
        }
      });

      res.on("error", (error) => {
        reject(error);
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}


/** Reads the single spotify_token row, or null if it does not exist. */
async function readTokenRow() {
  const rows = await db.read('SELECT access_token, refresh_token, expires_at FROM spotify_token WHERE id = 1');
  return rows[0] || null;
}


/**
 * Upserts the token row. COALESCE keeps the existing refresh_token when Spotify
 * returns none (the normal case on refresh) and overwrites only if rotated.
 * Concurrent refreshes across instances are safe: the upsert is last-writer-wins
 * and always leaves a valid token.
 */
function saveTokens({ access_token, refresh_token, expires_in }) {
  const expires_at = new Date(Date.now() + (expires_in || 3600) * 1000);
  return db.query(
    `INSERT INTO spotify_token (id, access_token, refresh_token, expires_at, updated_at)
     VALUES (1, $1, $2, $3, now())
     ON CONFLICT (id) DO UPDATE SET
       access_token  = EXCLUDED.access_token,
       refresh_token = COALESCE(EXCLUDED.refresh_token, spotify_token.refresh_token),
       expires_at    = EXCLUDED.expires_at,
       updated_at    = now()`,
    [access_token, refresh_token || null, expires_at]
  );
}


/**
 * Exchanges an authorization code for tokens and persists them to the DB.
 * Called from the /spotify/auth/redirect callback after admin consent.
 */
async function login(code) {
  if (!code) {
    throw new Error('spotify.login() called without a code');
  }

  const body = await requestSpotifyToken(qs.stringify({
    'grant_type': 'authorization_code',
    'code': code,
    'redirect_uri': REDIRECT_URI
  }));

  await saveTokens(body);
  console.log('Stored Spotify token from authorization-code login.');
}


/** Refreshes the access token using the stored refresh_token and persists it. */
async function refreshFromDb(row) {
  if (!row || !row.refresh_token) {
    throw new Error('No Spotify refresh_token in DB; admin must visit /admin/spotify/login');
  }

  const body = await requestSpotifyToken(qs.stringify({
    'grant_type': 'refresh_token',
    'refresh_token': row.refresh_token
  }));

  await saveTokens(body);
  console.log('Refreshed Spotify access token.');
  return body.access_token;
}


/**
 * Returns a currently-valid access token, refreshing from the DB-stored
 * refresh_token if the access token is missing or about to expire. This is the
 * single entry point used by all Spotify API calls.
 */
async function getValidToken() {
  const row = await readTokenRow();

  if (!row || !row.access_token) {
    throw new Error('Spotify is not authorized. An admin must visit /admin/spotify/login first.');
  }

  const expiresAt = row.expires_at ? new Date(row.expires_at).getTime() : 0;
  if (!expiresAt || expiresAt - Date.now() < REFRESH_MARGIN_MILLIS) {
    return refreshFromDb(row);
  }

  return row.access_token;
}


/**
 * Loads Spotify token state on server startup. No network call is made — the
 * token is read from the shared DB on demand via getValidToken().
 */
async function init() {

  if (!!process.env.SPOTIFY_TOKEN) {
    await saveTokens({access_token: process.env.SPOTIFY_TOKEN});
    console.log('Spotify token loaded from env var.');
    return;
  }
  
  const row = await readTokenRow();
  if (!row || !row.refresh_token || row.expires_at < new Date()) {
    console.log('No Spotify token in DB. An admin must visit /admin/spotify/login to authorize queueing.');
    return;
  }
  console.log('Spotify token loaded from DB.');
}


async function searchTracks(search) {
    if (!search) {
        throw new Error('searchTracks() called without a search term');
    }

    const token = await getValidToken();

    return new Promise((resolve, reject) => {
        var options = {
        'method': 'GET',
        'hostname': 'api.spotify.com',
        'path': `/v1/search?q=${encodeURIComponent(search)}&type=track&limit=10`,
        'headers': {
            'Authorization': 'Bearer ' + token,
        },
        'maxRedirects': 20
        };

        var req = https.request(options, (res) => {
        var chunks = [];

        res.on("data", (chunk) => {
            chunks.push(chunk);
        });

        res.on("end", () => {
            try {
                var body = Buffer.concat(chunks);
                var parsed = JSON.parse(body);
                if (!parsed.tracks || !Array.isArray(parsed.tracks.items)) {
                    console.error('Unexpected Spotify search response:', body.toString());
                    return reject(new Error('Unexpected Spotify search response format'));
                }
                resolve(parsed.tracks.items);
            } catch (err) {
                console.error('Failed to parse Spotify search response:', err);
                reject(err);
            }
        });

        res.on("error", (error) => {
            console.error('Spotify search response error:', error);
            reject(error);
        });
        });

        req.on("error", (error) => {
            console.error('Spotify search request error:', error);
            reject(error);
        });

        req.end();
    });
}


async function getQueue() {
  const token = await getValidToken();

  return new Promise((resolve, reject) => {
      var options = {
      'method': 'GET',
      'hostname': 'api.spotify.com',
      'path': `/v1/me/player/queue`,
      'headers': {
          'Authorization': 'Bearer ' + token,
      },
      'maxRedirects': 20
      };

      var req = https.request(options, (res) => {
      var chunks = [];

      res.on("data", (chunk) => {
          chunks.push(chunk);
      });

      res.on("end", (chunk) => {
          var body = Buffer.concat(chunks);
          // console.log(`Search Result: ${body.toString()}`);
          resolve(JSON.parse(body).queue);
      });

      res.on("error", (error) => {
          console.error(error);
          reject(error);
      });
      });

      req.end();
  });
}


async function addToQueue(track) {
  if (!track) {
      throw new Error('addToQueue() called without a track URI');
  }

  const token = await getValidToken();

  var htmlEscapedTrack = track.replace(':', '%3A');

  // TODO: check that the user can add a track

  return new Promise((resolve, reject) => {
      var options = {
      'method': 'POST',
      'hostname': 'api.spotify.com',
      'path': `/v1/me/player/queue?uri=${htmlEscapedTrack}`,
      'headers': {
          'Authorization': 'Bearer ' + token,
      },
      'maxRedirects': 20
      };

      var req = https.request(options, (res) => {
        var chunks = [];

        res.on("data", (chunk) => {
            chunks.push(chunk);
        });

        res.on("end", () => {
            const body = Buffer.concat(chunks).toString();
            if (res.statusCode >= 400) {
                console.error(`Spotify addToQueue failed (${res.statusCode}):`, body);
                return reject(new Error(`Spotify returned status ${res.statusCode}`));
            }
            // console.log(`Add to queue response: ${body}`);
            resolve();
        });

        res.on("error", (error) => {
            console.error('Spotify addToQueue response error:', error);
            reject(error);
        });
      });

      req.on("error", (error) => {
          console.error('Spotify addToQueue request error:', error);
          reject(error);
      });

      req.end();
  });
}


function randStr(length) {
  var result           = '';
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}


module.exports = {
  getAuthorization, login, init, getValidToken, searchTracks, addToQueue, getQueue
};
