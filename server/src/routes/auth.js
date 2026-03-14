const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth_controller');
const auth = require('../middlewares/auth');

router.post('/login', authController.login);
router.get('/me', auth, authController.getMe);

module.exports = router;
