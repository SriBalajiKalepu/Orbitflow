import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/apiResponse';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode);
    return;
  }

  // Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as { code?: string };
    if (prismaError.code === 'P2002') {
      sendError(res, 'A record with this value already exists', 409);
      return;
    }
    if (prismaError.code === 'P2025') {
      sendError(res, 'Record not found', 404);
      return;
    }
  }

  console.error('💥 Unhandled error:', err);
  sendError(res, 'Internal server error', 500, process.env.NODE_ENV === 'development' ? err.message : undefined);
};

export const notFound = (req: Request, res: Response): void => {
  sendError(res, `Route ${req.method} ${req.path} not found`, 404);
};
