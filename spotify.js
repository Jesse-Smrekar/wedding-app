require('dotenv').config();
var https = require('follow-redirects').https;
var fs = require('fs');
var qs = require('querystring');

var ACCESS_TOKEN;

// Documentation: 
// https://developer.spotify.com/documentation/web-api/tutorials/client-credentials-flow

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;


function login() {

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
    
      res.on("end", function (chunk) {
        var body = JSON.parse(Buffer.concat(chunks));
        ACCESS_TOKEN = body.access_token;
        console.log(`GOT SPOTIFY TOKEN: ${ACCESS_TOKEN}`);
      });
    
      res.on("error", function (error) {
        console.error(error);
      });
    });
    
    var postData = qs.stringify({
      'grant_type': 'client_credentials'
    });
    
    req.write(postData);
    req.end();
}


function searchTracks(search) {

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
        
        res.on("end", function (chunk) {
            var body = Buffer.concat(chunks);
            console.log(`Search Result: ${body.toString()}`);
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
    login, searchTracks
};