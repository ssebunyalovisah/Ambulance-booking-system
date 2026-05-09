const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth_controller');
const auth = require('../middlewares/auth');

router.post('/register', authController.signup);
router.post('/login/admin', authController.loginAdmin);
router.post('/login/driver', authController.loginDriver);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);
router.get('/me', auth, authController.getMe);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
