const jwt = require('jsonwebtoken');
const { UserModal } = require('../model/userModel');
const secretkey = "secretkey"; // use env in prod

async function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ message: 'Unauthorized: No token' });

        const token = authHeader.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'Unauthorized: Invalid token format' });

        const decoded = jwt.verify(token, secretkey);
        const user = await UserModal.findById(decoded.id);

        if (!user) return res.status(401).json({ message: 'Unauthorized: User not found' });

        req.user = {
            id: user._id,
            email: user.email,
            role: user.role || 'user'
        };

        next();
    } catch (err) {
        console.error('Authentication error:', err.message);
        res.status(401).json({ message: 'Unauthorized: Token expired or invalid' });
    }
}

function adminOnly(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: Admins only' });
    }
    next();
}

module.exports = { authenticate, adminOnly };
