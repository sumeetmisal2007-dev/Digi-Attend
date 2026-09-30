import crypto from 'crypto'

const TOKEN_WINDOW_SECONDS = 15

/**
 * Generate an HMAC-based rotating token that changes every 15 seconds.
 * Works like TOTP but using HMAC-SHA256 instead of HOTP.
 */
export function generateToken(secret, offset = 0) {
  const timeWindow = Math.floor(Date.now() / (TOKEN_WINDOW_SECONDS * 1000)) - offset
  return crypto
    .createHmac('sha256', secret)
    .update(String(timeWindow))
    .digest('hex')
    .slice(0, 16)
}

/**
 * Validate a scanned token against the session secret.
 * Checks current time window AND previous window.
 */
export function validateToken(secret, token) {
  return token === generateToken(secret, 0) || token === generateToken(secret, 1)
}
