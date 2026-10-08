import crypto from 'crypto'

const TOKEN_WINDOW_SECONDS = 15

export function generateToken(secret, offset = 0) {
  const timeWindow = Math.floor(Date.now() / (TOKEN_WINDOW_SECONDS * 1000)) - offset
  return crypto
    .createHmac('sha256', secret)
    .update(String(timeWindow))
    .digest('hex')
    .slice(0, 16)
}

export function validateToken(secret, token) {
  if (typeof secret !== 'string' || typeof token !== 'string' || token.length !== 16) {
    return false
  }

  const tokenBuf = Buffer.from(token, 'utf8')

  const candidateWindows = [0, 1, 2, -1]

  for (const offset of candidateWindows) {
    const candidate = generateToken(secret, offset)
    const candidateBuf = Buffer.from(candidate, 'utf8')
    if (tokenBuf.length === candidateBuf.length && crypto.timingSafeEqual(tokenBuf, candidateBuf)) {
      return true
    }
  }

  return false
}
