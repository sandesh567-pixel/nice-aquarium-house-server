import { Router } from 'express'
import { getDashboardStats } from '../controllers/adminController.js'
import { protect, adminOnly } from '../middleware/auth.js'
import { requireDb } from '../middleware/requireDb.js'

const router = Router()

router.get('/stats', requireDb, protect, adminOnly, getDashboardStats)

export default router
