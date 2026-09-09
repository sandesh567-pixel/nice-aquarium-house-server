import { Router } from 'express'
import { listReviewsForProduct, createReview, deleteReview } from '../controllers/reviewController.js'
import { protect } from '../middleware/auth.js'
import { requireDb } from '../middleware/requireDb.js'

const router = Router()

router.get('/products/:slug/reviews', requireDb, listReviewsForProduct)
router.post('/products/:slug/reviews', requireDb, protect, createReview)
router.delete('/reviews/:id', requireDb, protect, deleteReview)

export default router
