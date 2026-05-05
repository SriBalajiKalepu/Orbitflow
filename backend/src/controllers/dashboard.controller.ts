import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { sendSuccess } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../types';

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user!.userId;

  // Get all projects user is a member of
  const userProjects = await prisma.projectMember.findMany({
    where: { userId },
    select: { projectId: true },
  });
  const projectIds = userProjects.map((p) => p.projectId);

  const now = new Date();

  const [
    totalProjects,
    activeProjects,
    totalTasks,
    completedTasks,
    inProgressTasks,
    overdueTasks,
    myTasks,
    recentActivity,
  ] = await Promise.all([
    prisma.project.count({ where: { id: { in: projectIds } } }),
    prisma.project.count({ where: { id: { in: projectIds }, status: 'ACTIVE' } }),
    prisma.task.count({ where: { projectId: { in: projectIds } } }),
    prisma.task.count({ where: { projectId: { in: projectIds }, status: 'COMPLETED' } }),
    prisma.task.count({ where: { projectId: { in: projectIds }, status: 'IN_PROGRESS' } }),
    prisma.task.count({
      where: {
        projectId: { in: projectIds },
        dueDate: { lt: now },
        status: { not: 'COMPLETED' },
      },
    }),
    prisma.task.count({
      where: { assigneeId: userId, status: { not: 'COMPLETED' } },
    }),
    prisma.activityLog.findMany({
      where: { projectId: { in: projectIds } },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        project: { select: { id: true, name: true, color: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  // Task status distribution
  const statusDistribution = await prisma.task.groupBy({
    by: ['status'],
    where: { projectId: { in: projectIds } },
    _count: { status: true },
  });

  // Priority distribution
  const priorityDistribution = await prisma.task.groupBy({
    by: ['priority'],
    where: { projectId: { in: projectIds } },
    _count: { priority: true },
  });

  // Weekly task completion trend (last 7 days)
  const weeklyData: { date: string; completed: number; created: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayStart = new Date(date.setHours(0, 0, 0, 0));
    const dayEnd = new Date(date.setHours(23, 59, 59, 999));

    const [created, completed] = await Promise.all([
      prisma.task.count({
        where: { projectId: { in: projectIds }, createdAt: { gte: dayStart, lte: dayEnd } },
      }),
      prisma.task.count({
        where: {
          projectId: { in: projectIds },
          status: 'COMPLETED',
          updatedAt: { gte: dayStart, lte: dayEnd },
        },
      }),
    ]);

    weeklyData.push({
      date: dayStart.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      created,
      completed,
    });
  }

  // Project progress
  const projectsWithProgress = await prisma.project.findMany({
    where: { id: { in: projectIds } },
    include: {
      tasks: { select: { status: true } },
      _count: { select: { tasks: true, members: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 5,
  });

  const projectProgress = projectsWithProgress.map((p) => {
    const total = p.tasks.length;
    const completed = p.tasks.filter((t) => t.status === 'COMPLETED').length;
    return {
      id: p.id,
      name: p.name,
      color: p.color,
      emoji: p.emoji,
      status: p.status,
      progress: total > 0 ? Math.round((completed / total) * 100) : 0,
      taskCount: total,
      memberCount: p._count.members,
    };
  });

  // Upcoming tasks (due within 7 days)
  const upcomingTasks = await prisma.task.findMany({
    where: {
      projectId: { in: projectIds },
      dueDate: { gte: now, lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      status: { not: 'COMPLETED' },
    },
    include: {
      assignee: { select: { id: true, name: true, avatar: true } },
      project: { select: { id: true, name: true, color: true, emoji: true } },
    },
    orderBy: { dueDate: 'asc' },
    take: 10,
  });

  sendSuccess(res, {
    stats: {
      totalProjects,
      activeProjects,
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      myTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    },
    statusDistribution: statusDistribution.map((s) => ({
      status: s.status,
      count: s._count.status,
    })),
    priorityDistribution: priorityDistribution.map((p) => ({
      priority: p.priority,
      count: p._count.priority,
    })),
    weeklyData,
    projectProgress,
    upcomingTasks,
    recentActivity,
  });
};
