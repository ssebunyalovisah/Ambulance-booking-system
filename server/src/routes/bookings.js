const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking_controller');
const auth = require('../middlewares/auth');

router.get('/',           auth, bookingController.getBookings);
router.post('/',                bookingController.createBooking);   // Public — client app
// Must come before /:id to avoid "active" being treated as an ID
router.get('/active',           bookingController.getActiveBookingForDriver); // Driver reconnect reconciliation
router.get('/:id',              bookingController.getBooking);

// Driver actions
router.patch('/:id/accept',   auth, bookingController.acceptBooking);
router.patch('/:id/deny',     auth, bookingController.denyBooking);
router.patch('/:id/timeout',  auth, bookingController.timeoutBooking);  // 30s countdown expired
router.patch('/:id/arrive',   auth, bookingController.arriveBooking);
router.patch('/:id/complete', auth, bookingController.completeBooking);
router.patch('/:id/cancel',        bookingController.cancelBooking);
router.patch('/:id/dispatch', auth, bookingController.dispatchBooking);

// Admin actions
router.patch('/:id/assign',   auth, bookingController.assignBooking);   // Initial link
router.patch('/:id/reassign', auth, bookingController.reassignBooking); // Fallback after deny/timeout

module.exports = router;
