const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/me', verifyToken, profileController.getProfile);
router.put('/update', verifyToken, profileController.updateProfile);

module.exports = router;
