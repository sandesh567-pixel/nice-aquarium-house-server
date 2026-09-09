import Review from '../models/Review.js'
import Product from '../models/Product.js'
import { asyncHandler } from '../utils/asyncHandler.js'

async function recalculateProductRating(productId) {
  const reviews = await Review.find({ product: productId })
  const reviewCount = reviews.length
  const rating = reviewCount ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount : 0
  await Product.findByIdAndUpdate(productId, { rating: Math.round(rating * 10) / 10, reviewCount })
}

export const listReviewsForProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug })
  if (!product) return res.status(404).json({ message: 'Product not found.' })
  const reviews = await Review.find({ product: product._id }).sort({ createdAt: -1 })
  res.json({ reviews })
})

export const createReview = asyncHandler(async (req, res) => {
  const { rating, text } = req.body
  const product = await Product.findOne({ slug: req.params.slug })
  if (!product) return res.status(404).json({ message: 'Product not found.' })
  if (!rating || rating < 1 || rating > 5) return res.status(400).json({ message: 'Rating must be between 1 and 5.' })
  if (!text?.trim()) return res.status(400).json({ message: 'Review text is required.' })

  const existing = await Review.findOne({ product: product._id, user: req.user._id })
  if (existing) return res.status(409).json({ message: 'You have already reviewed this product.' })

  const review = await Review.create({
    product: product._id,
    user: req.user._id,
    userName: req.user.name,
    rating,
    text,
  })
  await recalculateProductRating(product._id)
  res.status(201).json({ review })
})

export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id)
  if (!review) return res.status(404).json({ message: 'Review not found.' })
  if (req.user.role !== 'admin' && String(review.user) !== String(req.user._id)) {
    return res.status(403).json({ message: 'Not authorized to delete this review.' })
  }
  await review.deleteOne()
  await recalculateProductRating(review.product)
  res.json({ message: 'Review deleted.' })
})
