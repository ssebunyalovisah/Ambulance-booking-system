const express = require('express');
const router = express.Router();
const ambulanceController = require('../controllers/ambulance_controller');
const auth = require('../middlewares/auth');

router.use(auth); // Protect all ambulance routes

router.post('/', ambulanceController.registerAmbulance);
router.get('/', ambulanceController.getAmbulances);
router.patch('/:id/status', ambulanceController.updateAmbulanceStatus);
router.patch('/:id/location', ambulanceController.updateLocation);
router.patch('/:id', ambulanceController.updateAmbulance);
router.delete('/:id', ambulanceController.deleteAmbulance);

module.exports = router;
