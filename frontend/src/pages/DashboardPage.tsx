import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  FolderKanban, CheckCircle2, Clock, AlertTriangle,
  TrendingUp, Calendar, Activity
} from 'lucide-react';
import { dashboardApi } from '@/api';
import { useAuth } from '@/context/AuthContext';
import { Avatar, Badge, ProgressBar, Skeleton, CardSkeleton } from '@/components/ui';
import {
  statusColors, statusLabels, priorityColors, priorityLabels,
  formatDate, formatRelative, isOverdue, cn
} from '@/utils';
import type { Task } from '@/types';

const STATUS_CHART_COLORS = {
  TODO: '#64748b',
  IN_PROGRESS: '#3b82f6',
  REVIEW: '#f59e0b',
  COMPLETED: '#10b981',
};

const PRIORITY_CHART_COLORS = {
  LOW: '#64748b',
  MEDIUM: '#3b82f6',
  HIGH: '#f59e0b',
  CRITICAL: '#ef4444',
};

const StatCard: React.FC<{
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
  delay?: number;
}> = ({ title, value, icon, color, subtitle, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="glass rounded-2xl p-5 border border-[hsl(var(--border))] hover-lift"
  >
    <div className="flex items-start justify-between mb-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <span className="text-2xl font-bold text-[hsl(var(--foreground))]">{value}</span>
    </div>
    <p className="text-sm font-medium text-[hsl(var(--foreground))]">{title}</p>
    {subtitle && <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{subtitle}</p>}
  </motion.div>
);

const TaskItem: React.FC<{ task: Task }> = ({ task }) => (
  <div className="flex items-center gap-3 py-2.5 border-b border-[hsl(var(--border))] last:border-0">
    <div className={cn('w-2 h-2 rounded-full flex-shrink-0', {
      'bg-slate-400': task.priority === 'LOW',
      'bg-blue-400': task.priority === 'MEDIUM',
      'bg-orange-400': task.priority === 'HIGH',
      'bg-red-400': task.priority === 'CRITICAL',
    })} />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-[hsl(var(--foreground))] truncate">{task.title}</p>
      <div className="flex items-center gap-2 mt-0.5">
        <span className="text-xs text-[hsl(var(--muted-foreground))]">
          {task.project?.emoji} {task.project?.name}
        </span>
        {task.dueDate && (
          <span className={cn('text-xs', isOverdue(task.dueDate, task.status) ? 'text-red-400' : 'text-[hsl(var(--muted-foreground))]')}>
            {isOverdue(task.dueDate, task.status) ? '⚠️' : '📅'} {formatDate(task.dueDate, 'MMM d')}
          </span>
        )}
      </div>
    </div>
    <Badge className={statusColors[task.status]}>{statusLabels[task.status]}</Badge>
  </div>
);

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-72 lg:col-span-2 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  const stats = data?.stats;
  const weeklyData = data?.weeklyData || [];
  const statusDist = data?.statusDistribution || [];
  const projectProgress = data?.projectProgress || [];
  const upcomingTasks = data?.upcomingTasks || [];
  const recentActivity = data?.recentActivity || [];

  const pieData = statusDist.map((s) => ({
    name: statusLabels[s.status] || s.status,
    value: s.count,
    color: STATUS_CHART_COLORS[s.status] || '#64748b',
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
          <span className="text-gradient">{user?.name?.split(' ')[0]}</span> 👋
        </h1>
        <p className="text-[hsl(var(--muted-foreground))] mt-1">
          Here's what's happening across your projects today.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Projects"
          value={stats?.totalProjects ?? 0}
          icon={<FolderKanban className="w-5 h-5 text-indigo-400" />}
          color="bg-indigo-500/15"
          subtitle={`${stats?.activeProjects ?? 0} active`}
          delay={0}
        />
        <StatCard
          title="Tasks Completed"
          value={stats?.completedTasks ?? 0}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          color="bg-emerald-500/15"
          subtitle={`${stats?.completionRate ?? 0}% completion rate`}
          delay={0.05}
        />
        <StatCard
          title="In Progress"
          value={stats?.inProgressTasks ?? 0}
          icon={<Clock className="w-5 h-5 text-blue-400" />}
          color="bg-blue-500/15"
          subtitle={`${stats?.myTasks ?? 0} assigned to me`}
          delay={0.1}
        />
        <StatCard
          title="Overdue"
          value={stats?.overdueTasks ?? 0}
          icon={<AlertTriangle className="w-5 h-5 text-red-400" />}
          color="bg-red-500/15"
          subtitle="Need immediate attention"
          delay={0.15}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 glass rounded-2xl p-5 border border-[hsl(var(--border))]"
        >
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-[hsl(var(--foreground))]">Weekly Productivity</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  color: 'hsl(var(--foreground))',
                }}
              />
              <Legend />
              <Area type="monotone" dataKey="completed" stroke="#6366f1" fill="url(#colorCompleted)" strokeWidth={2} name="Completed" />
              <Area type="monotone" dataKey="created" stroke="#10b981" fill="url(#colorCreated)" strokeWidth={2} name="Created" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Status Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass rounded-2xl p-5 border border-[hsl(var(--border))]"
        >
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-purple-400" />
            <h3 className="font-semibold text-[hsl(var(--foreground))]">Task Status</h3>
          </div>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      color: 'hsl(var(--foreground))',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {pieData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[hsl(var(--muted-foreground))]">{item.name}</span>
                    </div>
                    <span className="font-medium text-[hsl(var(--foreground))]">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40 text-[hsl(var(--muted-foreground))]">No tasks yet</div>
          )}
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-5 border border-[hsl(var(--border))]"
        >
          <div className="flex items-center gap-2 mb-5">
            <FolderKanban className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-[hsl(var(--foreground))]">Project Progress</h3>
          </div>
          <div className="space-y-4">
            {projectProgress.length === 0 && (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">No projects yet</p>
            )}
            {projectProgress.map((p) => (
              <div key={p.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span>{p.emoji}</span>
                    <span className="text-sm font-medium text-[hsl(var(--foreground))] truncate">{p.name}</span>
                  </div>
                  <span className="text-sm font-bold text-indigo-400 ml-2">{p.progress}%</span>
                </div>
                <ProgressBar value={p.progress} color={p.color} />
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{p.taskCount} tasks · {p.memberCount} members</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Upcoming Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass rounded-2xl p-5 border border-[hsl(var(--border))]"
        >
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-[hsl(var(--foreground))]">Upcoming Tasks</h3>
          </div>
          <div className="space-y-0">
            {upcomingTasks.length === 0 && (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">No upcoming tasks 🎉</p>
            )}
            {upcomingTasks.slice(0, 5).map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-2xl p-5 border border-[hsl(var(--border))]"
        >
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-[hsl(var(--foreground))]">Recent Activity</h3>
          </div>
          <div className="space-y-3">
            {recentActivity.length === 0 && (
              <p className="text-sm text-[hsl(var(--muted-foreground))]">No activity yet</p>
            )}
            {recentActivity.slice(0, 7).map((log) => (
              <div key={log.id} className="flex items-start gap-3">
                <Avatar src={log.user.avatar} name={log.user.name} size="xs" className="mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-[hsl(var(--foreground))] leading-relaxed">
                    <span className="font-medium">{log.user.name}</span>{' '}
                    <span className="text-[hsl(var(--muted-foreground))]">
                      {log.action.toLowerCase().replace(/_/g, ' ')}
                    </span>
                    {log.project && (
                      <span className="text-indigo-400"> in {log.project.name}</span>
                    )}
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{formatRelative(log.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
