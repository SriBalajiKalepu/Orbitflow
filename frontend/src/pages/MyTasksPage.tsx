import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CheckSquare, Calendar, AlertTriangle, FolderKanban, Filter } from 'lucide-react';
import { dashboardApi, tasksApi } from '@/api';
import { Badge, Avatar, Skeleton, CardSkeleton } from '@/components/ui';
import { Select } from '@/components/ui/Modal';
import { statusColors, statusLabels, priorityColors, priorityLabels, priorityDotColors, formatDate, isOverdue, cn } from '@/utils';
import type { Task } from '@/types';
import toast from 'react-hot-toast';

const TaskRow: React.FC<{ task: Task; onStatusChange: (id: string, projectId: string, status: string) => void }> = ({
  task, onStatusChange
}) => {
  const overdue = task.dueDate && isOverdue(task.dueDate, task.status);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-4 p-4 border-b border-[hsl(var(--border))] last:border-0 hover:bg-[hsl(var(--muted))/30] transition-colors"
    >
      <div className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', priorityDotColors[task.priority])} />

      <div className="flex-1 min-w-0">
        <Link
          to={`/projects/${task.project?.id}`}
          className="text-sm font-medium text-[hsl(var(--foreground))] hover:text-indigo-400 transition-colors truncate block"
        >
          {task.title}
        </Link>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1">
            <FolderKanban className="w-3 h-3" />
            {task.project?.emoji} {task.project?.name}
          </span>
          {task.dueDate && (
            <span className={cn('text-xs flex items-center gap-1', overdue ? 'text-red-400' : 'text-[hsl(var(--muted-foreground))]')}>
              {overdue ? <AlertTriangle className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
              {formatDate(task.dueDate, 'MMM d')}
            </span>
          )}
        </div>
      </div>

      <Badge className={cn('hidden sm:flex', priorityColors[task.priority])}>
        {priorityLabels[task.priority]}
      </Badge>

      <select
        value={task.status}
        onChange={(e) => onStatusChange(task.id, task.project!.id, e.target.value)}
        className={cn(
          'text-xs px-2 py-1 rounded-lg border transition-all',
          'bg-transparent focus:outline-none focus:ring-1 focus:ring-[hsl(var(--ring))]',
          statusColors[task.status]
        )}
      >
        <option value="TODO">To Do</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="REVIEW">Review</option>
        <option value="COMPLETED">Completed</option>
      </select>
    </motion.div>
  );
};

export const MyTasksPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [priority, setPriority] = useState('');

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: dashboardApi.getMyTasks,
    refetchInterval: 30000,
  });

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ taskId, projectId, status }: { taskId: string; projectId: string; status: string }) =>
      tasksApi.update(projectId, taskId, { status: status as any }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Status updated');
    },
  });

  const filtered = (tasks || []).filter((t) => !priority || t.priority === priority);
  const overdueTasks = filtered.filter((t) => t.dueDate && isOverdue(t.dueDate, t.status));
  const regularTasks = filtered.filter((t) => !t.dueDate || !isOverdue(t.dueDate, t.status));

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">My Tasks</h1>
          <p className="text-[hsl(var(--muted-foreground))]">{filtered.length} active tasks assigned to you</p>
        </div>
        <Select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-36">
          <option value="">All Priority</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Assigned', value: filtered.length, icon: <CheckSquare className="w-5 h-5 text-indigo-400" />, color: 'bg-indigo-500/15' },
          { label: 'Due This Week', value: filtered.filter((t) => t.dueDate && new Date(t.dueDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).length, icon: <Calendar className="w-5 h-5 text-amber-400" />, color: 'bg-amber-500/15' },
          { label: 'Overdue', value: overdueTasks.length, icon: <AlertTriangle className="w-5 h-5 text-red-400" />, color: 'bg-red-500/15' },
        ].map((stat) => (
          <div key={stat.label} className="glass rounded-xl p-4 border border-[hsl(var(--border))]">
            <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center mb-3', stat.color)}>
              {stat.icon}
            </div>
            <div className="text-2xl font-bold text-[hsl(var(--foreground))]">{stat.value}</div>
            <div className="text-xs text-[hsl(var(--muted-foreground))]">{stat.label}</div>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : (
        <>
          {overdueTasks.length > 0 && (
            <div className="glass rounded-2xl border border-red-500/30 overflow-hidden">
              <div className="px-4 py-3 border-b border-red-500/20 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-sm font-medium text-red-400">Overdue ({overdueTasks.length})</span>
              </div>
              {overdueTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onStatusChange={(id, projectId, status) => updateStatus({ taskId: id, projectId, status })}
                />
              ))}
            </div>
          )}

          <div className="glass rounded-2xl border border-[hsl(var(--border))] overflow-hidden">
            <div className="px-4 py-3 border-b border-[hsl(var(--border))]">
              <span className="text-sm font-medium text-[hsl(var(--foreground))]">Active Tasks ({regularTasks.length})</span>
            </div>
            {regularTasks.length === 0 && overdueTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-[hsl(var(--muted-foreground))]">
                <CheckSquare className="w-12 h-12 mb-3 opacity-30" />
                <p className="font-medium">All caught up! 🎉</p>
                <p className="text-sm">No tasks assigned to you</p>
              </div>
            ) : regularTasks.length === 0 ? (
              <div className="p-4 text-center text-sm text-[hsl(var(--muted-foreground))]">No other tasks</div>
            ) : (
              regularTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onStatusChange={(id, projectId, status) => updateStatus({ taskId: id, projectId, status })}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};
