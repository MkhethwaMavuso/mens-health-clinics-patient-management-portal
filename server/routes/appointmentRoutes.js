import { Router } from 'express';
import { assignDoctor, bookAppointment, completeAppointment, listAppointments, markArrived } from '../controllers/appointmentController.js';
import { allowRoles, authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.get('/', listAppointments);
router.post('/', allowRoles('patient'), bookAppointment);
router.patch('/:id/arrived', allowRoles('admin'), markArrived);
router.patch('/:id/assign', allowRoles('admin'), assignDoctor);
router.patch('/:id/complete', allowRoles('doctor'), completeAppointment);

export default router;