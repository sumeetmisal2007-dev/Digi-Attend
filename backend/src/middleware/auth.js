import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'terna-digital-attendance-secret-key-2026'

/**
 * Middleware to verify JWT token from Authorization header.
 * Attaches decoded user payload to req.user.
 */
export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization || ''
  
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Authentication required. Missing Bearer token.',
      code: 'AUTH_REQUIRED'
    })
  }

  const token = authHeader.slice(7).trim()

  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] })
    req.user = decoded
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Session expired. Please log in again.',
        code: 'TOKEN_EXPIRED'
      })
    }
    return res.status(403).json({
      error: 'Invalid authentication token.',
      code: 'TOKEN_INVALID'
    })
  }
}

/**
 * Middleware to enforce Role-Based Access Control (RBAC).
 * @param {string|string[]} roles - Single role or array of allowed roles (e.g. ['admin', 'hod'])
 */
export const authorize = (roles = []) => {
  const allowed = Array.isArray(roles) ? roles : [roles]

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' })
    }

    if (allowed.length > 0 && !allowed.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Requires one of [${allowed.join(', ')}] roles. Your role is '${req.user.role}'.`,
        code: 'FORBIDDEN_ROLE'
      })
    }

    next()
  }
}
