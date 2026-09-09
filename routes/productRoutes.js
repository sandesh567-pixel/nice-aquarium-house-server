import { Router } from 'express'
import {
  listProducts, getProductBySlug, getRelatedProducts,
  createProduct, updateProduct, deleteProduct, updateStock,
} from '../controllers/productController.js'
import { protect, adminOnly } from '../middleware/auth.js'
import { requireDb } from '../middleware/requireDb.js'

const router = Router()

router.get('/', requireDb, listProducts)
router.get('/:slug', requireDb, getProductBySlug)
router.get('/:slug/related', requireDb, getRelatedProducts)

router.post('/', requireDb, protect, adminOnly, createProduct)
router.put('/:id', requireDb, protect, adminOnly, updateProduct)
router.delete('/:id', requireDb, protect, adminOnly, deleteProduct)
router.patch('/:id/stock', requireDb, protect, adminOnly, updateStock)

export default router
