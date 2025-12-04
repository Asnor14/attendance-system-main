import express from 'express';
import * as devicesController from '../controllers/devicesController.js';
import { verifyToken, isAdmin } from '../middleware/auth.js'; // FIXED IMPORT

const router = express.Router();

// Public route (Kiosks don't have tokens usually, or use a specific API Key logic)
router.post('/:id/heartbeat', devicesController.deviceHeartbeat);

// Protected Admin Routes
router.get('/', verifyToken, devicesController.getAllDevices);
router.post('/', verifyToken, isAdmin, devicesController.createDevice);
router.get('/:id', verifyToken, devicesController.getDeviceById);
router.delete('/:id', verifyToken, isAdmin, devicesController.deleteDevice);
router.put('/:id', verifyToken, devicesController.updateDeviceConfig); // Config toggle
router.get('/:id/logs', verifyToken, devicesController.getDeviceLogs);

export default router;