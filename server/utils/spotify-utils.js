require('dotenv').config();
var https = require('follow-redirects').https;
var fs = require('fs');
var qs = require('querystring');

var ACCESS_TOKEN;
var REFRESH_TOKEN;
var EXPIRES_SECONDS;

// Documentation: 
// https://developer.spotify.com/documentation/web-api/tutorials/client-credentials-flow

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.SPOTIFY_AUTH_REDIRECT_URL;


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


function login(code) {
    if (!code) {
        console.error('spotify.login() called without a code');
        return;
    }

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

    var req = https.request(options, function (res) {
      var chunks = [];

      res.on("data", function (chunk) {
        chunks.push(chunk);
      });

      res.on("end", function () {
        try {
          var body = JSON.parse(Buffer.concat(chunks));
          if (!body.access_token) {
            console.error('Spotify login did not return an access_token:', body);
            return;
          }
          ACCESS_TOKEN = body.access_token;
          REFRESH_TOKEN = body.refresh_token;
          if (body.expires_in) {
            setTimeout(refreshToken, (body.expires_in - 30) * 1000);
          }
          console.log(`GOT SPOTIFY TOKEN: ${ACCESS_TOKEN}`);
        } catch (err) {
          console.error('Failed to parse Spotify login response:', err);
        }
      });

      res.on("error", function (error) {
        console.error('Spotify login response error:', error);
      });
    });

    req.on("error", function (error) {
      console.error('Spotify login request error:', error);
    });

    var postData = qs.stringify({
      'grant_type': 'authorization_code',
      'code': code,
      'redirect_uri': REDIRECT_URI
    });

    req.write(postData);
    req.end();
}


function refreshToken() {
  if (!REFRESH_TOKEN) {
    console.error('refreshToken() called but no REFRESH_TOKEN is available');
    return;
  }

  var options = {
    method: 'POST',
    hostname: 'accounts.spotify.com',
    path: '/api/token',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + (new Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'))
    },
    json: true
  };

  var req = https.request(options, function (res) {
      var chunks = [];

      res.on("data", function (chunk) {
        chunks.push(chunk);
      });

      res.on("end", function () {
        try {
          var body = JSON.parse(Buffer.concat(chunks));
          if (!body.access_token) {
            console.error('Spotify token refresh did not return an access_token:', body);
            return;
          }
          ACCESS_TOKEN = body.access_token;
          if (body.refresh_token) {
            REFRESH_TOKEN = body.refresh_token;
          }
          if (body.expires_in) {
            setTimeout(refreshToken, (body.expires_in - 30) * 1000);
          }
          console.log(`GOT SPOTIFY TOKEN: ${ACCESS_TOKEN}`);
        } catch (err) {
          console.error('Failed to parse Spotify refresh response:', err);
        }
      });

      res.on("error", function (error) {
        console.error('Spotify refresh response error:', error);
      });
  });

  req.on("error", function (error) {
    console.error('Spotify refresh request error:', error);
  });

  var postData = qs.stringify({
    'grant_type': 'refresh_token',
    'refresh_token': REFRESH_TOKEN
  });
  req.write(postData);
  req.end();
}


function setToken(token) {
  console.log('Setting access token: %s', token)
  ACCESS_TOKEN = token;
}








function searchTracks(search) {
    if (!search) {
        return Promise.reject(new Error('searchTracks() called without a search term'));
    }

    if (!ACCESS_TOKEN) {
        return Promise.reject(new Error('Spotify ACCESS_TOKEN is not set. Admin must log in via /admin/spotify/login first.'));
    }

    return new Promise((resolve, reject) => {
        var options = {
        'method': 'GET',
        'hostname': 'api.spotify.com',
        'path': `/v1/search?q=${encodeURIComponent(search)}&type=track&limit=10`,
        'headers': {
            'Authorization': 'Bearer ' + ACCESS_TOKEN,
        },
        'maxRedirects': 20
        };

        var req = https.request(options, function (res) {
        var chunks = [];

        res.on("data", function (chunk) {
            chunks.push(chunk);
        });

        res.on("end", function () {
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

        res.on("error", function (error) {
            console.error('Spotify search response error:', error);
            reject(error);
        });
        });

        req.on("error", function (error) {
            console.error('Spotify search request error:', error);
            reject(error);
        });

        req.end();
    });
}



function getQueue() {

  return new Promise((resolve, reject) => {
      var options = {
      'method': 'GET',
      'hostname': 'api.spotify.com',
      'path': `/v1/me/player/queue`,
      'headers': {
          'Authorization': 'Bearer ' + ACCESS_TOKEN,
      },
      'maxRedirects': 20
      };
      
      var req = https.request(options, function (res) {
      var chunks = [];
      
      res.on("data", function (chunk) {
          chunks.push(chunk);
      });
      
      res.on("end", function (chunk) {
          var body = Buffer.concat(chunks);
          // console.log(`Search Result: ${body.toString()}`);
          resolve(JSON.parse(body).tracks.items);
      });
      
      res.on("error", function (error) {
          console.error(error);
          reject(error);
      });
      });
      
      req.end();
  });
}



function addToQueue(track) {
  if (!track) {
      return Promise.reject(new Error('addToQueue() called without a track URI'));
  }

  if (!ACCESS_TOKEN) {
      return Promise.reject(new Error('Spotify ACCESS_TOKEN is not set. Admin must log in via /admin/spotify/login first.'));
  }

  var htmlEscapedTrack = track.replace(':', '%3A');

  // TODO: check that the user can add a track

  return new Promise((resolve, reject) => {
      var options = {
      'method': 'POST',
      'hostname': 'api.spotify.com',
      'path': `/v1/me/player/queue?uri=${htmlEscapedTrack}`,
      'headers': {
          'Authorization': 'Bearer ' + ACCESS_TOKEN,
      },
      'maxRedirects': 20
      };

      var req = https.request(options, function (res) {
        var chunks = [];

        res.on("data", function (chunk) {
            chunks.push(chunk);
        });

        res.on("end", function () {
            const body = Buffer.concat(chunks).toString();
            if (res.statusCode >= 400) {
                console.error(`Spotify addToQueue failed (${res.statusCode}):`, body);
                return reject(new Error(`Spotify returned status ${res.statusCode}`));
            }
            // console.log(`Add to queue response: ${body}`);
            resolve();
        });

        res.on("error", function (error) {
            console.error('Spotify addToQueue response error:', error);
            reject(error);
        });
      });

      req.on("error", function (error) {
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





// server.get('/refresh_token', function(req, res) {

//     var refresh_token = req.query.refresh_token;
//     var authOptions = {
//       url: 'https://accounts.spotify.com/api/token',
//       headers: {
//         'content-type': 'application/x-www-form-urlencoded',
//         'Authorization': 'Basic ' + (new Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'))
//       },
//       form: {
//         grant_type: 'refresh_token',
//         refresh_token: ACCESS_TOKEN
//       },
//       json: true
//     };
  
//     request.post(authOptions, function(error, response, body) {
//       if (!error && response.statusCode === 200) {
//         var access_token = body.access_token,
//             refresh_token = body.refresh_token || refresh_token;
//         res.send({
//           'access_token': access_token,
//           'refresh_token': refresh_token
//         });
//       }
//     });
//   });


module.exports = {
  getAuthorization, login, setToken, searchTracks, addToQueue
};
