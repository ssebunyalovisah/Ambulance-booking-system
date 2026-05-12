const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (ex) {
        res.status(401).json({ error: 'Invalid token.' });
    }
};

const superAdminOnly = (req, res, next) => {
    const role = req.user.role?.toLowerCase();
    if (role !== 'super_admin') {
        return res.status(403).json({ error: 'Access denied. Super Admin privileges required.' });
    }
    next();
};

authMiddleware.superAdminOnly = superAdminOnly;
module.exports = authMiddleware;
