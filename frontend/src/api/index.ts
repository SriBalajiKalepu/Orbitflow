import api from './axios';
import type {
  AuthData, User, Project, Task, Comment, ActivityLog,
  DashboardData, LoginForm, ProjectForm, TaskForm,
  ApiResponse, ProjectMember, CreateUserForm, UpdateUserForm
} from '@/types';

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (data: LoginForm) =>
    api.post<ApiResponse<AuthData>>('/auth/login', data).then((r) => r.data.data!),

  logout: () => api.post('/auth/logout'),

  refresh: (refreshToken: string) =>
    api.post<ApiResponse<{ accessToken: string; refreshToken: string }>>('/auth/refresh', { refreshToken })
      .then((r) => r.data.data!),

  getMe: () =>
    api.get<ApiResponse<User>>('/auth/me').then((r) => r.data.data!),

  updateProfile: (data: Partial<{ name: string; bio: string; avatar: string }>) =>
    api.patch<ApiResponse<User>>('/auth/profile', data).then((r) => r.data.data!),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post<ApiResponse<null>>('/auth/change-password', data).then((r) => r.data),
};

// ─── Projects ─────────────────────────────────────────────────────────────────
export const projectsApi = {
  getAll: (params?: { search?: string; status?: string }) =>
    api.get<ApiResponse<Project[]>>('/projects', { params }).then((r) => r.data.data!),

  getOne: (id: string) =>
    api.get<ApiResponse<Project>>(`/projects/${id}`).then((r) => r.data.data!),

  create: (data: ProjectForm) =>
    api.post<ApiResponse<Project>>('/projects', data).then((r) => r.data.data!),

  update: (id: string, data: Partial<ProjectForm>) =>
    api.put<ApiResponse<Project>>(`/projects/${id}`, data).then((r) => r.data.data!),

  delete: (id: string) =>
    api.delete(`/projects/${id}`),

  getMembers: (id: string) =>
    api.get<ApiResponse<ProjectMember[]>>(`/projects/${id}/members`).then((r) => r.data.data!),

  addMember: (id: string, data: { email: string; role?: string }) =>
    api.post<ApiResponse<ProjectMember>>(`/projects/${id}/members`, data).then((r) => r.data.data!),

  removeMember: (id: string, userId: string) =>
    api.delete(`/projects/${id}/members/${userId}`),

  updateMemberRole: (id: string, userId: string, role: string) =>
    api.patch<ApiResponse<ProjectMember>>(`/projects/${id}/members/${userId}/role`, { role })
      .then((r) => r.data.data!),

  getActivity: (id: string) =>
    api.get<ApiResponse<ActivityLog[]>>(`/projects/${id}/activity`).then((r) => r.data.data!),
};

// ─── Tasks ────────────────────────────────────────────────────────────────────
export const tasksApi = {
  getProjectTasks: (projectId: string, params?: { status?: string; priority?: string; assigneeId?: string; search?: string }) =>
    api.get<ApiResponse<Task[]>>(`/projects/${projectId}/tasks`, { params }).then((r) => r.data.data!),

  getOne: (projectId: string, taskId: string) =>
    api.get<ApiResponse<Task>>(`/projects/${projectId}/tasks/${taskId}`).then((r) => r.data.data!),

  create: (projectId: string, data: TaskForm) =>
    api.post<ApiResponse<Task>>(`/projects/${projectId}/tasks`, data).then((r) => r.data.data!),

  reorder: (projectId: string, tasks: { id: string; position: number }[]) =>
    api.post<ApiResponse<null>>(`/projects/${projectId}/tasks/reorder`, { tasks }).then((r) => r.data),

  update: (projectId: string, taskId: string, data: Partial<TaskForm & { position: number }>) =>
    api.patch<ApiResponse<Task>>(`/projects/${projectId}/tasks/${taskId}`, data).then((r) => r.data.data!),

  delete: (projectId: string, taskId: string) =>
    api.delete(`/projects/${projectId}/tasks/${taskId}`),

  addComment: (projectId: string, taskId: string, content: string) =>
    api.post<ApiResponse<Comment>>(`/projects/${projectId}/tasks/${taskId}/comments`, { content })
      .then((r) => r.data.data!),

  getComments: (projectId: string, taskId: string) =>
    api.get<ApiResponse<Comment[]>>(`/projects/${projectId}/tasks/${taskId}/comments`)
      .then((r) => r.data.data!),

  deleteComment: (projectId: string, taskId: string, commentId: string) =>
    api.delete(`/projects/${projectId}/tasks/${taskId}/comments/${commentId}`),
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardApi = {
  getStats: () =>
    api.get<ApiResponse<DashboardData>>('/dashboard/stats').then((r) => r.data.data!),

  getMyTasks: () =>
    api.get<ApiResponse<Task[]>>('/dashboard/my-tasks').then((r) => r.data.data!),
};

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminApi = {
  getUsers: (params?: { search?: string }) =>
    api.get<ApiResponse<User[]>>('/admin/users', { params }).then((r) => r.data.data!),

  createUser: (data: CreateUserForm) =>
    api.post<ApiResponse<User>>('/admin/users', data).then((r) => r.data.data!),

  updateUser: (id: string, data: UpdateUserForm) =>
    api.patch<ApiResponse<User>>(`/admin/users/${id}`, data).then((r) => r.data.data!),

  resetUserPassword: (id: string, data: { password: string }) =>
    api.post<ApiResponse<null>>(`/admin/users/${id}/reset-password`, data).then((r) => r.data),

  deleteUser: (id: string) =>
    api.delete(`/admin/users/${id}`),
};
