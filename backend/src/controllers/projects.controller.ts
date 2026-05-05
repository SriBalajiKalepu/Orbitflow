import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { sendSuccess, sendError, sendCreated, sendNoContent } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../types';

const userSelect = {
  id: true, name: true, email: true, avatar: true,
};

const projectInclude = {
  owner: { select: userSelect },
  members: {
    include: { user: { select: userSelect } },
  },
  _count: { select: { tasks: true, members: true } },
};

// ─── Get All Projects ─────────────────────────────────────────────────────────
export const getProjects = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user!.userId;
  const { search, status } = req.query;

  const projects = await prisma.project.findMany({
    where: {
      members: { some: { userId } },
      ...(search && { name: { contains: search as string, mode: 'insensitive' } }),
      ...(status && { status: status as any }),
    },
    include: {
      ...projectInclude,
      tasks: {
        select: { status: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  // Compute progress
  const projectsWithProgress = projects.map((p: any) => {
    const total = p.tasks?.length || 0;
    const completed = p.tasks?.filter((t: any) => t.status === 'COMPLETED').length || 0;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    const { tasks, ...rest } = p;
    return { ...rest, progress, taskCount: total, completedCount: completed };
  });

  sendSuccess(res, projectsWithProgress);
};

// ─── Get One Project ──────────────────────────────────────────────────────────
export const getProject = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest & { projectRole?: string };
  const { id } = req.params;
  const userId = authReq.user!.userId;

  const isAdmin = authReq.projectRole === 'ADMIN' || authReq.user?.globalRole === 'ADMIN';

  const project = await prisma.project.findFirst({
    where: {
      id,
      members: { some: { userId } },
    },
    include: {
      ...projectInclude,
      tasks: {
        include: {
          assignee: { select: userSelect },
          creator: { select: userSelect },
          _count: { select: { comments: true } },
        },
        orderBy: { position: 'asc' },
      },
    },
  });

  if (!project) { sendError(res, 'Project not found', 404); return; }

  const total = (project as any).tasks?.length || 0;
  const completed = (project as any).tasks?.filter((t: any) => t.status === 'COMPLETED').length || 0;
  const overdue = (project as any).tasks?.filter(
    (t: any) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED'
  ).length || 0;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  sendSuccess(res, { ...project, progress, taskCount: total, completedCount: completed, overdueCount: overdue });
};

// ─── Create Project ───────────────────────────────────────────────────────────
export const createProject = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user!.userId;
  const { name, description, color, emoji, dueDate, status } = req.body;

  const project = await prisma.project.create({
    data: {
      name, description, color, emoji,
      dueDate: dueDate ? new Date(dueDate) : null,
      status: status || 'ACTIVE',
      ownerId: userId,
      members: {
        create: { userId, role: 'ADMIN' },
      },
    },
    include: projectInclude,
  });

  await prisma.activityLog.create({
    data: {
      action: 'PROJECT_CREATED',
      entityType: 'project',
      entityId: project.id,
      userId,
      projectId: project.id,
      metadata: { projectName: project.name },
    },
  });

  sendCreated(res, project, 'Project created successfully');
};

// ─── Update Project ───────────────────────────────────────────────────────────
export const updateProject = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const { id } = req.params;
  const { name, description, color, emoji, dueDate, status } = req.body;

  const project = await prisma.project.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(color && { color }),
      ...(emoji && { emoji }),
      ...(status && { status }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
    },
    include: projectInclude,
  });

  await prisma.activityLog.create({
    data: {
      action: 'PROJECT_UPDATED',
      entityType: 'project',
      entityId: project.id,
      userId: authReq.user!.userId,
      projectId: project.id,
    },
  });

  sendSuccess(res, project, 'Project updated');
};

// ─── Delete Project ───────────────────────────────────────────────────────────
export const deleteProject = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  await prisma.project.delete({ where: { id } });
  sendNoContent(res);
};

// ─── Get Project Members ──────────────────────────────────────────────────────
export const getProjectMembers = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const members = await prisma.projectMember.findMany({
    where: { projectId: id },
    include: { user: { select: { id: true, name: true, email: true, avatar: true, bio: true } } },
    orderBy: { joinedAt: 'asc' },
  });
  sendSuccess(res, members);
};

// ─── Add Member ───────────────────────────────────────────────────────────────
export const addMember = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const { id: projectId } = req.params;
  const { email, role } = req.body;

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true, email: true, avatar: true } });
  if (!user) { sendError(res, 'No user found with this email', 404); return; }

  const existing = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: user.id } },
  });
  if (existing) { sendError(res, 'User is already a member of this project', 409); return; }

  const member = await prisma.projectMember.create({
    data: { projectId, userId: user.id, role: role || 'MEMBER' },
    include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
  });

  await prisma.activityLog.create({
    data: {
      action: 'MEMBER_ADDED',
      entityType: 'project',
      entityId: projectId,
      userId: authReq.user!.userId,
      projectId,
      metadata: { memberName: user.name, memberEmail: user.email },
    },
  });

  sendCreated(res, member, 'Member added successfully');
};

// ─── Remove Member ────────────────────────────────────────────────────────────
export const removeMember = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const { id: projectId, userId } = req.params;

  // Cannot remove project owner
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (project?.ownerId === userId) {
    sendError(res, 'Cannot remove the project owner', 400);
    return;
  }

  await prisma.projectMember.delete({
    where: { projectId_userId: { projectId, userId } },
  });

  sendNoContent(res);
};

// ─── Update Member Role ───────────────────────────────────────────────────────
export const updateMemberRole = async (req: Request, res: Response): Promise<void> => {
  const { id: projectId, userId } = req.params;
  const { role } = req.body;

  const member = await prisma.projectMember.update({
    where: { projectId_userId: { projectId, userId } },
    data: { role },
    include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
  });

  sendSuccess(res, member, 'Role updated');
};

// ─── Get Project Activity ─────────────────────────────────────────────────────
export const getProjectActivity = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const logs = await prisma.activityLog.findMany({
    where: { projectId: id },
    include: { user: { select: { id: true, name: true, avatar: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  sendSuccess(res, logs);
};
