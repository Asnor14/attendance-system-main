import express from 'express';
import * as devicesController from '../controllers/devicesController.js'; // Ensure this path is correct
import { verifyToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public (Heartbeat from Kiosk)
router.post('/:id/heartbeat', devicesController.deviceHeartbeat);

// Admin / Protected Routes
router.get('/', verifyToken, devicesController.getAllDevices);
router.post('/', verifyToken, isAdmin, devicesController.createDevice);
router.get('/:id', verifyToken, devicesController.getDeviceById);
router.delete('/:id', verifyToken, isAdmin, devicesController.deleteDevice);
router.get('/:id/logs', verifyToken, devicesController.getDeviceLogs);

// IMPORTANT: This is the line that allows changing the Camera/RFID
router.put('/:id', verifyToken, devicesController.updateDeviceConfig); 

export default router;