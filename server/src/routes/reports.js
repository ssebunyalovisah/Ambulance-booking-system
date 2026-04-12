const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report_controller');
const auth = require('../middlewares/auth');

router.use(auth);

router.get('/', reportController.getReportsData);

module.exports = router;
