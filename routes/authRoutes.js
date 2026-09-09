import { Router } from 'express'
import { register, login, getMe, updateMe } from '../controllers/authController.js'
import { protect } from '../middleware/auth.js'
import { requireDb } from '../middleware/requireDb.js'

const router = Router()

router.post('/register', requireDb, register)
router.post('/login', requireDb, login)
router.get('/me', requireDb, protect, getMe)
router.put('/me', requireDb, protect, updateMe)

export default router
