const express = require('express');
const router = express.Router();
const friendController = require('../controllers/friendController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/request', verifyToken, friendController.sendRequest);
router.post('/accept', verifyToken, friendController.acceptRequest);
router.get('/list', verifyToken, friendController.getFriends);
router.get('/pending', verifyToken, friendController.getPendingRequests);

module.exports = router;
