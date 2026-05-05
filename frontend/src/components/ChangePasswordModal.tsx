import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { authApi } from '@/api';
import { useAuth } from '@/context/AuthContext';
import { Input, Button } from '@/components/ui/Modal';
import toast from 'react-hot-toast';

export const ChangePasswordModal: React.FC = () => {
  const { mustChangePassword, clearMustChangePassword } = useAuth();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPasswords, setShowPasswords] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!mustChangePassword) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.newPassword !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (form.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    if (!/[A-Z]/.test(form.newPassword)) {
      toast.error('Password must contain an uppercase letter');
      return;
    }

    if (!/[0-9]/.test(form.newPassword)) {
      toast.error('Password must contain a number');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      toast.success('Password changed successfully! 🔐');
      clearMustChangePassword();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md mx-4"
        >
          <div className="glass rounded-2xl border border-[hsl(var(--border))] p-8 shadow-2xl">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">
                Change Your Password
              </h2>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2">
                Your administrator has set a temporary password. Please change it to continue.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Input
                  label="Current (Temporary) Password"
                  type={showPasswords ? 'text' : 'password'}
                  placeholder="Enter the password given by admin"
                  value={form.currentPassword}
                  onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))}
                  icon={<Lock className="w-4 h-4" />}
                  required
                />
              </div>
              <div className="relative">
                <Input
                  label="New Password"
                  type={showPasswords ? 'text' : 'password'}
                  placeholder="Min. 8 chars, uppercase & number"
                  value={form.newPassword}
                  onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
                  icon={<Lock className="w-4 h-4" />}
                  required
                />
              </div>
              <Input
                label="Confirm New Password"
                type={showPasswords ? 'text' : 'password'}
                placeholder="Re-enter your new password"
                value={form.confirmPassword}
                onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                icon={<Lock className="w-4 h-4" />}
                required
              />

              <label className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPasswords}
                  onChange={(e) => setShowPasswords(e.target.checked)}
                  className="rounded border-[hsl(var(--border))]"
                />
                Show passwords
              </label>

              <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                Change Password & Continue
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
