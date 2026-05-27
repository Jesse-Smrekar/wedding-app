const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../utils/db.js');

const ALLOWED_EXTENSIONS = /\.(jpg|jpeg|png|heic|heif|raw|arw|cr2|nef|orf|rw2|sr2)$/i;
const MAX_FILES = 10;
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB per file
const UPLOAD_DIR = path.join(__dirname, '../../server/uploads/photos');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        files: MAX_FILES,
        fileSize: MAX_FILE_SIZE_BYTES
    },
    fileFilter: (req, file, cb) => {
        if (ALLOWED_EXTENSIONS.test(file.originalname)) {
            cb(null, true);
        } else {
            cb(new Error(`File type not allowed: ${file.originalname}`));
        }
    }
});


/**
 * GET /photos
 *
 * Returns the photos upload page.
 */
router.get('/', (req, res) => {
    res.redirect('/html/photos.html');

    // res.set('Content-Type', 'text/html');

    // res.sendFile(path.join(__dirname, '../../public/html/photos.html'));
});


const MIME_TYPES = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.png': 'image/png',  '.heic': 'image/heic',
    '.heif': 'image/heif', '.raw': 'image/x-raw',
    '.arw': 'image/x-sony-arw', '.cr2': 'image/x-canon-cr2',
    '.nef': 'image/x-nikon-nef', '.orf': 'image/x-olympus-orf',
    '.rw2': 'image/x-panasonic-rw2', '.sr2': 'image/x-sony-sr2',
};


/**
 * GET /photos/gallery
 *
 * Serves the full guest photo gallery page.
 */
router.get('/gallery', (req, res) => {
    res.redirect('/html/gallery.html');
});


/**
 * GET /photos/gallery/list
 *
 * Returns metadata for all public photos, newest first.
 */
router.get('/gallery/list', async (req, res) => {
    try {
        const rows = await db.read(
            `SELECT upload_files.id, users.first_name AS uploader, uploads.note
             FROM upload_files
             JOIN uploads ON upload_files.upload_id = uploads.id
             JOIN users   ON uploads.user_id = users.id
             WHERE uploads.public = true
             ORDER BY uploads.date DESC`
        );
        res.json(rows.map(r => ({
            id:       r.id,
            uploader: r.uploader,
            note:     r.note || ''
        })));
    } catch (err) {
        console.error('Error fetching gallery list:', err);
        res.status(500).json({ error: 'Failed to load gallery.' });
    }
});


/**
 * GET /photos/slideshow
 *
 * Returns metadata for all public photos (used by the home page carousel).
 * Does not require authentication — public photos are visible to anyone.
 */
router.get('/slideshow', async (req, res) => {
    try {

        const rows = await db.read(
            `SELECT id, filename, uploader, note
             FROM (
                 SELECT upload_files.id,
                        upload_files.filename,
                        users.first_name AS uploader,
                        uploads.note,
                        uploads.date,
                        ROW_NUMBER() OVER (
                            PARTITION BY upload_files.upload_id
                            ORDER BY upload_files.id
                        ) AS rn
                 FROM upload_files
                 JOIN uploads ON upload_files.upload_id = uploads.id
                 JOIN users   ON uploads.user_id = users.id
                 WHERE uploads.public = true
             ) ranked
             WHERE rn <= 2
             ORDER BY date DESC
             LIMIT 8`
        );
        res.json(rows.map(r => ({
            id:       r.id,
            filename: r.filename,
            uploader: r.uploader,
            note:     r.note || ''
        })));
    } catch (err) {
        console.error('Error fetching slideshow metadata:', err);
        res.status(500).json({ error: 'Failed to load slideshow.' });
    }
});


/**
 * GET /photos/slideshow/:id
 *
 * Streams the raw image bytes for a single public photo.
 * Does not require authentication.
 */
router.get('/slideshow/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (!id || isNaN(id)) {
        return res.status(400).json({ error: 'Invalid photo ID.' });
    }

    try {
        const rows = await db.read(
            `SELECT upload_files.filename, upload_files.file_data
             FROM upload_files
             JOIN uploads ON upload_files.upload_id = uploads.id
             WHERE upload_files.id = $1 AND uploads.public = true`,
            [id]
        );

        if (!rows || rows.length === 0) {
            return res.status(404).json({ error: 'Photo not found or not public.' });
        }

        const { filename, file_data } = rows[0];
        const ext = path.extname(filename).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.set('Content-Type', contentType);
        res.set('Cache-Control', 'public, max-age=3600');
        res.send(file_data);
    } catch (err) {
        console.error(`Error fetching photo id=${id}:`, err);
        res.status(500).json({ error: 'Failed to load photo.' });
    }
});


/**
 * GET /photos/mine
 *
 * Returns the photos uploaded by the current user.
 */
router.get('/mine', async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated.' });
    }

    const [fname, lname] = req.user.split('_');

    try {
        const rows = await db.read(
            `SELECT file_data FROM upload_files
                JOIN uploads ON upload_files.upload_id = uploads.id
                JOIN users ON uploads.user_id = users.id
                WHERE users.first_name = $1 AND users.last_name = $2`,
            [fname, lname]
        );

        rows.forEach((row, i) => {
            const filename = rows.length === 1 ? 'TEST_IMAGE' : `TEST_IMAGE_${i}`;
            fs.writeFileSync(path.join(UPLOAD_DIR, filename), row.file_data);
        });

        res.json({ success: true, count: rows.length });
    } catch (err) {
        console.error('Error retrieving photos:', err);
        res.status(500).json({ error: 'Failed to retrieve photos.' });
    }
});


/**
 * POST /photos/upload
 *
 * Accepts up to 10 photo files and an optional note (max 500 chars).
 * Files are saved to server/uploads/photos/ and their data stored in the DB.
 */
router.post('/upload', upload.array('photos', MAX_FILES), async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated.' });
    }

    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No photos uploaded.' });
    }

    const note = (req.body.note || '').slice(0, 500);
    const isPublic = req.body.public === 'true' || req.body.public === true;
    const [firstName, lastName] = req.user.split('_');

    try {
        const saved = [];
        for (const [i, file] of req.files.entries()) {
            const sanitized = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
            const filename = `${Date.now()}-${i}-${sanitized}`;
            try {
                fs.writeFileSync(path.join(UPLOAD_DIR, filename), file.buffer);
            } catch (fsErr) {
                console.error(`Failed to write file ${filename}:`, fsErr);
                return res.status(500).json({ error: 'Failed to save one or more files.' });
            }
            saved.push({ filename, originalName: file.originalname, size: file.size, buffer: file.buffer });
        }

        const uploadId = await db.write(
            `INSERT INTO uploads (date, note, public, user_id)
             VALUES (
                 $1,
                 $2,
                 $3,
                 (SELECT id FROM users WHERE first_name = $4 AND last_name = $5)
             )`,
            [new Date().toISOString(), note, isPublic, firstName, lastName]
        );

        if (!uploadId) {
            console.error('Failed to create upload record — no uploadId returned');
            return res.status(500).json({ error: 'Failed to record upload. User may not exist.' });
        }

        for (const file of saved) {
            await db.query(
                'INSERT INTO upload_files (upload_id, filename, file_data) VALUES ($1, $2, $3)',
                [uploadId, file.filename, file.buffer]
            );
        }

        console.log(`>>> Photos uploaded: ${saved.length} file(s). Note: "${note}"`);
        res.json({ success: true, count: saved.length, files: saved.map(f => ({ filename: f.filename, originalName: f.originalName, size: f.size })) });

    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ error: 'An error occurred while uploading photos.' });
    }
});


// Multer error handler
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError || err) {
        return res.status(400).json({ error: err.message });
    }
    next(err);
});


module.exports = router;
