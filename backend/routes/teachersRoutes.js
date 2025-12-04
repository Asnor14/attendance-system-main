import express from 'express';
import { 
  getAllTeachers, 
  createTeacher, 
  updateTeacher, 
  deleteTeacher 
} from '../controllers/teachersController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Protect all routes (Only Admins can manage teachers)
router.use(verifyToken);

router.get('/', getAllTeachers);
router.post('/', createTeacher);
router.put('/:id', updateTeacher);
router.delete('/:id', deleteTeacher);

export default router;