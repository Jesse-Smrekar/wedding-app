const express = require('express');
const router = express.Router();
const path = require('path');
const archiver = require('archiver');
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




/**
 * GET /admin/photodump
 *
 * Streams every uploaded photo (public and private) back as a single zip
 * download. Photo bytes are fetched one row at a time and piped straight into
 * the archive, so peak memory stays at roughly one photo rather than the whole
 * gallery.
 */
router.get('/photodump', async (req, res) => {
  if (!req.user || !adminList.includes(req.user)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

    console.log(`REQUEST: GET, /admin/photodump`);

    try {
        // Pull the manifest first; file_data is fetched per-row while streaming.
        // LEFT JOIN so a file whose uploads row went missing still gets dumped.
        const rows = await db.read(
            `SELECT upload_files.id, upload_files.filename, uploads.note, users.first_name, users.last_name
             FROM upload_files
             LEFT JOIN uploads ON upload_files.upload_id = uploads.id
             LEFT JOIN users on uploads.user_id = users.id
             ORDER BY upload_files.id`
        );

        if (!rows || rows.length === 0) {
            return res.status(404).json({ error: 'No photos to dump.' });
        }

        // Photos are already-compressed formats (jpeg/png/heic), so deflating
        // them again burns CPU for ~nothing. Store them as-is.
        const archive = archiver('zip', { zlib: { level: 0 } });

        // Once bytes are on the wire we can no longer swap in a 500 response,
        // so the best we can do is abort the transfer and let the client see a
        // truncated download rather than a silently-valid short zip.
        archive.on('error', err => {
            console.error('Error building photo dump archive:', err);
            res.destroy(err);
        });
        archive.on('warning', err => {
            console.warn('Photo dump archive warning:', err);
        });

        // Client hung up mid-download — stop pulling blobs out of the DB.
        // 'close' also fires on a successful response, hence the guard.
        res.on('close', () => {
            if (!res.writableFinished) {
                archive.abort();
            }
        });

        const stamp = new Date().toISOString().slice(0, 10);
        res.attachment(`photodump-${stamp}.zip`);
        archive.pipe(res);

        let appended = 0;
        const noteLines = [];
        for (const { id, filename, note, first_name, last_name } of rows) {
            const fileRows = await db.read(
                `SELECT file_data FROM upload_files WHERE id = $1`,
                [id]
            );

            const fileData = fileRows[0] && fileRows[0].file_data;
            if (!fileData) {
                console.warn(`Skipping upload_files id=${id}: no file data.`);
                continue;
            }


            var newFilename = `${first_name}_${last_name}_${id}.${filename.split('.')[1]}`;
            archive.append(fileData, { name: newFilename});
            // One line per photo, so a note the guest typed across several lines
            // is flattened rather than corrupting the file:note pairing.
            const flatNote = (note || '').replace(/\s+/g, ' ').trim();
            noteLines.push(`${newFilename} : ${first_name} ${last_name} - ${flatNote}`);
            appended++;
        }

        // Appended last so it only lists files that actually made it in.
        archive.append(noteLines.join('\n') + '\n', { name: 'notes.txt' });

        await archive.finalize();
        console.log(`>>> Photo dump complete: ${appended} file(s).`);
    } catch (err) {
        console.error(`Error fetching photos: `, err);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to dump photos' });
        } else {
            res.destroy(err);
        }
    }
});




module.exports = router;
