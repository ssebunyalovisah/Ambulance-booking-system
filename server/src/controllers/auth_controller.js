const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// In-memory store for password reset tokens (use a DB table in production)
const passwordResetTokens = new Map();

const generateAccessToken = (admin) => {
    return jwt.sign(
        { id: admin.id, company_id: admin.company_id, role: admin.role },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );
};

const generateRefreshToken = async (adminId) => {
    const token = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiry

    await db.query(
        'INSERT INTO refresh_tokens (admin_id, token, expires_at) VALUES ($1, $2, $3)',
        [adminId, token, expiresAt.toISOString()]
    );

    return token;
};

exports.signup = async (req, res) => {
    const { name, companyName, email, password, role } = req.body;

    try {
        // Check if admin already exists
        const existingAdmin = await db.query('SELECT * FROM admins WHERE email = $1', [email]);
        if (existingAdmin.rowCount > 0) {
            return res.status(400).json({ error: 'Admin with this email already exists' });
        }

        // Create company first
        const companyResult = await db.query(
            'INSERT INTO companies (name, contact_email) VALUES ($1, $2)',
            [companyName, email]
        );
        const companyId = companyResult.lastID;

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Create admin
        const adminResult = await db.query(
            'INSERT INTO admins (company_id, name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5)',
            [companyId, name, email, passwordHash, role || 'ADMIN']
        );
        const adminId = adminResult.lastID;

        res.status(201).json({
            message: 'Admin registered successfully',
            admin: { 
                id: adminId, 
                name, 
                email, 
                company_id: companyId, 
                company_name: companyName,
                role: role || 'ADMIN' 
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.login = async (req, res) => {
    const { email, password, rememberMe } = req.body;

    try {
        const result = await db.query(
            `SELECT a.*, c.name as company_name 
             FROM admins a 
             JOIN companies c ON a.company_id = c.id 
             WHERE a.email = $1`, 
            [email]
        );
        const admin = result.rows[0];

        if (!admin) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, admin.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const accessToken = generateAccessToken(admin);
        let refreshToken = null;

        if (rememberMe) {
            refreshToken = await generateRefreshToken(admin.id);
        }

        res.json({
            accessToken,
            refreshToken,
            admin: {
                id: admin.id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
                company_id: admin.company_id,
                company_name: admin.company_name
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

        const adminResult = await db.query('SELECT * FROM admins WHERE id = $1', [refreshTokenEntry.admin_id]);
        const admin = adminResult.rows[0];

        if (!admin) {
            return res.status(401).json({ error: 'User not found' });
        }

        const accessToken = generateAccessToken(admin);
        
        // Rotate refresh token
        await db.query('DELETE FROM refresh_tokens WHERE id = $1', [refreshTokenEntry.id]);
        const newRefreshToken = await generateRefreshToken(admin.id);

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
        const result = await db.query(
            `SELECT a.id, a.name, a.email, a.role, a.company_id, c.name as company_name 
             FROM admins a 
             JOIN companies c ON a.company_id = c.id 
             WHERE a.id = $1`, 
            [req.admin.id]
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
        const result = await db.query('SELECT id, name FROM admins WHERE email = $1', [email]);
        // Always return 200 to prevent email enumeration
        if (result.rowCount === 0) {
            return res.json({ message: 'If that email exists, a reset link has been sent.' });
        }

        const admin = result.rows[0];
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expires = Date.now() + 1000 * 60 * 60; // 1 hour

        passwordResetTokens.set(resetToken, { adminId: admin.id, expires });

        // In production: send email with reset link
        // For dev: log the token so it can be used manually
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

        await db.query('UPDATE admins SET password_hash = $1 WHERE id = $2', [passwordHash, entry.adminId]);

        // Invalidate the token
        passwordResetTokens.delete(token);

        res.json({ message: 'Password reset successfully. You can now log in.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};
