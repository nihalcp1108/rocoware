import express from 'express';
import { updateEmail, updatePassword } from '../controllers/profileController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.put('/email', updateEmail);
router.put('/password', updatePassword);

export default router;
