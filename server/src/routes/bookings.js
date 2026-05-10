const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking_controller');
const auth = require('../middlewares/auth');

router.get('/', auth, bookingController.getBookings);
router.post('/', bookingController.createBooking); // Public
router.get('/:id', bookingController.getBooking);
router.patch('/:id/assign', auth, bookingController.assignBooking);
router.patch('/:id/accept', auth, bookingController.acceptBooking);
router.patch('/:id/dispatch', auth, bookingController.dispatchBooking);
router.patch('/:id/arrive', auth, bookingController.arriveBooking);
router.patch('/:id/complete', auth, bookingController.completeBooking);
router.patch('/:id/cancel', bookingController.cancelBooking);
router.patch('/:id/deny', auth, bookingController.denyBooking);

module.exports = router;
