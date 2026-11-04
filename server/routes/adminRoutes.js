import { Router } from 'express';
import { createAdmin, createDoctor, deleteAdmin, deletePatient, listAdmins, listDoctors, listPatients, registerWalkIn, updateAdmin, updatePatient } from '../controllers/adminController.js';
import { allowRoles, authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.get('/patients', allowRoles('admin'), listPatients);
router.patch('/patients/:id', allowRoles('admin'), updatePatient);
router.delete('/patients/:id', allowRoles('admin'), deletePatient);
router.post('/walk-ins', allowRoles('admin'), registerWalkIn);
router.get('/doctors', allowRoles('admin'), listDoctors);
router.post('/doctors', allowRoles('admin'), createDoctor);
router.get('/admins', allowRoles('admin', 'doctor'), listAdmins);
router.post('/admins', allowRoles('admin', 'doctor'), createAdmin);
router.patch('/admins/:id', allowRoles('admin', 'doctor'), updateAdmin);
router.delete('/admins/:id', allowRoles('admin', 'doctor'), deleteAdmin);

export default router;