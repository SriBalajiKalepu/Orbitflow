import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FolderKanban, ChevronLeft, ChevronRight,
  LogOut, Settings, User, Orbit, PlusCircle, CheckSquare, Users
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '@/components/ui';
import { cn } from '@/utils';
import toast from 'react-hot-toast';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' },
  { icon: FolderKanban, label: 'Projects', to: '/projects' },
  { icon: CheckSquare, label: 'My Tasks', to: '/my-tasks' },
];

const bottomItems = [
  { icon: User, label: 'Profile', to: '/profile' },
  { icon: Settings, label: 'Settings', to: '/settings' },
];

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      toast.success('Logged out successfully');
    } catch {
      toast.error('Logout failed');
    }
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="relative h-screen flex flex-col glass border-r border-[hsl(var(--border))] z-20 flex-shrink-0"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 mb-2">
        <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/30">
          <Orbit className="w-5 h-5 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="font-bold text-lg text-gradient"
            >
              OrbitFlow
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* New Project Button */}
      {user?.globalRole === 'ADMIN' && (
        <div className={cn('px-3 mb-4', collapsed && 'flex justify-center')}>
          <NavLink
            to="/projects"
            className={cn(
            'flex items-center gap-2 px-3 py-2.5 rounded-xl',
            'gradient-primary text-white text-sm font-medium',
            'shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40',
            'transition-all duration-200 hover:scale-[1.02]',
            collapsed ? 'w-10 h-10 justify-center p-0' : 'w-full'
          )}
          title="New Project"
        >
          <PlusCircle className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>New Project</span>}
        </NavLink>
        </div>
      )}

      {/* Nav Items */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map(({ icon: Icon, label, to }) => (
          <NavLink
            key={to}
            to={to}
            title={label}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20'
                : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]',
              collapsed && 'justify-center'
            )}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}

        {/* Admin-only nav */}
        {user?.globalRole === 'ADMIN' && (
          <>
            <div className="my-2 border-t border-[hsl(var(--border))]" />
            <NavLink
              to="/admin/users"
              title="User Management"
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                  : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]',
                collapsed && 'justify-center'
              )}
            >
              <Users className="w-5 h-5 flex-shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    Users
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          </>
        )}
      </nav>

      {/* Bottom Section */}
      <div className="px-3 pt-3 border-t border-[hsl(var(--border))] space-y-1">
        {bottomItems.map(({ icon: Icon, label, to }) => (
          <NavLink
            key={to}
            to={to}
            title={label}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-indigo-500/15 text-indigo-400'
                : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]',
              collapsed && 'justify-center'
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}

        {/* Logout */}
        <button
          onClick={handleLogout}
          title="Logout"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium w-full',
            'text-[hsl(var(--muted-foreground))] hover:bg-red-500/10 hover:text-red-400 transition-all duration-200',
            collapsed && 'justify-center'
          )}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* User Info */}
        <div className={cn(
          'flex items-center gap-3 px-3 py-3 mt-2 rounded-xl',
          'bg-[hsl(var(--muted))] border border-[hsl(var(--border))]',
          collapsed && 'justify-center px-0'
        )}>
          <Avatar src={user?.avatar} name={user?.name || 'U'} size="sm" className="flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="min-w-0"
              >
                <p className="text-sm font-medium text-[hsl(var(--foreground))] truncate">{user?.name}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{user?.globalRole}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Collapse Button */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className={cn(
          'absolute -right-3 top-8 w-6 h-6 rounded-full flex items-center justify-center',
          'glass border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]',
          'hover:text-[hsl(var(--foreground))] hover:border-indigo-500/50 transition-all duration-200 z-30'
        )}
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </motion.aside>
  );
};
