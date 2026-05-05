import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, Search, FolderKanban, Users, CheckCircle, Clock, MoreVertical, Trash2, Edit } from 'lucide-react';
import { projectsApi } from '@/api';
import { useAuth } from '@/context/AuthContext';
import { Badge, Avatar, AvatarGroup, ProgressBar, Skeleton } from '@/components/ui';
import { Modal, Input, Textarea, Select, Button } from '@/components/ui/Modal';
import { projectStatusColors, statusLabels, formatDate, cn, generateColor } from '@/utils';
import type { Project, ProjectForm, ProjectStatus } from '@/types';
import toast from 'react-hot-toast';

const PROJECT_EMOJIS = ['📋', '🚀', '💡', '🎯', '🔥', '⚡', '🌟', '🛠️', '📱', '🎨', '🔬', '📊'];
const PROJECT_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#06b6d4'];

const CreateProjectModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ProjectForm>({
    name: '', description: '', status: 'ACTIVE',
    color: '#6366f1', emoji: '📋',
  });

  const { mutate, isPending } = useMutation({
    mutationFn: () => projectsApi.create(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project created! 🎉');
      onClose();
      setForm({ name: '', description: '', status: 'ACTIVE', color: '#6366f1', emoji: '📋' });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to create project'),
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Project" size="lg">
      <div className="space-y-4">
        {/* Emoji + Color Row */}
        <div className="flex gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-[hsl(var(--foreground))]">Icon</label>
            <div className="grid grid-cols-6 gap-1">
              {PROJECT_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, emoji: e }))}
                  className={cn(
                    'w-8 h-8 rounded-lg text-base flex items-center justify-center transition-all',
                    form.emoji === e ? 'bg-indigo-500/30 ring-2 ring-indigo-500' : 'hover:bg-[hsl(var(--muted))]'
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-[hsl(var(--foreground))]">Color</label>
            <div className="grid grid-cols-4 gap-1">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, color: c }))}
                  className={cn(
                    'w-8 h-8 rounded-lg transition-all',
                    form.color === c ? 'ring-2 ring-offset-2 ring-offset-[hsl(var(--card))] ring-white scale-110' : ''
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="flex items-center gap-3 p-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: form.color + '30' }}>
            {form.emoji}
          </div>
          <div>
            <p className="text-sm font-medium text-[hsl(var(--foreground))]">{form.name || 'Project Name'}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">{form.description || 'Project description'}</p>
          </div>
        </div>

        <Input
          label="Project Name *"
          placeholder="e.g. Website Redesign"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
        <Textarea
          label="Description"
          placeholder="What is this project about?"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={3}
        />
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ProjectStatus }))}
          >
            <option value="ACTIVE">Active</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="COMPLETED">Completed</option>
          </Select>
          <Input
            label="Due Date"
            type="date"
            value={form.dueDate || ''}
            onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value || undefined }))}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button
            className="flex-1"
            isLoading={isPending}
            onClick={() => mutate()}
            disabled={!form.name.trim()}
          >
            Create Project
          </Button>
        </div>
      </div>
    </Modal>
  );
};

const ProjectCard: React.FC<{ project: Project }> = ({ project }) => {
  const queryClient = useQueryClient();
  const [showMenu, setShowMenu] = useState(false);
  const { user } = useAuth();
  const members = project.members?.map((m) => m.user) || [];
  const currentMember = project.members?.find(m => m.userId === user?.id);
  const isProjectAdmin = user?.globalRole === 'ADMIN' || project.ownerId === user?.id || currentMember?.role === 'ADMIN';

  const { mutate: deleteProject } = useMutation({
    mutationFn: () => projectsApi.delete(project.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project deleted');
    },
    onError: () => toast.error('Failed to delete project'),
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass rounded-2xl p-5 border border-[hsl(var(--border))] hover-lift group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ backgroundColor: project.color + '25' }}
          >
            {project.emoji}
          </div>
          <div>
            <Link
              to={`/projects/${project.id}`}
              className="font-semibold text-[hsl(var(--foreground))] hover:text-indigo-400 transition-colors"
            >
              {project.name}
            </Link>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge className={projectStatusColors[project.status]}>
                {project.status.replace('_', ' ')}
              </Badge>
            </div>
          </div>
        </div>
        {isProjectAdmin && (
          <div className="relative">
            <button
              onClick={() => setShowMenu((s) => !s)}
              className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-8 z-10 glass rounded-xl border border-[hsl(var(--border))] p-1 min-w-[130px] shadow-xl">
                <Link
                  to={`/projects/${project.id}`}
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-[hsl(var(--muted))] w-full"
                  onClick={() => setShowMenu(false)}
                >
                  <Edit className="w-3.5 h-3.5" /> Edit
                </Link>
                <button
                  onClick={() => { deleteProject(); setShowMenu(false); }}
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-red-500/10 text-red-400 w-full"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {project.description && (
        <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4 line-clamp-2">{project.description}</p>
      )}

      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-[hsl(var(--muted-foreground))]">Progress</span>
          <span className="font-semibold text-indigo-400">{project.progress ?? 0}%</span>
        </div>
        <ProgressBar value={project.progress ?? 0} color={project.color} />
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-[hsl(var(--muted-foreground))]">
          <span className="flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            {project.completedCount ?? 0}/{project._count?.tasks ?? 0}
          </span>
          {project.dueDate && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatDate(project.dueDate, 'MMM d')}
            </span>
          )}
        </div>
        <AvatarGroup users={members} max={3} size="xs" />
      </div>
    </motion.div>
  );
};

export const ProjectsPage: React.FC = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { user } = useAuth();
  const isGlobalAdmin = user?.globalRole === 'ADMIN';

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects', { search, status: statusFilter }],
    queryFn: () => projectsApi.getAll({ search: search || undefined, status: statusFilter || undefined }),
  });

  const filtered = projects || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Projects</h1>
          <p className="text-[hsl(var(--muted-foreground))]">{filtered.length} project{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        {isGlobalAdmin && (
          <Button onClick={() => setShowCreate(true)} icon={<Plus className="w-4 h-4" />}>
            New Project
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--input))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
          />
        </div>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-40">
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="ON_HOLD">On Hold</option>
          <option value="COMPLETED">Completed</option>
          <option value="ARCHIVED">Archived</option>
        </Select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-52 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <FolderKanban className="w-16 h-16 text-[hsl(var(--muted-foreground))] mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-2">No projects yet</h3>
          {isGlobalAdmin ? (
            <>
              <p className="text-[hsl(var(--muted-foreground))] mb-6">Create your first project to get started</p>
              <Button onClick={() => setShowCreate(true)} icon={<Plus className="w-4 h-4" />}>
                Create Project
              </Button>
            </>
          ) : (
            <p className="text-[hsl(var(--muted-foreground))] mb-6">You have not been assigned to any projects yet.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      <CreateProjectModal isOpen={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
};
