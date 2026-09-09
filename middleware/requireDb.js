import { isDbConnected } from '../config/db.js'

// Any route that reads/writes MongoDB should be wrapped with this, so that
// running the API without MONGODB_URI configured (e.g. first clone, or this
// sandboxed environment) gives a clear, friendly error instead of an
// unhandled exception.
export function requireDb(req, res, next) {
  if (!isDbConnected()) {
    return res.status(503).json({
      message: 'Database is not connected. Set MONGODB_URI in your .env file and restart the server.',
    })
  }
  next()
}
