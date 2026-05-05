import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { sendSuccess, sendError, sendCreated } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../types';

const userSelect = {
  id: true, name: true, email: true, avatar: true, bio: true,
  designation: true, globalRole: true, mustChangePassword: true,
  createdAt: true, updatedAt: true,
  _count: { select: { ownedProjects: true, assignedTasks: true, comments: true } },
};

// ─── Get All Users ────────────────────────────────────────────────────────────
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  const { search } = req.query;

  const users = await prisma.user.findMany({
    where: {
      ...(search && {
        OR: [
          { name: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
        ],
      }),
    },
    select: userSelect,
    orderBy: { createdAt: 'desc' },
  });

  sendSuccess(res, users);
};

// ─── Create User ──────────────────────────────────────────────────────────────
export const createUser = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, designation, globalRole } = req.body;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    sendError(res, 'A user with this email already exists', 409);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      designation: designation || null,
      globalRole: globalRole || 'MEMBER',
      mustChangePassword: true,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
    },
    select: userSelect,
  });

  sendCreated(res, user, 'User created successfully');
};

// ─── Delete User ──────────────────────────────────────────────────────────────
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const { id } = req.params;

  if (id === authReq.user!.userId) {
    sendError(res, 'You cannot delete your own account', 400);
    return;
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    sendError(res, 'User not found', 404);
    return;
  }

  await prisma.user.delete({ where: { id } });
  sendSuccess(res, null, 'User deleted');
};

// ─── Update User ──────────────────────────────────────────────────────────────
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, email, designation, globalRole } = req.body;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    sendError(res, 'User not found', 404);
    return;
  }

  if (email && email !== user.email) {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      sendError(res, 'A user with this email already exists', 409);
      return;
    }
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(email && { email }),
      ...(designation !== undefined && { designation }),
      ...(globalRole && { globalRole }),
    },
    select: userSelect,
  });

  sendSuccess(res, updated, 'User updated successfully');
};

// ─── Reset Password ───────────────────────────────────────────────────────────
export const resetUserPassword = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { password } = req.body;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    sendError(res, 'User not found', 404);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  
  // Update password, force change, and invalidate current sessions
  await prisma.user.update({
    where: { id },
    data: {
      passwordHash,
      mustChangePassword: true,
      refreshToken: null, // Logs them out immediately
    },
  });

  sendSuccess(res, null, 'Password reset successfully');
};
