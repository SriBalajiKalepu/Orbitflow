import { Router } from 'express';
import {
  getProjectTasks, getTask, createTask, updateTask, deleteTask, reorderTasks,
  addComment, getComments, deleteComment, getMyTasks,
} from '../controllers/tasks.controller';
import { authenticate, requireProjectAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { taskSchema, updateTaskSchema, commentSchema, reorderTasksSchema } from '../validators/schemas';

const router = Router({ mergeParams: true });

// Project task routes (all require project member access via parent router)
router.get('/', getProjectTasks);
router.post('/', requireProjectAdmin, validate(taskSchema), createTask);
router.post('/reorder', validate(reorderTasksSchema), reorderTasks);

// Individual task routes
router.get('/:id', getTask);
router.patch('/:id', validate(updateTaskSchema), updateTask);
router.delete('/:id', requireProjectAdmin, deleteTask);

// Comments
router.get('/:id/comments', getComments);
router.post('/:id/comments', validate(commentSchema), addComment);
router.delete('/:id/comments/:commentId', deleteComment);

export default router;
