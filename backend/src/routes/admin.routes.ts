import { Router } from 'express';
import { getAllUsers, createUser, deleteUser, updateUser, resetUserPassword } from '../controllers/admin.controller';
import { authenticate, requireGlobalAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createUserSchema, updateAdminUserSchema, resetAdminUserPasswordSchema } from '../validators/schemas';

const router = Router();

// All admin routes require authentication + global admin
router.use(authenticate);
router.use(requireGlobalAdmin);

router.get('/users', getAllUsers);
router.post('/users', validate(createUserSchema), createUser);
router.patch('/users/:id', validate(updateAdminUserSchema), updateUser);
router.post('/users/:id/reset-password', validate(resetAdminUserPasswordSchema), resetUserPassword);
router.delete('/users/:id', deleteUser);

export default router;
