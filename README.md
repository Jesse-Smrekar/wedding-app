# Wedding App

A website [jaredandtati.com](https://www.jaredandtati.com) for wedding guests. It serves static event
info (home, info, directions) and adds two interactive features:

- **Music** — guests search and add songs to the live playback queue, with restrictions as desired.
- **Photos** — guests upload photos with an optional note; public uploads appear
  in a home-page slideshow and a shared photo gallery.

### Demo
<video src="https://github.com/user-attachments/assets/ee8a93a5-7dd6-4626-ab8f-eddf49c7b0e4" controls width="25%"></video>

I 3D-printed QR codes which were placed in stands on every table during the reception so guests had easy access. 

<img src="./docs/qr_code.jpg" controls width="25%"/>


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

2. Running
   ```ps1
   node server.js
   ```

## Notes
- Guests "log in" with just a first and last name (this is deliberately lightweight
identity, not real authentication — see `server/utils/auth.js`).
- The naked domain `jaredandtati.com` is 301-redirected to `www.jaredandtati.com` becuase Wix DNS doesn't support alias/aname (wish I had known this before paying for the domain, oops).

</content>
</invoke>
