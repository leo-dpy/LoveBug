const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/history/:otherUserId', verifyToken, chatController.getHistory);

module.exports = router;
