import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
  designation: z.string().max(100).optional(),
  globalRole: z.enum(['ADMIN', 'MEMBER']).optional().default('MEMBER'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
});

export const updateAdminUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  email: z.string().email('Invalid email address').optional(),
  designation: z.string().max(100).optional().nullable(),
  globalRole: z.enum(['ADMIN', 'MEMBER']).optional(),
});

export const resetAdminUserPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(200),
  description: z.string().max(2000).optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'ON_HOLD', 'ARCHIVED']).optional(),
  color: z.string().optional(),
  emoji: z.string().optional(),
  dueDate: z.string().optional().nullable(),
});

export const updateProjectSchema = projectSchema.partial();

export const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(500),
  description: z.string().max(10000).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  dueDate: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  position: z.number().optional(),
});

export const updateTaskSchema = taskSchema.partial();

export const reorderTasksSchema = z.object({
  tasks: z.array(z.object({
    id: z.string(),
    position: z.number(),
  })),
});

export const addMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['ADMIN', 'MEMBER']).optional().default('MEMBER'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  bio: z.string().max(500).optional(),
  avatar: z.string().url().optional(),
});

export const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(5000),
});
