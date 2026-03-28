const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const db = require('../utils/db.js');

const ALLOWED_EXTENSIONS = /\.(jpg|jpeg|png|heic|heif|raw|arw|cr2|nef|orf|rw2|sr2)$/i;
const MAX_FILES = 10;
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB per file

const storage = multer.diskStorage({
    destination: path.join(__dirname, '../../server/uploads/photos'),
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const sanitized = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        cb(null, `${timestamp}-${sanitized}`);
    }
});

const upload = multer({
    storage,
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
    res.set('Content-Type', 'text/html');
    res.sendFile(path.join(__dirname, '../../public/html/photos.html'));
});


/**
 * POST /photos/upload
 *
 * Accepts up to 10 photo files and an optional note (max 500 chars).
 * Files are saved to server/uploads/photos/.
 */
router.post('/upload', upload.array('photos', MAX_FILES), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No photos uploaded.' });
    }

    const note = (req.body.note || '').slice(0, 500);
    const saved = req.files.map(f => ({ filename: f.filename, originalName: f.originalname, size: f.size }));

    db.write(
        `INSERT INTO UPLOADS 
        (DATE, NOTE, USER_ID)
        VALUES (
            '${new Date().toISOString()}',
            '${note}',
            (SELECT ID FROM USERS WHERE FIRST_NAME = '${req.user.split('_')[0]}' AND LAST_NAME = '${req.user.split('_')[1]}')
        )`
    ).then(uploadId => {
        for (let file of saved) {
            db.write(
                `INSERT INTO UPLOAD_FILES
                (UPLOAD_ID, FILENAME)
                VALUES
                (${uploadId}, '${file.filename}');        
            `)
        }
    });

    console.log(`>>> Photos uploaded: ${saved.length} file(s). Note: "${note}"`);
    res.json({ success: true, count: saved.length, files: saved });
});


// Multer error handler
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError || err) {
        return res.status(400).json({ error: err.message });
    }
    next(err);
});


module.exports = router;
