const express = require('express');
const router = express.Router();
const path = require('path');


/**
 * GET /directions
 * 
 * Returns the HTML for the directions page
 */
router.get('/', (req, res) => {
  res.redirect('/html/directions.html');
});

module.exports = router;
