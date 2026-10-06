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
 * Validate a scanned token against the session secret using timing-safe comparison.
 * Checks current time window AND adjacent window (to allow for minor clock skew).
 */
export function validateToken(secret, token) {
  if (typeof secret !== 'string' || typeof token !== 'string' || token.length !== 16) {
    return false
  }

  const tokenBuf = Buffer.from(token, 'utf8')

  // Check current window (0) and previous window (1)
  const candidateWindows = [0, 1]

  for (const offset of candidateWindows) {
    const candidate = generateToken(secret, offset)
    const candidateBuf = Buffer.from(candidate, 'utf8')
    if (tokenBuf.length === candidateBuf.length && crypto.timingSafeEqual(tokenBuf, candidateBuf)) {
      return true
    }
  }

  return false
}
