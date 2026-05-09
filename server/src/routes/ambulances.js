const express = require('express');
const router = express.Router();
const ambulanceController = require('../controllers/ambulance_controller');
const auth = require('../middlewares/auth');

router.get('/', auth, ambulanceController.getAmbulances);
router.post('/', auth, ambulanceController.registerAmbulance);
router.patch('/:id/status', auth, ambulanceController.updateAmbulanceStatus);
router.patch('/:id', auth, ambulanceController.updateAmbulance);
router.delete('/:id', auth, ambulanceController.deleteAmbulance);

// Note: /location/ambulances/nearby will be in the location router

module.exports = router;
