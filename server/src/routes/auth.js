const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth_controller');
const auth = require('../middlewares/auth');

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout); // No auth required — access token may be expired
router.get('/me', auth, authController.getMe);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
