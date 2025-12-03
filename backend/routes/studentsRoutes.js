import express from 'express';
import { 
  getAllStudents, 
  getStudentById, 
  createStudent, 
  updateStudent, 
  deleteStudent,
  syncStudents 
} from '../controllers/studentsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public Route (For Kiosk Syncing - No Token Required)
router.get('/sync', syncStudents); 

// Protected Routes (For Web App - Token Required)
router.use(authenticateToken); 

router.get('/', getAllStudents);
router.get('/:id', getStudentById);
router.post('/', createStudent);
router.put('/:id', updateStudent);
router.delete('/:id', deleteStudent);

export default router;