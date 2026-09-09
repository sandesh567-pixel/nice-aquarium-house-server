import 'dotenv/config'
import mongoose from 'mongoose'
import Product from '../models/Product.js'
import Category from '../models/Category.js'
import { products } from './sourceData/products.js'
import { categories } from './sourceData/categories.js'

// This reuses the exact catalog the frontend ships as mock data
// (client/src/data/products.js and categories.js, copied into
// seed/sourceData/) so the API and the frontend-only demo show the same
// 80 products until someone edits one or the other on purpose.

async function run() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('MONGODB_URI is not set. Copy .env.example to .env and fill it in first.')
    process.exit(1)
  }

  await mongoose.connect(uri)
  console.log(`Connected to ${mongoose.connection.name}`)

  await Category.deleteMany({})
  await Category.insertMany(categories)
  console.log(`Seeded ${categories.length} categories`)

  await Product.deleteMany({})
  const docs = products.map(({ id, isNew, ...p }) => ({ ...p, isNewArrival: isNew })) // Mongo generates its own _id; isNew is renamed to avoid colliding with Mongoose's reserved isNew property
  await Product.insertMany(docs)
  console.log(`Seeded ${docs.length} products`)

  await mongoose.disconnect()
  console.log('Done.')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
