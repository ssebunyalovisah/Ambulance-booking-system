const express = require('express');
const router = express.Router();
const companyController = require('../controllers/company_controller');
const auth = require('../middlewares/auth');

router.use(auth);

router.get('/', companyController.getAllCompanies);
router.delete('/:id', companyController.deleteCompany);

module.exports = router;
