import React from 'react';
import { cn } from '@/utils';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outline';
}

export const Badge: React.FC<BadgeProps> = ({ children, className, variant = 'default' }) => (
  <span className={cn(
    'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border',
    variant === 'outline' ? 'bg-transparent' : '',
    className
  )}>
    {children}
  </span>
);

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  xs: 'w-5 h-5 text-[10px]',
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-11 h-11 text-base',
  xl: 'w-16 h-16 text-xl',
};

export const Avatar: React.FC<AvatarProps> = ({ src, name, size = 'md', className }) => {
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div className={cn(
      'rounded-full flex items-center justify-center font-semibold flex-shrink-0 overflow-hidden',
      'bg-gradient-to-br from-indigo-500 to-purple-600 text-white',
      sizeClasses[size], className
    )}>
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }} />
      ) : initials}
    </div>
  );
};

interface AvatarGroupProps {
  users: Array<{ id: string; name: string; avatar?: string }>;
  max?: number;
  size?: AvatarProps['size'];
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({ users, max = 3, size = 'sm' }) => {
  const shown = users.slice(0, max);
  const remaining = users.length - max;
  return (
    <div className="flex -space-x-2">
      {shown.map((u) => (
        <div key={u.id} className="ring-2 ring-[hsl(var(--card))] rounded-full" title={u.name}>
          <Avatar src={u.avatar} name={u.name} size={size} />
        </div>
      ))}
      {remaining > 0 && (
        <div className={cn(
          'rounded-full flex items-center justify-center text-xs font-semibold ring-2 ring-[hsl(var(--card))]',
          'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]',
          sizeClasses[size]
        )}>
          +{remaining}
        </div>
      )}
    </div>
  );
};

interface SpinnerProps { size?: 'sm' | 'md' | 'lg'; className?: string }

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className }) => (
  <div className={cn(
    'border-2 border-[hsl(var(--border))] border-t-[hsl(var(--primary))] rounded-full animate-spin',
    { 'w-4 h-4': size === 'sm', 'w-6 h-6': size === 'md', 'w-10 h-10': size === 'lg' },
    className
  )} />
);

export const LoadingPage: React.FC = () => (
  <div className="h-screen flex items-center justify-center bg-[hsl(var(--background))]">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center animate-pulse">
        <span className="text-2xl">🌀</span>
      </div>
      <Spinner size="lg" />
    </div>
  </div>
);

interface ProgressBarProps { value: number; className?: string; color?: string }

export const ProgressBar: React.FC<ProgressBarProps> = ({ value, className, color }) => (
  <div className={cn('h-1.5 bg-[hsl(var(--muted))] rounded-full overflow-hidden', className)}>
    <div
      className="h-full rounded-full transition-all duration-500 ease-out"
      style={{
        width: `${Math.min(100, Math.max(0, value))}%`,
        background: color || 'linear-gradient(90deg, #6366f1, #8b5cf6)',
      }}
    />
  </div>
);

interface SkeletonProps { className?: string }
export const Skeleton: React.FC<SkeletonProps> = ({ className }) => (
  <div className={cn('animate-pulse rounded-lg bg-[hsl(var(--muted))]', className)} />
);

export const CardSkeleton: React.FC = () => (
  <div className="glass rounded-2xl p-5 space-y-3">
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-3 w-full" />
    <Skeleton className="h-3 w-2/3" />
    <div className="flex gap-2 pt-2">
      <Skeleton className="h-6 w-16 rounded-full" />
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  </div>
);
