const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { verifyToken } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads/profiles/'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'user_' + req.user.id + '_' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

router.get('/me', verifyToken, profileController.getProfile);
router.put('/update', verifyToken, profileController.updateProfile);
router.post('/upload-avatar', verifyToken, upload.single('avatar'), profileController.updateAvatar);

module.exports = router;
