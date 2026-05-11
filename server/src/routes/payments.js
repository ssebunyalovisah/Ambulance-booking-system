const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment_controller');
const auth = require('../middlewares/auth');

router.post('/initiate', paymentController.initiatePayment);
router.get('/status/:booking_id', paymentController.getPaymentStatus);
router.post('/webhook', paymentController.handlePaymentWebhook);

router.get('/', auth, paymentController.getAllPayments);
router.patch('/:id/status', auth, paymentController.updatePaymentStatus);
router.get('/transactions', auth, paymentController.getTransactionRecords);

module.exports = router;
