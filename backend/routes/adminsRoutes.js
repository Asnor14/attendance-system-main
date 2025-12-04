import express from 'express';
import { getAllAdmins, createAdmin, updateAdmin, deleteAdmin } from '../controllers/adminsController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();
router.use(verifyToken);

router.get('/', getAllAdmins);
router.post('/', createAdmin);
router.put('/:id', updateAdmin); // 👈 Added Update Route
router.delete('/:id', deleteAdmin);

export default router;