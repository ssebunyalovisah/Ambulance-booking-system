const express = require('express');
const router = express.Router();
const locationController = require('../controllers/location_controller');
const auth = require('../middlewares/auth');

router.get('/ambulances/nearby', locationController.getNearbyAmbulances);
router.post('/patient', locationController.updatePatientLocation);
router.post('/driver', auth, locationController.updateDriverLocation);

module.exports = router;
