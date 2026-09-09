import { Router } from 'express'
import { listCategories, getCategory, createCategory, updateCategory, deleteCategory } from '../controllers/categoryController.js'
import { protect, adminOnly } from '../middleware/auth.js'
import { requireDb } from '../middleware/requireDb.js'

const router = Router()

router.get('/', requireDb, listCategories)
router.get('/:slug', requireDb, getCategory)

router.post('/', requireDb, protect, adminOnly, createCategory)
router.put('/:slug', requireDb, protect, adminOnly, updateCategory)
router.delete('/:slug', requireDb, protect, adminOnly, deleteCategory)

export default router
