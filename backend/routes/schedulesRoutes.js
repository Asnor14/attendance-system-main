import express from 'express';
import { 
  getAllSchedules, createSchedule, updateSchedule, deleteSchedule, 
  syncSchedules, getSchedulesByKiosk, assignScheduleToKiosk 
} from '../controllers/schedulesController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/sync', syncSchedules); 

router.use(authenticateToken);
router.get('/', getAllSchedules);
router.get('/kiosk/:kioskId', getSchedulesByKiosk); // Get Kiosk Schedules
router.post('/assign', assignScheduleToKiosk); // Assign
router.post('/', createSchedule);
router.put('/:id', updateSchedule);
router.delete('/:id', deleteSchedule);

export default router;