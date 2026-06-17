const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false,
    user: process.env.PGUSER, 
    password: process.env.PGPASSWORD
});


async function init() {
    try {
        // await pool.query('DELETE FROM users WHERE 1=1');
        // await pool.query('DELETE FROM uploads WHERE 1=1');
        // await pool.query('DELETE FROM upload_files WHERE 1=1');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                first_name TEXT,
                last_name TEXT,
                next_music_queue_date TIMESTAMPTZ,
                UNIQUE(first_name, last_name)
            )
        `);

        await pool.query(`
            INSERT INTO users (first_name, last_name, next_music_queue_date)
            VALUES ('JESSE', 'SMREKAR', '2099-01-01 12:00:00.000000-05')
            ON CONFLICT DO NOTHING
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS queued_tracks (
                id SERIAL PRIMARY KEY,
                user_id INTEGER,
                track_id TEXT
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS uploads (
                id SERIAL PRIMARY KEY,
                date TEXT,
                note TEXT,
                public BOOLEAN default false,
                user_id INTEGER
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS upload_files (
                id SERIAL PRIMARY KEY,
                upload_id INTEGER,
                filename TEXT,
                file_data BYTEA
            )
        `);

        await pool.query(`
           CREATE TABLE IF NOT EXISTS music_settings (
                id SERIAL PRIMARY KEY,
                queue_limit_enabled BOOLEAN default true,
                queue_wait_minutes INTEGER,
				explicit_allowed BOOLEAN default false

           ) 
        `);

        await pool.query(`
            INSERT INTO music_settings (id, queue_limit_enabled, queue_wait_minutes, explicit_allowed)
            VALUES (1, true, 30, false)
            ON CONFLICT DO NOTHING
        `);

        // Single-row table holding the shared Spotify user token. Populated when
        // an admin authorizes via /admin/spotify/login; read/refreshed by every
        // server instance so they share one token and survive restarts.
        await pool.query(`
            CREATE TABLE IF NOT EXISTS spotify_token (
                id            INTEGER PRIMARY KEY DEFAULT 1,
                access_token  TEXT,
                refresh_token TEXT,
                expires_at    TIMESTAMPTZ,
                updated_at    TIMESTAMPTZ DEFAULT now(),
                CONSTRAINT spotify_token_singleton CHECK (id = 1)
            )
        `);

        console.log('✅ Database Initialized.');
    } catch (err) {
        console.error('❌ Database init error:', err);
        throw err;
    }
}


function read(queryString, params) {
    return pool.query(queryString, params)
        .then(result => result.rows)
        .catch(err => {
            console.error('DB read error:', err.message);
            throw err;
        });
}


function write(queryString, params) {
    const isInsert = queryString.trim().toUpperCase().startsWith('INSERT');
    const query = isInsert ? `${queryString} RETURNING *` : queryString;

    return pool.query(query, params)
        .then(result => {
            if (isInsert && result.rows.length > 0) {
                return result.rows[0].id ?? null;
            }
            return result.rows;
        })
        .catch(err => {
            console.error('DB write error:', err.message);
            throw err;
        });
}


function query(text, params) {
    return pool.query(text, params)
        .then(result => result.rows)
        .catch(err => {
            console.error('DB query error:', err.message);
            throw err;
        });
}


module.exports = { init, read, write, query };
