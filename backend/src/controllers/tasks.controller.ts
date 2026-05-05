import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { sendSuccess, sendError, sendCreated, sendNoContent } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../types';

const userSelect = { id: true, name: true, email: true, avatar: true };

const taskInclude = {
  assignee: { select: userSelect },
  creator: { select: userSelect },
  _count: { select: { comments: true } },
};

// ─── Get Tasks ────────────────────────────────────────────────────────────────
export const getProjectTasks = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest & { projectRole?: string };
  const { projectId } = req.params;
  const { status, priority, assigneeId, search } = req.query;
  const userId = authReq.user!.userId;
  
  const isAdmin = authReq.projectRole === 'ADMIN' || authReq.user?.globalRole === 'ADMIN';

  const tasks = await prisma.task.findMany({
    where: {
      projectId,
      ...(assigneeId && { assigneeId: assigneeId as string }),
      ...(status && { status: status as any }),
      ...(priority && { priority: priority as any }),
      ...(isAdmin && assigneeId && { assigneeId: assigneeId as string }),
      ...(search && { title: { contains: search as string, mode: 'insensitive' } }),
    },
    include: taskInclude,
    orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
  });

  sendSuccess(res, tasks);
};

// ─── Get Task ─────────────────────────────────────────────────────────────────
export const getTask = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest & { projectRole?: string };
  const { id } = req.params;
  const userId = authReq.user!.userId;

  const task = await prisma.task.findFirst({
    where: {
      id,
      project: { members: { some: { userId } } },
    },
    include: {
      ...taskInclude,
      project: { select: { id: true, name: true, color: true } },
      comments: {
        include: { author: { select: userSelect } },
        orderBy: { createdAt: 'asc' },
      },
      activityLogs: {
        include: { user: { select: userSelect } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  });

  if (!task) { sendError(res, 'Task not found', 404); return; }

  sendSuccess(res, task);
};

// ─── Create Task ──────────────────────────────────────────────────────────────
export const createTask = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const { projectId } = req.params;
  const userId = authReq.user!.userId;
  const { title, description, status, priority, dueDate, assigneeId, position } = req.body;

  // Get current max position for the status column
  const maxPosition = await prisma.task.aggregate({
    where: { projectId, status: status || 'TODO' },
    _max: { position: true },
  });

  const task = await prisma.task.create({
    data: {
      title, description,
      status: status || 'TODO',
      priority: priority || 'MEDIUM',
      dueDate: dueDate ? new Date(dueDate) : null,
      assigneeId: assigneeId || null,
      projectId,
      creatorId: userId,
      position: position ?? (maxPosition._max.position ?? -1) + 1,
    },
    include: taskInclude,
  });

  await prisma.activityLog.create({
    data: {
      action: 'TASK_CREATED',
      entityType: 'task',
      entityId: task.id,
      userId,
      projectId,
      taskId: task.id,
      metadata: { taskTitle: task.title },
    },
  });

  sendCreated(res, task, 'Task created');
};

// ─── Update Task ──────────────────────────────────────────────────────────────
export const updateTask = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest & { projectRole?: string };
  const { id } = req.params;
  const userId = authReq.user!.userId;
  const { title, description, status, priority, dueDate, assigneeId, position } = req.body;

  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing) { sendError(res, 'Task not found', 404); return; }

  const isAdmin = authReq.projectRole === 'ADMIN' || authReq.user?.globalRole === 'ADMIN';
  
  if (!isAdmin) {
    if (existing.assigneeId !== userId) {
      sendError(res, 'You can only update tasks assigned to you', 403);
      return;
    }
    
    // Check if member is trying to update unauthorized fields
    const allowedFields = ['status'];
    const requestedFields = Object.keys(req.body).filter(key => req.body[key] !== undefined && req.body[key] !== existing[key as keyof typeof existing]);
    const unauthorizedFields = requestedFields.filter(f => !allowedFields.includes(f));
    
    if (unauthorizedFields.length > 0) {
      sendError(res, `Members can only update task status. Unauthorized fields: ${unauthorizedFields.join(', ')}`, 403);
      return;
    }
  }

  const task = await prisma.task.update({
    where: { id },
    data: {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(status && { status }),
      ...(priority && { priority }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      ...(assigneeId !== undefined && { assigneeId: assigneeId || null }),
      ...(position !== undefined && { position }),
    },
    include: taskInclude,
  });

  if (status && status !== existing.status) {
    await prisma.activityLog.create({
      data: {
        action: 'TASK_STATUS_CHANGED',
        entityType: 'task',
        entityId: task.id,
        userId,
        projectId: task.projectId,
        taskId: task.id,
        metadata: { from: existing.status, to: status },
      },
    });
  }

  sendSuccess(res, task, 'Task updated');
};

// ─── Reorder Tasks ──────────────────────────────────────────────────────────────
export const reorderTasks = async (req: Request, res: Response): Promise<void> => {
  const { projectId } = req.params;
  const { tasks } = req.body; // { id: string, position: number }[]

  await prisma.$transaction(
    tasks.map((t: any) =>
      prisma.task.update({
        where: { id: t.id },
        data: { position: t.position },
      })
    )
  );

  sendSuccess(res, null, 'Tasks reordered');
};

// ─── Delete Task ──────────────────────────────────────────────────────────────
export const deleteTask = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  await prisma.task.delete({ where: { id } });
  sendNoContent(res);
};

// ─── Get My Tasks ─────────────────────────────────────────────────────────────
export const getMyTasks = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user!.userId;

  const tasks = await prisma.task.findMany({
    where: { assigneeId: userId, status: { not: 'COMPLETED' } },
    include: {
      ...taskInclude,
      project: { select: { id: true, name: true, color: true, emoji: true } },
    },
    orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
    take: 20,
  });

  sendSuccess(res, tasks);
};

// ─── Add Comment ──────────────────────────────────────────────────────────────
export const addComment = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const { id: taskId } = req.params;
  const userId = authReq.user!.userId;
  const { content } = req.body;

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) { sendError(res, 'Task not found', 404); return; }

  const comment = await prisma.comment.create({
    data: { content, taskId, authorId: userId },
    include: { author: { select: userSelect } },
  });

  await prisma.activityLog.create({
    data: {
      action: 'COMMENT_ADDED',
      entityType: 'task',
      entityId: taskId,
      userId,
      projectId: task.projectId,
      taskId,
    },
  });

  sendCreated(res, comment, 'Comment added');
};

// ─── Get Comments ─────────────────────────────────────────────────────────────
export const getComments = async (req: Request, res: Response): Promise<void> => {
  const { id: taskId } = req.params;
  const comments = await prisma.comment.findMany({
    where: { taskId },
    include: { author: { select: userSelect } },
    orderBy: { createdAt: 'asc' },
  });
  sendSuccess(res, comments);
};

// ─── Delete Comment ───────────────────────────────────────────────────────────
export const deleteComment = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const { commentId } = req.params;
  const userId = authReq.user!.userId;

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) { sendError(res, 'Comment not found', 404); return; }
  if (comment.authorId !== userId) { sendError(res, 'You can only delete your own comments', 403); return; }

  await prisma.comment.delete({ where: { id: commentId } });
  sendNoContent(res);
};
