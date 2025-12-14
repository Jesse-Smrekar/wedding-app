require('dotenv').config();
const jwt = require('jsonwebtoken');
const db = require('./db.js');

const SECRET_KEY = process.env.JWT_SECRET;
const JWT_TTL = '24h';
const JWT_TTL_MILLIS = 86400000;


const auth = (req, res, next) => {

    // skip auth for the home page, login screen, and non-html requests
    if (["/favicon.ico", "/", "/login", "/login/user"].includes(req.path)
        || req.path.indexOf(".js") > 0 
        || req.path.indexOf(".css") > 0) {
        next();
        return;
    }

    const token = req.header('Authorization')?.split(' ')[1];

    // if we don't have a JWT, redirect to the login screen
    if (!token) return res.redirect("/login");

    try {
        const decode = jwt.verify(token, SECRET_KEY);
        req.user = decode;
        console.log(`Successfully auth'd ${decode}`)
        next();
    } catch (error) {
        res.status(400).json({ error: 'Invalid Token' });
    }
};

function generateJWT(firstName, lastName) {

    return "FOOBAR_TOKEN";
    // db.read(`SELECT * FROM USERS WHERE FIRST_NAME = '${firstName.toUpperCase()}' AND LAST_NAME = '${lastName.toUpperCase()}'`).then(result => {
        
    //     if (result) {
    //         var payload = {
    //             user: `${result.FIRST_NAME}_${result.LAST_NAME}`, 
    //             role: result.ROLE
    //         };

    //         return jwt.sign(payload, SECRET_KEY, { expiresIn: JWT_TTL });
    //     }
    // });
}

module.exports = {
    auth, generateJWT, JWT_TTL_MILLIS
};
