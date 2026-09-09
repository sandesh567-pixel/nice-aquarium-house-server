import mongoose from 'mongoose'

// The frontend already works fully on mock data, so a missing DB connection
// here should never crash the process — it should just mean the API routes
// that need the DB will return a clear 503 instead of the whole server dying.
export async function connectDB() {
  const uri = process.env.MONGODB_URI

  if (!uri) {
    console.warn('[db] MONGODB_URI is not set — API routes that touch the database will return 503 until it is configured.')
    return false
  }

  try {
    mongoose.set('strictQuery', true)
    await mongoose.connect(uri)
    console.log(`[db] Connected to MongoDB: ${mongoose.connection.name}`)
    return true
  } catch (err) {
    console.error('[db] Failed to connect to MongoDB:', err.message)
    return false
  }
}

export function isDbConnected() {
  return mongoose.connection.readyState === 1
}
