// server/src/controllers/company_controller.js
const { Company } = require('../models');

exports.getCompanies = async (req, res) => {
  try {
    const companies = await Company.findAll({
      order: [['name', 'ASC']],
    });
    res.json(companies);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching companies' });
  }
};

exports.getCompany = async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id);
    if (!company) return res.status(404).json({ error: 'Company not found' });
    res.json(company);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteCompany = async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id);
    if (!company) return res.status(404).json({ error: 'Company not found' });
    
    await company.destroy();
    res.json({ message: 'Company deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error deleting company' });
  }
};
