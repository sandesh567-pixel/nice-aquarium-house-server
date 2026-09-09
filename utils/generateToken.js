import jwt from 'jsonwebtoken'

export function generateToken(userId) {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is not set')
  return jwt.sign({ id: userId }, secret, { expiresIn: '30d' })
}
