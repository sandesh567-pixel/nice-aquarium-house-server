import { Router } from 'express'
import {
  createOrder, getMyOrders, getOrderByNumber, listAllOrders, updateOrderStatus,
} from '../controllers/orderController.js'
import { protect, adminOnly, optionalAuth } from '../middleware/auth.js'
import { requireDb } from '../middleware/requireDb.js'

const router = Router()

router.post('/', requireDb, optionalAuth, createOrder)
router.get('/mine', requireDb, protect, getMyOrders)
router.get('/track/:orderNumber', requireDb, optionalAuth, getOrderByNumber)

router.get('/', requireDb, protect, adminOnly, listAllOrders)
router.patch('/:id/status', requireDb, protect, adminOnly, updateOrderStatus)

export default router
