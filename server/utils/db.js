const sqlite3 = require('sqlite3').verbose();


var DB = new sqlite3.Database('wedding.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('✅ Opened database connection.');
});


// function close(db) {
//     db.close((err) => {
//       if (err) {
//         console.error(err.message);
//       }
//       console.log('✅ Closed the database connection.');
//     });
// }


async function init() {
    const initScript = `
        CREATE TABLE IF NOT EXISTS USERS (ID INTEGER PRIMARY KEY, FIRST_NAME TEXT, LAST_NAME TEXT, NEXT_MUSIC_QUEUE_DATE TEXT, UNIQUE(FIRST_NAME, LAST_NAME));
        INSERT OR IGNORE INTO USERS VALUES (1, 'JESSE', 'SMREKAR', '2099-01-01 01:00:00.000');

        CREATE TABLE IF NOT EXISTS UPLOADS (ID INTEGER PRIMARY KEY, DATE TEXT, NOTE TEXT, USER_ID INTEGER);
        INSERT OR IGNORE INTO UPLOADS VALUES (1, '2099-01-01 01:00:00.000', 'TEST NOTE', 1);

        CREATE TABLE IF NOT EXISTS UPLOAD_FILES (UPLOAD_ID INTEGER PRIMARY KEY, FILENAME TEXT);
        INSERT OR IGNORE INTO UPLOAD_FILES VALUES (1, 'TEST_FILE_NAME');
    `;

    while(!DB.open) { 
        await sleep(1000);
    }

    DB.exec(initScript, (err) =>{
        if (err) {
            console.error(err.message);
            if (err.message.indexOf('NOTADB')) {
                console.error("DB not initialized. You need to run `sqlite3 wedding.db`");
            }
        }
        console.log('✅ Database Initialized.');
    });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function read(queryString) {

    return new Promise((resolve, reject) => {
        DB.all(queryString, (err, res) => {
            if (err) return reject(err);

            return resolve(res);
        });
    });
}

/**
 * Writes to the database with the given query.
 * 
 * @param {*} queryString - the "write" query to execute
 * @returns the last inserted ID
 */
function write(queryString) {
    return new Promise((resolve, reject) => {
        DB.run(queryString, (result, err) => {
            if (err) return reject(err);

            read('SELECT last_insert_rowid() as last')
            .then(ans => {
                return resolve(ans[0].last)
            });
        });
    });
}


module.exports = {
  init, read, write
};
