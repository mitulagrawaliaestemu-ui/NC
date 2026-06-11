import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'iaeste_secret_key_2026';

export const auth = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    return res.status(401).json({ message: 'No authorization token, access denied' });
  }

  const token = authHeader.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'No token found in Bearer schema, access denied' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is invalid or expired, authorization failed' });
  }
};

export const requireNCAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'NC_ADMIN') {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden: NC Admin access required' });
  }
};

export const requireLCAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'LC_ADMIN') {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden: LC Admin access required' });
  }
};

export const requireMember = (req, res, next) => {
  if (req.user && req.user.role === 'MEMBER') {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden: Member access required' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'NC_ADMIN' || req.user.role === 'LC_ADMIN')) {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden: Admin access required' });
  }
};
