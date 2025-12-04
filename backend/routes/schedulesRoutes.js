import express from 'express';
import { 
  getAllSchedules, createSchedule, updateSchedule, deleteSchedule, 
  syncSchedules, getSchedulesByKiosk, assignScheduleToKiosk,
  getScheduleLogs 
} from '../controllers/schedulesController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/sync', syncSchedules); 

router.use(verifyToken);
router.get('/', getAllSchedules);
router.get('/:id/logs', getScheduleLogs); // New Logs Route
router.get('/kiosk/:kioskId', getSchedulesByKiosk);
router.post('/assign', assignScheduleToKiosk);
router.post('/', createSchedule);
router.put('/:id', updateSchedule);
router.delete('/:id', deleteSchedule);

export default router;