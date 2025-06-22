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


function init() {
    const initScript = `
        CREATE TABLE IF NOT EXISTS USERS (FIRST_NAME TEXT, LAST_NAME TEXT, NEXT_MUSIC_QUEUE_DATE TEXT, UNIQUE(FIRST_NAME, LAST_NAME));
        INSERT OR IGNORE INTO USERS VALUES ('JESSE', 'SMREKAR', '2099-01-01 01:00:00.000');
    `
    DB = new sqlite3.Database('wedding.db', (err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('✅ Opened database connection.');
    });

    DB.run(initScript, (err) =>{
        if (err) {
            console.error(err.message);
        }
    }).then((result) => {
        console.log('✅ Database Initialized.');
    });
}


function read(queryString) {

    return DB.all(queryString, (err, rows) =>{
        if (err) {
            console.error(err.message);
        }
        console.log(rows);
        return rows;
    });

    // var DB;
    // try {
    //     DB = await open();
    //     var result = await DB.all(queryString);
    //     console.log(result);
    //     return result;
    // } finally {
    //     if (DB) close(DB);
    // }
}

async function write(queryString) {
//     var DB;
//     try {
//         DB = await open();
//         var result = await DB.run(queryString);
//         console.log(result);
//         return result;
//     } finally {
//         if (DB) close(DB);
//     }
}


module.exports = {
  init, read, write
};