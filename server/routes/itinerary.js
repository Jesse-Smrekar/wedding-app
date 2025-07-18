const express = require('express');
const router = express.Router();
const path = require('path');





/**
 * GET /itinerary
 * 
 * Returns the HTML for the itinerary page
 */
router.get('/', (req, res) => {

  res.set('Content-Type', 'text/html');
  res.sendFile(path.join(__dirname, '../../public', '/html/itinerary.html'));  
});

module.exports = router;