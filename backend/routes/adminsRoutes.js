import express from 'express';
import { getAllAdmins, createAdmin, updateAdmin, deleteAdmin } from '../controllers/adminsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

router.get('/', getAllAdmins);
router.post('/', createAdmin);
router.put('/:id', updateAdmin); // 👈 Added Update Route
router.delete('/:id', deleteAdmin);

export default router;