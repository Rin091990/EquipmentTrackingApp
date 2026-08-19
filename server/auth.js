const crypto = require('crypto');
const { AUTH_SECRET, TOKEN_MAX_AGE_MS } = require('./config');

const users = [
  {
    username: process.env.ADMIN_USERNAME,
    password: process.env.ADMIN_PASSWORD,
    role: 'admin',
  },
  {
    username: process.env.VIEWER_USERNAME,
    password: process.env.VIEWER_PASSWORD,
    role: 'viewer',
  },
];

const encodePayload = (payload) =>
  Buffer.from(JSON.stringify(payload)).toString('base64url');

const signPayload = (payload) =>
  crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('base64url');

const createToken = (user) => {
  const payload = encodePayload({
    username: user.username,
    role: user.role,
    expiresAt: Date.now() + TOKEN_MAX_AGE_MS,
  });

  return `${payload}.${signPayload(payload)}`;
};

const verifyToken = (token) => {
  if (!token || !token.includes('.')) return null;

  const [payload, signature] = token.split('.');
  if (signature !== signPayload(payload)) return null;

  try {
    const user = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!user.expiresAt || Date.now() > user.expiresAt) return null;
    return user;
  } catch (err) {
    return null;
  }
};

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const user = verifyToken(token);

  if (!user) {
    return res.status(401).json({ error: 'נדרשת התחברות למערכת' });
  }

  req.user = user;
  next();
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'נדרשת הרשאת אדמין' });
  }

  next();
};

module.exports = { users, createToken, verifyToken, requireAuth, requireAdmin };
