import Wishlist from '../models/Wishlist.js'
import { asyncHandler } from '../utils/asyncHandler.js'

async function getOrCreateWishlist(userId) {
  let wishlist = await Wishlist.findOne({ user: userId })
  if (!wishlist) wishlist = await Wishlist.create({ user: userId, products: [] })
  return wishlist
}

export const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await (await getOrCreateWishlist(req.user._id)).populate('products')
  res.json({ wishlist })
})

export const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body
  if (!productId) return res.status(400).json({ message: 'productId is required.' })
  // $addToSet is atomic at the database level and inherently deduplicating —
  // unlike the previous fetch → check-in-memory → push → save pattern, it
  // can't produce a duplicate even under two near-simultaneous requests for
  // the same product (the actual cause of the duplicate-entry bug).
  const wishlist = await Wishlist.findOneAndUpdate(
    { user: req.user._id },
    { $addToSet: { products: productId } },
    { new: true, upsert: true }
  ).populate('products')
  res.status(201).json({ wishlist })
})

export const removeFromWishlist = asyncHandler(async (req, res) => {
  // $pull removes every matching entry in one atomic operation — so if a
  // product already has duplicate entries from before this fix, removing
  // it once cleans up all of them, not just one.
  const wishlist = await Wishlist.findOneAndUpdate(
    { user: req.user._id },
    { $pull: { products: req.params.productId } },
    { new: true, upsert: true }
  ).populate('products')
  res.json({ wishlist })
})
