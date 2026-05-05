import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { sendSuccess, sendError, sendCreated } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../types';

// ─── Login ────────────────────────────────────────────────────────────────────
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    sendError(res, 'Invalid email or password', 401);
    return;
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    sendError(res, 'Invalid email or password', 401);
    return;
  }

  const payload = { userId: user.id, email: user.email, globalRole: user.globalRole };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

  const { passwordHash: _, refreshToken: __, ...userSafe } = user;
  sendSuccess(res, { user: userSafe, accessToken, refreshToken }, 'Logged in successfully');
};

// ─── Logout ───────────────────────────────────────────────────────────────────
export const logout = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  if (authReq.user?.userId) {
    await prisma.user.update({
      where: { id: authReq.user.userId },
      data: { refreshToken: null },
    });
  }
  sendSuccess(res, null, 'Logged out successfully');
};

// ─── Refresh Token ────────────────────────────────────────────────────────────
export const refresh = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    sendError(res, 'Refresh token required', 401);
    return;
  }

  try {
    const payload = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || user.refreshToken !== refreshToken) {
      sendError(res, 'Invalid refresh token', 401);
      return;
    }

    const newPayload = { userId: user.id, email: user.email, globalRole: user.globalRole };
    const accessToken = signAccessToken(newPayload);
    const newRefreshToken = signRefreshToken(newPayload);
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken: newRefreshToken } });

    sendSuccess(res, { accessToken, refreshToken: newRefreshToken }, 'Token refreshed');
  } catch {
    sendError(res, 'Invalid or expired refresh token', 401);
  }
};

// ─── Get Me ───────────────────────────────────────────────────────────────────
export const getMe = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const user = await prisma.user.findUnique({
    where: { id: authReq.user!.userId },
    select: {
      id: true, name: true, email: true, globalRole: true,
      avatar: true, bio: true, designation: true,
      mustChangePassword: true,
      createdAt: true, updatedAt: true,
      _count: { select: { ownedProjects: true, assignedTasks: true, comments: true } },
    },
  });
  if (!user) { sendError(res, 'User not found', 404); return; }
  sendSuccess(res, user);
};

// ─── Update Profile ───────────────────────────────────────────────────────────
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const { name, bio, avatar } = req.body;

  const user = await prisma.user.update({
    where: { id: authReq.user!.userId },
    data: { ...(name && { name }), ...(bio !== undefined && { bio }), ...(avatar && { avatar }) },
    select: {
      id: true, name: true, email: true, globalRole: true,
      avatar: true, bio: true, designation: true,
      mustChangePassword: true, updatedAt: true, createdAt: true,
      _count: { select: { ownedProjects: true, assignedTasks: true, comments: true } },
    },
  });
  sendSuccess(res, user, 'Profile updated');
};

// ─── Change Password ──────────────────────────────────────────────────────────
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  const authReq = req as AuthenticatedRequest;
  const { currentPassword, newPassword } = req.body;
  const userId = authReq.user!.userId;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) { sendError(res, 'User not found', 404); return; }

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) {
    sendError(res, 'Current password is incorrect', 401);
    return;
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, mustChangePassword: false },
  });

  sendSuccess(res, null, 'Password changed successfully');
};
