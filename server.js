import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { connectDB, isDbConnected } from './config/db.js'
import { notFound, errorHandler } from './middleware/errorHandler.js'

import authRoutes from './routes/authRoutes.js'
import productRoutes from './routes/productRoutes.js'
import categoryRoutes from './routes/categoryRoutes.js'
import orderRoutes from './routes/orderRoutes.js'
import wishlistRoutes from './routes/wishlistRoutes.js'
import reviewRoutes from './routes/reviewRoutes.js'
import adminRoutes from './routes/adminRoutes.js'

const app = express()
const PORT = process.env.PORT || 5000

app.use(helmet())

// CLIENT_ORIGIN supports one origin (as before) or a comma-separated list —
// e.g. "https://niceaquariumhouse.com,https://www.niceaquariumhouse.com" —
// so a production deploy can allow a custom domain and a platform-provided
// URL at the same time without code changes. Falls back to the dev
// frontend's origin only when CLIENT_ORIGIN isn't set at all; in
// production, CLIENT_ORIGIN must be set to the real deployed frontend
// URL(s) or this fallback will incorrectly allow only localhost.
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

app.use(cors({
  origin(origin, callback) {
    // No Origin header (server-to-server calls, curl, health checks) is
    // always allowed — only browser-sent cross-origin requests are checked.
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
}))
app.use(express.json({ limit: '2mb' }))
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', db: isDbConnected() ? 'connected' : 'disconnected' })
})

app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/wishlist', wishlistRoutes)
app.use('/api', reviewRoutes) // exposes /api/products/:slug/reviews and /api/reviews/:id
app.use('/api/admin', adminRoutes)

app.use(notFound)
app.use(errorHandler)

async function start() {
  await connectDB()
  app.listen(PORT, () => {
    console.log(`[server] Nice Aquarium House API running on http://localhost:${PORT}`)
  })
}

start()
