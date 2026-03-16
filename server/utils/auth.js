require('dotenv').config();
const jwt = require('jsonwebtoken');
const db = require('./db.js');

const SECRET_KEY = process.env.JWT_SECRET;
const JWT_TTL = '24h';
const JWT_TTL_MILLIS = 86400000;

/**
 * Note to reader: this is not real auth. It's not trying to be real auth. We just want a way to distinguish users
 * and be able to identify their actions. This is going to run for a total of like 6 hours and no personal data will be 
 * uploaded. Don't worry about it.
 */
const auth = (req, res, next) => {

    // skip auth for the home page, login screen, and non-html requests
    if (["/", "/login", "/login/user", "/spotify/auth/redirect"].includes(req.path)
        || req.path.indexOf(".js") > 0 
        || req.path.indexOf(".css") > 0) {
        next();
        return;
    }

    // look for auth header
    var token = req.header('Authorization')?.split(' ')[1];

    // if missing, try from cookies
    if (!token) {
        token = req.header('cookie')?.substring(4);
    }

    // if we don't have a JWT, redirect to the login screen
    if (!token) return res.redirect("/login");

    try {
        const decode = jwt.verify(token, SECRET_KEY);
        req.user = decode.user;
        console.log(`Successfully auth'd ${req.user}`)
        next();
    } catch (error) {
        res.status(400).json({ error: 'Invalid Token' });
    }
};


async function createUser(firstName, lastName) {
    return db.write(`INSERT OR IGNORE INTO USERS (FIRST_NAME, LAST_NAME, NEXT_MUSIC_QUEUE_DATE) VALUES ('${firstName.toUpperCase()}', '${lastName.toUpperCase()}', '2099-01-01 01:00:00.000')`);
}

async function generateJWT(firstName, lastName) {
    let result = await db.read(`SELECT * FROM USERS WHERE FIRST_NAME = '${firstName.toUpperCase()}' AND LAST_NAME = '${lastName.toUpperCase()}'`);
    let user = result[0];

    if (!user) {
        await createUser(firstName, lastName);
        result = await db.read(`SELECT * FROM USERS WHERE FIRST_NAME = '${firstName.toUpperCase()}' AND LAST_NAME = '${lastName.toUpperCase()}'`);
        user = result[0];
    }

    if (!user) throw new Error(`Failed to find or create user: ${firstName} ${lastName}`);

    const payload = {
        user: `${user.FIRST_NAME}_${user.LAST_NAME}`,
        role: user.ROLE
    };

    return jwt.sign(payload, SECRET_KEY, { expiresIn: JWT_TTL });
}

module.exports = {
    auth, generateJWT, JWT_TTL_MILLIS
};
