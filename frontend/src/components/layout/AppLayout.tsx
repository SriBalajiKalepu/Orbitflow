import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { useAuth } from '@/context/AuthContext';
import { LoadingPage } from '@/components/ui';

export const AppLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingPage />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen overflow-hidden bg-[hsl(var(--background))]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export const PublicLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingPage />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
};
