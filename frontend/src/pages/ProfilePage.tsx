import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { User, Mail, Edit2, Save, Camera } from 'lucide-react';
import { authApi } from '@/api';
import { useAuth } from '@/context/AuthContext';
import { Avatar, Badge } from '@/components/ui';
import { Input, Textarea, Button } from '@/components/ui/Modal';
import { formatDate } from '@/utils';
import toast from 'react-hot-toast';

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', bio: user?.bio || '' });

  const { mutate, isPending } = useMutation({
    mutationFn: () => authApi.updateProfile(form),
    onSuccess: (updated) => {
      updateUser(updated);
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setEditing(false);
      toast.success('Profile updated!');
    },
    onError: () => toast.error('Failed to update profile'),
  });

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Profile</h1>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl border border-[hsl(var(--border))] overflow-hidden"
      >
        {/* Cover */}
        <div className="h-24 gradient-primary relative" />

        <div className="px-6 pb-6">
          {/* Avatar */}
          <div className="flex items-end justify-between -mt-10 mb-6">
            <div className="relative">
              <Avatar src={user.avatar} name={user.name} size="xl" className="ring-4 ring-[hsl(var(--card))]" />
            </div>
            <div className="flex gap-2">
              {editing ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
                  <Button size="sm" isLoading={isPending} onClick={() => mutate()} icon={<Save className="w-4 h-4" />}>
                    Save
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)} icon={<Edit2 className="w-4 h-4" />}>
                  Edit Profile
                </Button>
              )}
            </div>
          </div>

          {editing ? (
            <div className="space-y-4">
              <Input
                label="Full Name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                icon={<User className="w-4 h-4" />}
              />
              <Textarea
                label="Bio"
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                placeholder="Tell us about yourself..."
                rows={3}
              />
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">{user.name}</h2>
                <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30">{user.globalRole}</Badge>
              </div>
              <div className="flex items-center gap-2 text-[hsl(var(--muted-foreground))] mb-3">
                <Mail className="w-4 h-4" />
                <span className="text-sm">{user.email}</span>
              </div>
              {user.bio && <p className="text-sm text-[hsl(var(--muted-foreground))]">{user.bio}</p>}
            </div>
          )}
        </div>
      </motion.div>

      {/* Stats Card */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Projects Owned', value: user._count?.ownedProjects ?? 0 },
          { label: 'Tasks Assigned', value: user._count?.assignedTasks ?? 0 },
          { label: 'Comments', value: user._count?.comments ?? 0 },
        ].map((stat) => (
          <div key={stat.label} className="glass rounded-xl p-4 border border-[hsl(var(--border))] text-center">
            <div className="text-2xl font-bold text-[hsl(var(--foreground))]">{stat.value}</div>
            <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Info Card */}
      <div className="glass rounded-2xl border border-[hsl(var(--border))] p-5">
        <h3 className="font-semibold text-[hsl(var(--foreground))] mb-4">Account Information</h3>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-[hsl(var(--muted-foreground))]">Member since</span>
            <span className="text-[hsl(var(--foreground))]">{formatDate(user.createdAt)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[hsl(var(--muted-foreground))]">Account type</span>
            <span className="text-[hsl(var(--foreground))]">{user.globalRole}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[hsl(var(--muted-foreground))]">Email</span>
            <span className="text-[hsl(var(--foreground))]">{user.email}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
