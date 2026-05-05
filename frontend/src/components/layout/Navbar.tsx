import React from 'react';
import { useLocation } from 'react-router-dom';
import { Sun, Moon, Bell } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from '@/components/ui';
import { NavLink } from 'react-router-dom';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/projects': 'Projects',
  '/my-tasks': 'My Tasks',
  '/profile': 'Profile',
  '/settings': 'Settings',
};

export const Navbar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const location = useLocation();

  const getPageTitle = () => {
    for (const [path, title] of Object.entries(pageTitles)) {
      if (location.pathname.startsWith(path)) return title;
    }
    if (location.pathname.includes('/projects/')) return 'Project Details';
    return 'OrbitFlow';
  };

  return (
    <header className="h-16 glass border-b border-[hsl(var(--border))] flex items-center justify-between px-6 flex-shrink-0">
      <div>
        <h1 className="text-lg font-semibold text-[hsl(var(--foreground))]">{getPageTitle()}</h1>
        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-xl bg-[hsl(var(--muted))] flex items-center justify-center
                     text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]
                     hover:bg-[hsl(var(--accent))] transition-all duration-200"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <button
          className="w-9 h-9 rounded-xl bg-[hsl(var(--muted))] flex items-center justify-center
                     text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]
                     hover:bg-[hsl(var(--accent))] transition-all duration-200 relative"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-indigo-500 rounded-full" />
        </button>

        {/* User Avatar */}
        <NavLink to="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Avatar src={user?.avatar} name={user?.name || 'U'} size="sm" />
          <div className="hidden md:block">
            <p className="text-sm font-medium text-[hsl(var(--foreground))] leading-none">{user?.name}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{user?.email}</p>
          </div>
        </NavLink>
      </div>
    </header>
  );
};
