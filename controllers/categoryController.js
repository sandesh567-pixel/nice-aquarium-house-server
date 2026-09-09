import Category from '../models/Category.js'
import Product from '../models/Product.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const listCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ name: 1 })
  res.json({ categories })
})

export const getCategory = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug })
  if (!category) return res.status(404).json({ message: 'Category not found.' })
  res.json({ category })
})

export const createCategory = asyncHandler(async (req, res) => {
  const category = await Category.create(req.body)
  res.status(201).json({ category })
})

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findOneAndUpdate({ slug: req.params.slug }, req.body, { new: true, runValidators: true })
  if (!category) return res.status(404).json({ message: 'Category not found.' })
  res.json({ category })
})

export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug })
  if (!category) return res.status(404).json({ message: 'Category not found.' })

  // Product.category is a plain string matched against Category.slug by
  // convention (not a Mongo ref — see server/models/Product.js), so
  // nothing would stop a delete from silently orphaning products onto a
  // category that no longer exists. Block it instead of leaving that
  // dangling reference — this is enforced here, server-side, not just
  // hidden behind a disabled button in the admin UI.
  const productCount = await Product.countDocuments({ category: category.slug })
  if (productCount > 0) {
    return res.status(409).json({
      message: `Cannot delete "${category.name}" — ${productCount} product${productCount === 1 ? '' : 's'} still use${productCount === 1 ? 's' : ''} this category. Reassign or remove those products first.`,
    })
  }

  await category.deleteOne()
  res.json({ message: 'Category deleted.' })
})
