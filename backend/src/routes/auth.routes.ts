import { Router } from 'express';
import { login, logout, refresh, getMe, updateProfile, changePassword } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { loginSchema, updateProfileSchema, changePasswordSchema } from '../validators/schemas';

const router = Router();

router.post('/login', validate(loginSchema), login);
router.post('/logout', authenticate, logout);
router.post('/refresh', refresh);
router.get('/me', authenticate, getMe);
router.patch('/profile', authenticate, validate(updateProfileSchema), updateProfile);
router.post('/change-password', authenticate, validate(changePasswordSchema), changePassword);

export default router;
