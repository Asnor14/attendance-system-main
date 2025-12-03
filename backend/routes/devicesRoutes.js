import express from 'express';
import { 
  getAllDevices, 
  getDeviceById, 
  createDevice,       // 👈 Ensure imported
  deleteDevice,
  getDeviceLogs,
  deviceHeartbeat,
  registerDevice,
  updateDeviceConfig  // 👈 Ensure imported
} from '../controllers/devicesController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 1. Public Routes (Kiosk communication)
router.post('/:id/heartbeat', deviceHeartbeat);
router.post('/register', registerDevice);

// 2. Protected Routes (Admin Panel)
router.use(authenticateToken);

router.get('/', getAllDevices);
router.post('/', createDevice); // 👈 Manual Create Route
router.get('/:id', getDeviceById);
router.delete('/:id', deleteDevice);
router.put('/:id/config', updateDeviceConfig); // 👈 Toggle Config
router.get('/:id/logs', getDeviceLogs);

export default router;