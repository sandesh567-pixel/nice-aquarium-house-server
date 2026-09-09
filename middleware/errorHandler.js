export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` })
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  console.error('[error]', err)

  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: Object.values(err.errors).map((e) => e.message).join(', ') })
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field'
    return res.status(409).json({ message: `That ${field} is already in use.` })
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid ID format.' })
  }

  const status = err.status || 500
  // Never leak internal error details (stack traces, driver messages) to the client.
  const message = status < 500 ? err.message : 'Something went wrong. Please try again.'
  res.status(status).json({ message })
}
