import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Orbit, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Input, Button } from '@/components/ui/Modal';
import toast from 'react-hot-toast';

export const AuthPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login({ email: form.email, password: form.password });
      toast.success('Welcome back! 🚀');
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Something went wrong';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[hsl(var(--background))] overflow-hidden">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center p-12 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 gradient-primary opacity-90" />
        <div className="absolute inset-0">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white/5"
              style={{
                width: `${100 + i * 80}px`,
                height: `${100 + i * 80}px`,
                left: `${10 + i * 8}%`,
                top: `${20 + i * 10}%`,
              }}
              animate={{ y: [0, -20, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 4 + i, repeat: Infinity, delay: i * 0.5 }}
            />
          ))}
        </div>

        <div className="relative z-10 text-white max-w-md text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-8 shadow-2xl">
              <Orbit className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">OrbitFlow</h1>
            <p className="text-lg text-white/80 mb-8 leading-relaxed">
              AI-ready collaborative project management for high-performance teams
            </p>

            <div className="grid grid-cols-2 gap-4 text-left">
              {[
                { icon: '🚀', title: 'Kanban Boards', desc: 'Visual task management' },
                { icon: '👥', title: 'Team Roles', desc: 'Admin & member access' },
                { icon: '📊', title: 'Analytics', desc: 'Real-time insights' },
                { icon: '🔔', title: 'Live Updates', desc: 'Socket.io powered' },
              ].map((feature) => (
                <div key={feature.title} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-2xl mb-2">{feature.icon}</div>
                  <div className="font-semibold text-sm">{feature.title}</div>
                  <div className="text-xs text-white/70">{feature.desc}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Orbit className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gradient">OrbitFlow</span>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[hsl(var(--foreground))]">
              Welcome back
            </h2>
            <p className="text-[hsl(var(--muted-foreground))] mt-1">
              Sign in to your OrbitFlow workspace
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              name="email"
              type="email"
              placeholder="your.email@company.com"
              value={form.email}
              onChange={handleChange}
              icon={<Mail className="w-4 h-4" />}
              required
              autoComplete="email"
            />
            <div className="relative">
              <Input
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                icon={<Lock className="w-4 h-4" />}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 bottom-2.5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <Button type="submit" className="w-full" size="lg" isLoading={isLoading} icon={<ArrowRight className="w-4 h-4" />}>
              Sign In
            </Button>
          </form>

          {/* Info */}
          <div className="mt-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              🔒 Accounts are managed by your organization's administrator. Contact your admin if you need access.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
