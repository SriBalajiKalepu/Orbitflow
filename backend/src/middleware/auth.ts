import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { sendError } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../types';
import { MemberRole } from '@prisma/client';
import prisma from '../lib/prisma';

// ─── Auth Middleware ──────────────────────────────────────────────────────────

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendError(res, 'Authentication required', 401);
      return;
    }
    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);
    (req as AuthenticatedRequest).user = payload;
    next();
  } catch (err) {
    sendError(res, 'Invalid or expired token', 401);
  }
};

// ─── Global Admin Guard ───────────────────────────────────────────────────────

export const requireGlobalAdmin = (req: Request, res: Response, next: NextFunction): void => {
  const authReq = req as AuthenticatedRequest;
  if (authReq.user?.globalRole !== 'ADMIN') {
    sendError(res, 'Global admin access required', 403);
    return;
  }
  next();
};

// ─── Project Role Guard ───────────────────────────────────────────────────────

export const requireProjectMember = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest & { projectRole?: MemberRole; projectId?: string };
    const projectId = req.params.projectId || req.params.id;
    const userId = authReq.user?.userId;

    if (!userId || !projectId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });

    if (!membership) {
      // Check if the user is the project owner
      const project = await prisma.project.findFirst({
        where: { id: projectId, ownerId: userId },
      });
      if (!project) {
        sendError(res, 'You are not a member of this project', 403);
        return;
      }
    }

    authReq.projectRole = membership?.role ?? MemberRole.ADMIN;
    authReq.projectId = projectId;
    next();
  } catch {
    sendError(res, 'Authorization check failed', 500);
  }
};

export const requireProjectAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest & { projectRole?: MemberRole; projectId?: string };
    const projectId = req.params.projectId || req.params.id;
    const userId = authReq.user?.userId;

    if (!userId || !projectId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });

    const isOwner = await prisma.project.findFirst({
      where: { id: projectId, ownerId: userId },
    });

    if (!isOwner && membership?.role !== MemberRole.ADMIN) {
      sendError(res, 'Project admin access required', 403);
      return;
    }

    authReq.projectRole = MemberRole.ADMIN;
    authReq.projectId = projectId;
    next();
  } catch {
    sendError(res, 'Authorization check failed', 500);
  }
};
