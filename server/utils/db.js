const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false,
    user: process.env.PGUSER, 
    password: process.env.PGPASSWORD
});


async function init() {

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
        VALUES ('JESSE', 'SMREKAR', '2099-01-01 01:00:00.000')
        ON CONFLICT DO NOTHING
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS uploads (
            id SERIAL PRIMARY KEY,
            date TEXT,
            note TEXT,
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

    console.log('✅ Database Initialized.');
}


function read(queryString, params) {
    return pool.query(queryString, params).then(result => result.rows);
}


function write(queryString) {
    const isInsert = queryString.trim().toUpperCase().startsWith('INSERT');
    const query = isInsert ? `${queryString} RETURNING *` : queryString;

    return pool.query(query).then(result => {
        if (isInsert && result.rows.length > 0) {
            return result.rows[0].id ?? null;
        }
        return null;
    });
}


function query(text, params) {
    return pool.query(text, params).then(result => result.rows);
}


module.exports = { init, read, write, query };
