// ─── Enums ───────────────────────────────────────────────────────────────────

export type GlobalRole = 'ADMIN' | 'MEMBER';
export type MemberRole = 'ADMIN' | 'MEMBER';
export type ProjectStatus = 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'ARCHIVED';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

// ─── Entities ─────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  designation?: string;
  globalRole: GlobalRole;
  mustChangePassword?: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    ownedProjects: number;
    assignedTasks: number;
    comments: number;
  };
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: MemberRole;
  joinedAt: string;
  user: Pick<User, 'id' | 'name' | 'email' | 'avatar' | 'bio'>;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  color: string;
  emoji: string;
  dueDate?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner: Pick<User, 'id' | 'name' | 'email' | 'avatar'>;
  members: ProjectMember[];
  tasks?: Task[];
  progress?: number;
  taskCount?: number;
  completedCount?: number;
  overdueCount?: number;
  _count?: {
    tasks: number;
    members: number;
  };
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  dueDate?: string;
  position: number;
  projectId: string;
  assigneeId?: string;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  assignee?: Pick<User, 'id' | 'name' | 'email' | 'avatar'>;
  creator: Pick<User, 'id' | 'name' | 'email' | 'avatar'>;
  project?: Pick<Project, 'id' | 'name' | 'color' | 'emoji'>;
  comments?: Comment[];
  activityLogs?: ActivityLog[];
  _count?: {
    comments: number;
  };
}

export interface Comment {
  id: string;
  content: string;
  taskId: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author: Pick<User, 'id' | 'name' | 'avatar'>;
}

export interface ActivityLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  userId: string;
  projectId?: string;
  taskId?: string;
  createdAt: string;
  user: Pick<User, 'id' | 'name' | 'avatar'>;
  project?: Pick<Project, 'id' | 'name' | 'color'>;
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface AuthData {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  myTasks: number;
  completionRate: number;
}

export interface WeeklyData {
  date: string;
  completed: number;
  created: number;
}

export interface DashboardData {
  stats: DashboardStats;
  statusDistribution: { status: TaskStatus; count: number }[];
  priorityDistribution: { priority: Priority; count: number }[];
  weeklyData: WeeklyData[];
  projectProgress: {
    id: string;
    name: string;
    color: string;
    emoji: string;
    status: ProjectStatus;
    progress: number;
    taskCount: number;
    memberCount: number;
  }[];
  upcomingTasks: Task[];
  recentActivity: ActivityLog[];
}

// ─── Forms ────────────────────────────────────────────────────────────────────

export interface LoginForm {
  email: string;
  password: string;
}

export interface CreateUserForm {
  name: string;
  email: string;
  password: string;
  designation?: string;
  globalRole?: GlobalRole;
}

export interface UpdateUserForm {
  name?: string;
  email?: string;
  designation?: string | null;
  globalRole?: GlobalRole;
}

export interface ProjectForm {
  name: string;
  description?: string;
  status?: ProjectStatus;
  color?: string;
  emoji?: string;
  dueDate?: string;
}

export interface TaskForm {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  dueDate?: string;
  assigneeId?: string;
}
