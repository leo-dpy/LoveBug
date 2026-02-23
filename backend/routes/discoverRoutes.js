const express = require('express');
const router = express.Router();
const discoverController = require('../controllers/discoverController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/potentials', verifyToken, discoverController.getPotentials);
router.post('/swipe', verifyToken, discoverController.swipe);

module.exports = router;
