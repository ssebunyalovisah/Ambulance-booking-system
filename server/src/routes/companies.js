const express = require('express');
const router = express.Router();
const companyController = require('../controllers/company_controller');
const auth = require('../middlewares/auth');

router.use(auth);

router.get('/', auth.superAdminOnly, companyController.getCompanies);
router.delete('/:id', auth.superAdminOnly, companyController.deleteCompany);

module.exports = router;
