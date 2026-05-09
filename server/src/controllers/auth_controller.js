const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const passwordResetTokens = new Map();

const generateAccessToken = (user) => {
    return jwt.sign(
        { id: user.id, company_id: user.company_id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );
};

const generateRefreshToken = async (userId) => {
    const token = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); 

    await db.query(
        'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
        [userId, token, expiresAt.toISOString()]
    );

    return token;
};

exports.signup = async (req, res) => {
    const { name, companyName, email, password, role } = req.body;

    try {
        // Check if email already exists in users or companies
        const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        const existingCompany = await db.query('SELECT id FROM companies WHERE email = $1', [email]);
        
        if (existingUser.rowCount > 0 || existingCompany.rowCount > 0) {
            return res.status(400).json({ error: 'This email is already registered' });
        }

        const normalizedRole = (role || 'admin').toLowerCase();

        const companyResult = await db.query(
            'INSERT INTO companies (name, email) VALUES ($1, $2) RETURNING id',
            [companyName, email]
        );
        const companyId = companyResult.rows[0].id;

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const adminResult = await db.query(
            'INSERT INTO users (company_id, full_name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [companyId, name, email, passwordHash, normalizedRole]
        );
        const adminId = adminResult.rows[0].id;

        res.status(201).json({
            message: 'Company and Admin registered successfully',
            admin: { 
                id: adminId, 
                name, 
                email, 
                company_id: companyId, 
                company_name: companyName,
                role: normalizedRole
            }
        });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ error: 'Failed to create account. Please try again later.' });
    }
};

exports.loginAdmin = async (req, res) => {
    const { email, password, rememberMe } = req.body;

    try {
        const result = await db.query(
            `SELECT u.*, c.name as company_name 
             FROM users u 
             JOIN companies c ON u.company_id = c.id 
             WHERE u.email = $1`, 
            [email]
        );
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const accessToken = generateAccessToken(user);
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
                company_name: user.company_name
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.loginDriver = async (req, res) => {
    const { driver_name, driver_id, rememberMe } = req.body;

    try {
        const result = await db.query(
            `SELECT d.*, c.name as company_name 
             FROM drivers d 
             JOIN companies c ON d.company_id = c.id 
             WHERE LOWER(TRIM(d.driver_id)) = LOWER(TRIM($1)) AND LOWER(TRIM(d.full_name)) = LOWER(TRIM($2))`, 
            [driver_id, driver_name]
        );
        const driver = result.rows[0];

        if (!driver) {
            return res.status(401).json({ error: 'Invalid driver credentials' });
        }

        const userPayload = {
            id: driver.id,
            company_id: driver.company_id,
            role: 'driver'
        };

        const accessToken = generateAccessToken(userPayload);
        let refreshToken = null;
        
        // We can skip refresh token for drivers for now, or just use user_id = driver.id + 1000000. Let's just issue token.

        res.json({
            accessToken,
            refreshToken,
            user: {
                id: driver.id,
                name: driver.full_name,
                driver_id: driver.driver_id,
                role: 'driver',
                company_id: driver.company_id,
                company_name: driver.company_name,
                ambulance_id: driver.ambulance_id
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.refreshToken = async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(401).json({ error: 'Refresh token is required' });
    }

    try {
        const result = await db.query(
            'SELECT * FROM refresh_tokens WHERE token = $1 AND expires_at > $2',
            [token, new Date().toISOString()]
        );
        const refreshTokenEntry = result.rows[0];

        if (!refreshTokenEntry) {
            return res.status(401).json({ error: 'Invalid or expired refresh token' });
        }

        const userResult = await db.query('SELECT * FROM users WHERE id = $1', [refreshTokenEntry.user_id]);
        const user = userResult.rows[0];

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        const accessToken = generateAccessToken(user);
        
        await db.query('DELETE FROM refresh_tokens WHERE id = $1', [refreshTokenEntry.id]);
        const newRefreshToken = await generateRefreshToken(user.id);

        res.json({ accessToken, refreshToken: newRefreshToken });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.logout = async (req, res) => {
    const { token } = req.body;
    try {
        if (token) {
            await db.query('DELETE FROM refresh_tokens WHERE token = $1', [token]);
        }
        res.json({ message: 'Logged out successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getMe = async (req, res) => {
    try {
        if (req.user.role === 'driver') {
            const result = await db.query(
                `SELECT d.*, c.name as company_name 
                 FROM drivers d 
                 JOIN companies c ON d.company_id = c.id 
                 WHERE d.id = $1`, 
                [req.user.id]
            );
            if (result.rowCount === 0) return res.status(404).json({ error: 'Driver not found' });
            const d = result.rows[0];
            return res.json({ id: d.id, name: d.full_name, driver_id: d.driver_id, role: 'driver', company_id: d.company_id, company_name: d.company_name, ambulance_id: d.ambulance_id });
        }

        const result = await db.query(
            `SELECT u.id, u.full_name as name, u.email, u.role, u.company_id, c.name as company_name 
             FROM users u 
             JOIN companies c ON u.company_id = c.id 
             WHERE u.id = $1`, 
            [req.user.id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    try {
        const result = await db.query('SELECT id, full_name FROM users WHERE email = $1', [email]);
        if (result.rowCount === 0) {
            return res.json({ message: 'If that email exists, a reset link has been sent.' });
        }

        const user = result.rows[0];
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expires = Date.now() + 1000 * 60 * 60; // 1 hour

        passwordResetTokens.set(resetToken, { userId: user.id, expires });

        const resetLink = `http://localhost:5174/reset-password?token=${resetToken}`;
        console.log(`\n[DEV] Password reset link for ${email}:\n${resetLink}\n`);

        res.json({ message: 'If that email exists, a reset link has been sent.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.resetPassword = async (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) {
        return res.status(400).json({ error: 'Token and new password are required' });
    }

    const entry = passwordResetTokens.get(token);
    if (!entry || entry.expires < Date.now()) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, entry.userId]);

        passwordResetTokens.delete(token);

        res.json({ message: 'Password reset successfully. You can now log in.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};
