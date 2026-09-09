import { Router } from 'express'
import { getWishlist, addToWishlist, removeFromWishlist } from '../controllers/wishlistController.js'
import { protect } from '../middleware/auth.js'
import { requireDb } from '../middleware/requireDb.js'

const router = Router()

router.use(requireDb, protect)
router.get('/', getWishlist)
router.post('/', addToWishlist)
router.delete('/:productId', removeFromWishlist)

export default router
