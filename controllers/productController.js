import Product from '../models/Product.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const listProducts = asyncHandler(async (req, res) => {
  const { category, search, sort, minPrice, maxPrice, difficulty, inStockOnly, page = 1, limit = 24 } = req.query

  const query = {}
  if (category) query.category = category
  if (difficulty) query.difficulty = difficulty
  if (inStockOnly === 'true') query.stock = { $gt: 0 }
  if (minPrice || maxPrice) {
    query.price = {}
    if (minPrice) query.price.$gte = Number(minPrice)
    if (maxPrice) query.price.$lte = Number(maxPrice)
  }
  if (search) query.$text = { $search: search }

  const sortMap = {
    'price-asc': { price: 1 },
    'price-desc': { price: -1 },
    rating: { rating: -1 },
    newest: { createdAt: -1 },
    'best-selling': { isBestSeller: -1 },
  }

  const pageNum = Math.max(1, Number(page))
  const limitNum = Math.min(100, Math.max(1, Number(limit)))

  const [products, total] = await Promise.all([
    Product.find(query)
      .sort(sortMap[sort] || { createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Product.countDocuments(query),
  ])

  res.json({ products, total, page: pageNum, pages: Math.ceil(total / limitNum) })
})

export const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug })
  if (!product) return res.status(404).json({ message: 'Product not found.' })
  res.json({ product })
})

export const getRelatedProducts = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug })
  if (!product) return res.status(404).json({ message: 'Product not found.' })
  const related = await Product.find({ category: product.category, _id: { $ne: product._id } }).limit(4)
  res.json({ products: related })
})

export const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body)
  res.status(201).json({ product })
})

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
  if (!product) return res.status(404).json({ message: 'Product not found.' })
  res.json({ product })
})

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id)
  if (!product) return res.status(404).json({ message: 'Product not found.' })
  res.json({ message: 'Product deleted.' })
})

export const updateStock = asyncHandler(async (req, res) => {
  const { stock } = req.body
  if (typeof stock !== 'number' || stock < 0) {
    return res.status(400).json({ message: 'stock must be a non-negative number.' })
  }
  const product = await Product.findByIdAndUpdate(req.params.id, { stock }, { new: true })
  if (!product) return res.status(404).json({ message: 'Product not found.' })
  res.json({ product })
})
