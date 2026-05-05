import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isAfter, isBefore, addDays } from 'date-fns';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const formatDate = (date: string | Date, fmt = 'MMM d, yyyy') =>
  format(new Date(date), fmt);

export const formatRelative = (date: string | Date) =>
  formatDistanceToNow(new Date(date), { addSuffix: true });

export const isOverdue = (dueDate: string | Date, status: string) =>
  status !== 'COMPLETED' && isBefore(new Date(dueDate), new Date());

export const isDueSoon = (dueDate: string | Date, status: string) => {
  const due = new Date(dueDate);
  const now = new Date();
  return status !== 'COMPLETED' && isAfter(due, now) && isBefore(due, addDays(now, 3));
};

export const getInitials = (name: string) =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

export const statusColors: Record<string, string> = {
  TODO: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  IN_PROGRESS: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  REVIEW: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  COMPLETED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

export const priorityColors: Record<string, string> = {
  LOW: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  MEDIUM: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  HIGH: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  CRITICAL: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export const priorityDotColors: Record<string, string> = {
  LOW: 'bg-slate-400',
  MEDIUM: 'bg-blue-400',
  HIGH: 'bg-orange-400',
  CRITICAL: 'bg-red-400',
};

export const statusLabels: Record<string, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  REVIEW: 'Review',
  COMPLETED: 'Completed',
};

export const priorityLabels: Record<string, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

export const projectStatusColors: Record<string, string> = {
  ACTIVE: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  COMPLETED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  ON_HOLD: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  ARCHIVED: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

export const generateColor = () => {
  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#06b6d4'];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const truncate = (str: string, length: number) =>
  str.length > length ? `${str.substring(0, length)}...` : str;
