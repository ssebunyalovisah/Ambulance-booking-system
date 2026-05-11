const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth_controller');
const auth = require('../middlewares/auth');

router.post('/signup', authController.signup);
router.post('/login/admin', authController.loginAdmin);
router.post('/login/driver', authController.loginDriver);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);
router.get('/verify/:email', authController.verifyEmail);
router.get('/me', auth, authController.getMe);

module.exports = router;
