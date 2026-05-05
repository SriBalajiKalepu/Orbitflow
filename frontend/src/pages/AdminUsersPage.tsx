import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { UserPlus, Search, Trash2, Shield, User as UserIcon, Copy, Eye, EyeOff, Edit2, Key } from 'lucide-react';
import { adminApi } from '@/api';
import { Avatar, Badge } from '@/components/ui';
import { Modal, Input, Select, Button } from '@/components/ui/Modal';
import { formatDate, cn } from '@/utils';
import type { CreateUserForm, UpdateUserForm, GlobalRole, User } from '@/types';
import toast from 'react-hot-toast';

const DESIGNATIONS = [
  'Developer',
  'Senior Developer',
  'Frontend Developer',
  'Backend Developer',
  'Full-Stack Developer',
  'Tester',
  'QA Engineer',
  'UI/UX Designer',
  'Product Manager',
  'Project Manager',
  'DevOps Engineer',
  'Data Analyst',
  'Team Lead',
  'Intern',
  'Other',
];

const CreateUserModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CreateUserForm>({
    name: '', email: '', password: '', designation: 'Developer', globalRole: 'MEMBER',
  });
  const [showPassword, setShowPassword] = useState(false);

  const generateTempPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let pass = '';
    for (let i = 0; i < 10; i++) pass += chars[Math.floor(Math.random() * chars.length)];
    pass += Math.floor(Math.random() * 10);
    pass += 'A';
    setForm((f) => ({ ...f, password: pass }));
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(form.password);
    toast.success('Password copied to clipboard');
  };

  const { mutate, isPending } = useMutation({
    mutationFn: () => adminApi.createUser(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(`User "${form.name}" created! Share the temp password with them.`);
      onClose();
      setForm({ name: '', email: '', password: '', designation: 'Developer', globalRole: 'MEMBER' });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to create user'),
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New User" size="lg">
      <div className="space-y-4">
        <Input
          label="Full Name *"
          placeholder="e.g. John Doe"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
        <Input
          label="Email Address *"
          type="email"
          placeholder="john@company.com"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        />
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Designation"
            value={form.designation}
            onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))}
          >
            {DESIGNATIONS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </Select>
          <Select
            label="Role"
            value={form.globalRole}
            onChange={(e) => setForm((f) => ({ ...f, globalRole: e.target.value as GlobalRole }))}
          >
            <option value="MEMBER">Member</option>
            <option value="ADMIN">Admin</option>
          </Select>
        </div>

        {/* Password Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-[hsl(var(--foreground))]">Temporary Password *</label>
            <Button size="xs" variant="outline" onClick={generateTempPassword}>
              Generate
            </Button>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Set a temporary password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--input))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {form.password && (
              <Button size="sm" variant="outline" onClick={copyPassword} icon={<Copy className="w-3.5 h-3.5" />}>
                Copy
              </Button>
            )}
          </div>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            The user will be prompted to change this password on first login.
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button
            className="flex-1"
            isLoading={isPending}
            onClick={() => mutate()}
            disabled={!form.name.trim() || !form.email.trim() || !form.password.trim()}
          >
            Create User
          </Button>
        </div>
      </div>
    </Modal>
  );
};

const EditUserModal: React.FC<{ isOpen: boolean; onClose: () => void; user: User | null }> = ({ isOpen, onClose, user }) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<UpdateUserForm>({});
  const [resetPassword, setResetPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Initialize form when user changes
  React.useEffect(() => {
    if (user) {
      setForm({
        name: user.name,
        email: user.email,
        designation: user.designation || '',
        globalRole: user.globalRole,
      });
      setResetPassword('');
      setShowPassword(false);
    }
  }, [user]);

  const generateTempPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let pass = '';
    for (let i = 0; i < 10; i++) pass += chars[Math.floor(Math.random() * chars.length)];
    pass += Math.floor(Math.random() * 10);
    pass += 'A';
    setResetPassword(pass);
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(resetPassword);
    toast.success('Password copied to clipboard');
  };

  const { mutate: updateProfile, isPending: isUpdating } = useMutation({
    mutationFn: () => adminApi.updateUser(user!.id, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(`User "${user?.name}" updated successfully!`);
      onClose();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to update user'),
  });

  const { mutate: doResetPassword, isPending: isResetting } = useMutation({
    mutationFn: () => adminApi.resetUserPassword(user!.id, { password: resetPassword }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(`Password reset for "${user?.name}"! Share the temp password with them.`);
      setResetPassword('');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to reset password'),
  });

  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit User" size="lg">
      <div className="space-y-6">
        {/* Profile Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">Profile Details</h3>
          <Input
            label="Full Name *"
            value={form.name || ''}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <Input
            label="Email Address *"
            type="email"
            value={form.email || ''}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Designation"
              value={form.designation || ''}
              onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))}
            >
              {DESIGNATIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </Select>
            <Select
              label="Role"
              value={form.globalRole || 'MEMBER'}
              onChange={(e) => setForm((f) => ({ ...f, globalRole: e.target.value as GlobalRole }))}
            >
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </Select>
          </div>
          <Button
            className="w-full mt-2"
            isLoading={isUpdating}
            onClick={() => updateProfile()}
            disabled={!form.name?.trim() || !form.email?.trim()}
          >
            Save Changes
          </Button>
        </div>

        <div className="border-t border-[hsl(var(--border))]" />

        {/* Reset Password Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] flex items-center gap-2">
            <Key className="w-4 h-4 text-orange-500" />
            Reset Password
          </h3>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            Generate a new temporary password. This will log the user out of all devices and force them to change it on their next login.
          </p>

          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="New temporary password"
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--input))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {resetPassword && (
                  <Button size="sm" variant="outline" onClick={copyPassword} icon={<Copy className="w-3.5 h-3.5" />}>
                    Copy
                  </Button>
                )}
              </div>
            </div>
            <Button variant="outline" onClick={generateTempPassword}>
              Generate
            </Button>
          </div>
          
          <Button
            variant="outline"
            className="w-full text-orange-500 border-orange-500/20 hover:bg-orange-500/10 hover:border-orange-500/30"
            isLoading={isResetting}
            onClick={() => {
              if (confirm(`Reset password for ${user.name}? They will be logged out.`)) {
                doResetPassword();
              }
            }}
            disabled={!resetPassword.trim()}
          >
            Reset Password
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export const AdminUsersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [search, setSearch] = useState('');

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: () => adminApi.getUsers({ search: search || undefined }),
  });

  const { mutate: deleteUser } = useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User deleted');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to delete user'),
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">User Management</h1>
          <p className="text-[hsl(var(--muted-foreground))]">
            {users?.length ?? 0} user{(users?.length ?? 0) !== 1 ? 's' : ''} registered
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} icon={<UserPlus className="w-4 h-4" />}>
          Create User
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
        <input
          type="text"
          placeholder="Search users by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--input))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
        />
      </div>

      {/* Users Table */}
      <div className="glass rounded-2xl border border-[hsl(var(--border))] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[hsl(var(--border))]">
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">User</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Designation</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Role</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Status</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Joined</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="border-b border-[hsl(var(--border))]">
                    <td colSpan={6} className="px-5 py-4">
                      <div className="h-10 bg-[hsl(var(--muted))] rounded-lg animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : users?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-[hsl(var(--muted-foreground))]">
                    No users found
                  </td>
                </tr>
              ) : (
                users?.map((user) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]/50 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar src={user.avatar} name={user.name} size="sm" />
                        <div>
                          <p className="font-medium text-sm text-[hsl(var(--foreground))]">{user.name}</p>
                          <p className="text-xs text-[hsl(var(--muted-foreground))]">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-[hsl(var(--foreground))]">
                        {user.designation || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Badge className={user.globalRole === 'ADMIN'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                      }>
                        {user.globalRole === 'ADMIN' && <Shield className="w-2.5 h-2.5 mr-1" />}
                        {user.globalRole === 'ADMIN' ? 'Admin' : 'Member'}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      {user.mustChangePassword ? (
                        <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                          Pending Setup
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                          Active
                        </Badge>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-[hsl(var(--muted-foreground))]">
                        {formatDate(user.createdAt)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditingUser(user)}
                          className="p-2 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                          title="Edit user"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete user "${user.name}"? This cannot be undone.`)) {
                              deleteUser(user.id);
                            }
                          }}
                          className="p-2 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreateUserModal isOpen={showCreate} onClose={() => setShowCreate(false)} />
      <EditUserModal isOpen={!!editingUser} onClose={() => setEditingUser(null)} user={editingUser} />
    </div>
  );
};
