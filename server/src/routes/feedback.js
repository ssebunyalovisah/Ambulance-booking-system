const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedback_controller');
const auth = require('../middlewares/auth');

router.post('/', feedbackController.submitFeedback);
router.get('/admin/all', auth, feedbackController.getAllFeedback);

module.exports = router;
