const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driver_controller');
const auth = require('../middlewares/auth');

router.use(auth);

router.get('/', driverController.getDrivers);
router.post('/', driverController.createDriver);
router.get('/:id', driverController.getDriver);
router.patch('/:id', driverController.updateDriver);
router.patch('/self/status', driverController.updateSelfStatus);

module.exports = router;
