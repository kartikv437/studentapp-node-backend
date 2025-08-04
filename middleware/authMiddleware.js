const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Add this

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Expect "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);    
    const user = await User.findById(decoded.userId); // 👈 fetch full user

    if (!user) {
      return res.status(401).json({ message: 'User not found.' });
    }

    req.user = user; // 👈 attach full user to request
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
};

module.exports = authenticateToken;