const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment_controller');
const auth = require('../middlewares/auth');

router.get('/', auth, paymentController.getAllPayments);
router.patch('/:id/status', auth, paymentController.updatePaymentStatus);
router.get('/transactions', auth, paymentController.getTransactionRecords);

module.exports = router;
