const express = require('express');
const router = express.Router();
const casinoController = require('../controllers/casinoController');
const { verifyToken } = require('../middleware/authMiddleware');

// Get current token balance
router.get('/balance', verifyToken, casinoController.getBalance);

// Play Wheel of Fortune
router.post('/spin-wheel', verifyToken, casinoController.spinWheel);

// Play Russian Roulette
router.post('/russian-roulette', verifyToken, casinoController.playRoulette);

// Get Russian Roulette state (bullets & lockout)
router.get('/roulette-state', verifyToken, casinoController.getRouletteState);

module.exports = router;
