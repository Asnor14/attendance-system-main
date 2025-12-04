import express from 'express';
import * as authController from '../controllers/authController.js';
import { verifyToken } from '../middleware/auth.js'; // FIXED IMPORT

const router = express.Router();

router.post('/login', authController.login);

// Use the new name here
router.get('/me', verifyToken, authController.getMe); 
router.post('/change-password', verifyToken, authController.changePassword);

export default router;