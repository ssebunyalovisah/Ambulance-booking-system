const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking_controller');
const auth = require('../middlewares/auth');

router.use(auth);

router.get('/', bookingController.getAdminBookings);
router.patch('/:id/status', bookingController.updateBookingStatus);

module.exports = router;
