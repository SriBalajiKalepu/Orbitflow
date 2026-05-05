import { Router } from 'express';
import {
  getProjects, getProject, createProject, updateProject, deleteProject,
  getProjectMembers, addMember, removeMember, updateMemberRole, getProjectActivity,
} from '../controllers/projects.controller';
import { authenticate, requireProjectMember, requireProjectAdmin, requireGlobalAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { projectSchema, updateProjectSchema, addMemberSchema } from '../validators/schemas';
import taskRoutes from './tasks.routes';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getProjects);
router.post('/', requireGlobalAdmin, validate(projectSchema), createProject);
router.get('/:id', requireProjectMember, getProject);
router.put('/:id', requireProjectAdmin, validate(updateProjectSchema), updateProject);
router.delete('/:id', requireProjectAdmin, deleteProject);

// Members
router.get('/:id/members', requireProjectMember, getProjectMembers);
router.post('/:id/members', requireProjectAdmin, validate(addMemberSchema), addMember);
router.delete('/:id/members/:userId', requireProjectAdmin, removeMember);
router.patch('/:id/members/:userId/role', requireProjectAdmin, updateMemberRole);

// Activity
router.get('/:id/activity', requireProjectMember, getProjectActivity);

// Nested task routes
router.use('/:projectId/tasks', requireProjectMember, taskRoutes);

export default router;
