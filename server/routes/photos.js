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


/**
 * GET /photos/mine
 *
 * Returns the photos uploaded by the current user.
 */
router.get('/mine', async (req, res) => {
    const [fname, lname] = req.user.split('_');

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
});


/**
 * POST /photos/upload
 *
 * Accepts up to 10 photo files and an optional note (max 500 chars).
 * Files are saved to server/uploads/photos/ and their data stored in the DB.
 */
router.post('/upload', upload.array('photos', MAX_FILES), async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No photos uploaded.' });
    }

    const note = (req.body.note || '').slice(0, 500);
    const [firstName, lastName] = req.user.split('_');

    const saved = req.files.map((file, i) => {
        const sanitized = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filename = `${Date.now()}-${i}-${sanitized}`;
        fs.writeFileSync(path.join(UPLOAD_DIR, filename), file.buffer);
        return { filename, originalName: file.originalname, size: file.size, buffer: file.buffer };
    });

    const uploadId = await db.write(
        `INSERT INTO uploads (date, note, user_id)
        VALUES (
            '${new Date().toISOString()}',
            '${note}',
            (SELECT id FROM users WHERE first_name = '${firstName}' AND last_name = '${lastName}')
        )`
    );

    for (const file of saved) {
        await db.query(
            'INSERT INTO upload_files (upload_id, filename, file_data) VALUES ($1, $2, $3)',
            [uploadId, file.filename, file.buffer]
        );
    }

    console.log(`>>> Photos uploaded: ${saved.length} file(s). Note: "${note}"`);
    res.json({ success: true, count: saved.length, files: saved.map(f => ({ filename: f.filename, originalName: f.originalName, size: f.size })) });
});


// Multer error handler
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError || err) {
        return res.status(400).json({ error: err.message });
    }
    next(err);
});


module.exports = router;
