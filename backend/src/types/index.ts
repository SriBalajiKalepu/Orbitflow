import { GlobalRole, MemberRole } from '@prisma/client';
import { Request } from 'express';

export interface JwtPayload {
  userId: string;
  email: string;
  globalRole: GlobalRole;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export interface ProjectContext extends AuthenticatedRequest {
  projectRole?: MemberRole;
  projectId?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  search?: string;
  status?: string;
  priority?: string;
}
