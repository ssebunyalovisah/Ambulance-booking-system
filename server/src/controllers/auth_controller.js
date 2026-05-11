// server/src/controllers/auth_controller.js
const { User, Company, Driver, RefreshToken } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const generateAccessToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
};

const generateRefreshToken = async (userId) => {
  const token = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

  await RefreshToken.create({
    user_id: userId,
    token,
    expires_at: expiresAt,
  });

  return token;
};

// 1. Signup (Admin/Company Onboarding)
exports.signup = async (req, res) => {
  const { name, companyName, email, password, role } = req.body;

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'This email is already registered' });
    }

    // Use companyName for the company name, not user's name
    const company = await Company.create({ 
      name: companyName || `${name}'s Company`, 
      email 
    });
    
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Normalize role to lowercase for DB ENUM compatibility
    const dbRole = (role || 'admin').toLowerCase();

    const user = await User.create({
      company_id: company.id,
      full_name: name,
      email,
      password_hash: passwordHash,
      role: dbRole === 'superadmin' ? 'super_admin' : 'admin',
    });

    res.status(201).json({
      message: 'Company and Admin registered successfully',
      user: {
        id: user.id,
        name: user.full_name,
        email: user.email,
        company_id: company.id,
        company_name: company.name,
        role: user.role,
      }
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: err.message || 'Signup failed' });
  }
};

// 2. Login Admin
exports.loginAdmin = async (req, res) => {
  const { email, password, rememberMe } = req.body;

  try {
    const user = await User.findOne({
      where: { email },
      include: [{ model: Company, attributes: ['name'] }],
    });

    if (!user || !(await user.validPassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const payload = { id: user.id, company_id: user.company_id, role: user.role };
    const accessToken = generateAccessToken(payload);
    let refreshToken = null;

    if (rememberMe) {
      refreshToken = await generateRefreshToken(user.id);
    }

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.full_name,
        email: user.email,
        role: user.role,
        company_id: user.company_id,
        company_name: user.Company?.name,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// 3. Login Driver (Smart Login)
exports.loginDriver = async (req, res) => {
  const { driver_name, driver_id, rememberMe } = req.body;

  try {
    const driver = await Driver.findOne({
      where: {
        driver_id,
        full_name: driver_name,
      },
      include: [{ model: Company, attributes: ['name'] }],
    });

    if (!driver) {
      return res.status(401).json({ error: 'Invalid driver credentials' });
    }

    const payload = { id: driver.id, company_id: driver.company_id, role: 'driver' };
    const accessToken = generateAccessToken(payload);
    let refreshToken = null;

    if (rememberMe) {
      refreshToken = await generateRefreshToken(driver.id);
    }

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: driver.id,
        name: driver.full_name,
        driver_id: driver.driver_id,
        role: 'driver',
        company_id: driver.company_id,
        company_name: driver.Company?.name,
        ambulance_id: driver.ambulance_id,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// 4. Refresh Token
exports.refreshToken = async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(401).json({ error: 'Refresh token required' });

  try {
    const refreshTokenEntry = await RefreshToken.findOne({
      where: { token },
      include: [{ model: User }],
    });

    if (!refreshTokenEntry || refreshTokenEntry.expires_at < new Date()) {
        // Check if it's a driver (drivers are not in users table)
        const driver = await Driver.findByPk(refreshTokenEntry?.user_id);
        if (!driver) {
            return res.status(401).json({ error: 'Invalid or expired refresh token' });
        }
        
        const accessToken = generateAccessToken({ id: driver.id, company_id: driver.company_id, role: 'driver' });
        await refreshTokenEntry.destroy();
        const newRefreshToken = await generateRefreshToken(driver.id);
        return res.json({ accessToken, refreshToken: newRefreshToken });
    }

    const user = refreshTokenEntry.User;
    const accessToken = generateAccessToken({ id: user.id, company_id: user.company_id, role: user.role });
    
    await refreshTokenEntry.destroy();
    const newRefreshToken = await generateRefreshToken(user.id);

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// 5. Logout
exports.logout = async (req, res) => {
  const { token } = req.body;
  try {
    if (token) {
      await RefreshToken.destroy({ where: { token } });
    }
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// 6. Get Me
exports.getMe = async (req, res) => {
  try {
    const { id, role } = req.user;
    if (role === 'driver') {
      const driver = await Driver.findByPk(id, {
        include: [{ model: Company, attributes: ['name'] }],
      });
      if (!driver) return res.status(404).json({ error: 'Driver not found' });
      return res.json({
        id: driver.id,
        name: driver.full_name,
        driver_id: driver.driver_id,
        role: 'driver',
        company_id: driver.company_id,
        company_name: driver.Company?.name,
        ambulance_id: driver.ambulance_id,
      });
    }

    const user = await User.findByPk(id, {
      include: [{ model: Company, attributes: ['name'] }],
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      id: user.id,
      name: user.full_name,
      email: user.email,
      role: user.role,
      company_id: user.company_id,
      company_name: user.Company?.name,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
