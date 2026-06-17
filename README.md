# Wedding App

A small wedding website [jaredandtati.com](https://www.jaredandtati.com) for guests. It serves static event
info (home, itinerary, directions) and adds two interactive features:

- **Music** — guests search and add songs to the live playback queue,
  rate-limited so no one floods it.
- **Photos** — guests upload photos with an optional note; public uploads appear
  in a home-page slideshow and a shared gallery.

Guests "log in" with just a first and last name (this is deliberately lightweight
identity, not real authentication — see `server/utils/auth.js`).

## Tech Stack

- **Node.js** + **Express** — HTTP server and routing
- **PostgreSQL** (via `pg`) — users, photo uploads, music queue state, and the
  shared Spotify token
- **multer** + **sharp** — photo upload handling and thumbnail generation
- **jsonwebtoken** — guest session cookies
- Vanilla HTML/CSS/JS frontend served from `public/`

## Prerequisites

- Node.js and npm
- A running PostgreSQL instance
- A Spotify developer application (Client ID/Secret) with the app's redirect URL
  registered

## Setup

1. Install dependencies:
   ```ps1
   npm install
   ```

## Running

```ps1
node server.js
```

The server listens on `HTTP_PORT` (e.g. http://localhost:3000) and logs the
local network IP on startup. You can also use `npm start`.

## Pages

| Path           | Description                                              |
| -------------- | -------------------------------------------------------- |
| `/`            | Home page (with public photo slideshow)                  |
| `/login`       | Guest login (first + last name)                          |
| `/itinerary`   | Event itinerary                                          |
| `/directions`  | Directions                                               |
| `/music`       | Search Spotify and queue songs                           |
| `/photos`      | Upload photos                                            |
| `/photos/gallery` | Shared gallery of public photos                       |
| `/admin`       | Admin tools |

## Project Structure

```
server.js                  # Express app entry point, route mounting, startup
server/
  routes/
    admin.js               # Admin page + user/queue management
    music.js               # Spotify search and queue endpoints
    photos.js              # Photo upload, gallery, slideshow, image serving
    spotify.js             # Spotify OAuth redirect callback
  utils/
    auth.js                # JWT-cookie guest auth middleware
    db.js                  # PostgreSQL pool + schema init
    spotify-utils.js       # Spotify token lifecycle and API calls
    utils.js               # Request logging, local IP lookup
  logs/                    # Connection logs (gitignored)
  uploads/                 # Uploaded files (gitignored)
public/
  html/                    # Page templates
  scripts/                 # Frontend JS
  styles.css, images/      # Static assets
```

## Notes

- Authentication is intentionally minimal — it exists to attribute actions to a
  guest, not to secure sensitive data.
- The naked domain `jaredandtati.com` is 301-redirected to `www.jaredandtati.com`.

</content>
</invoke>
