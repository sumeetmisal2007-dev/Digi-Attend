import crypto from 'crypto'

const TOKEN_WINDOW_SECONDS = 15

/**
 * Generate an HMAC-based rotating token that changes every 15 seconds.
 * Works like TOTP but using HMAC-SHA256 instead of HOTP.
 */
export function generateToken(secret) {
  const timeWindow = Math.floor(Date.now() / (TOKEN_WINDOW_SECONDS * 1000))
  return crypto
    .createHmac('sha256', secret)
    .update(String(timeWindow))
    .digest('hex')
    .slice(0, 16)
}

/**
 * Validate a scanned token against the session secret.
 * Checks current time window AND previous window to handle
 * the case where the student scans right as the token rotates.
 */
export function validateToken(secret, token) {
  const timeWindow = Math.floor(Date.now() / (TOKEN_WINDOW_SECONDS * 1000))

  for (let offset = 0; offset <= 1; offset++) {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(String(timeWindow - offset))
      .digest('hex')
      .slice(0, 16)

    if (expected === token) return true
  }

  return false
}

/**
 * How many seconds until the current token expires.
 */
export function secondsUntilExpiry() {
  return TOKEN_WINDOW_SECONDS - Math.floor((Date.now() / 1000) % TOKEN_WINDOW_SECONDS)
}
