import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors, closestCorners
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus, ArrowLeft, Users, Settings, Kanban, Activity,
  Calendar, CheckCircle, AlertTriangle, MessageCircle, GripVertical
} from 'lucide-react';
import { projectsApi, tasksApi } from '@/api';
import { useAuth } from '@/context/AuthContext';
import { Badge, Avatar, AvatarGroup, ProgressBar, Skeleton } from '@/components/ui';
import { Modal, Input, Textarea, Select, Button } from '@/components/ui/Modal';
import {
  statusColors, statusLabels, priorityColors, priorityLabels,
  priorityDotColors, formatDate, formatRelative, isOverdue, cn,
  projectStatusColors
} from '@/utils';
import type { Task, TaskForm, TaskStatus, Priority, ProjectStatus } from '@/types';
import toast from 'react-hot-toast';

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'TODO', label: 'To Do', color: 'border-slate-500/30' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'border-blue-500/30' },
  { id: 'REVIEW', label: 'Review', color: 'border-amber-500/30' },
  { id: 'COMPLETED', label: 'Completed', color: 'border-emerald-500/30' },
];

// ─── Task Card ────────────────────────────────────────────────────────────────

const TaskCard: React.FC<{
  task: Task;
  isDragging?: boolean;
  onEdit: (task: Task) => void;
}> = ({ task, isDragging, onEdit }) => {
  const overdue = task.dueDate && isOverdue(task.dueDate, task.status);

  return (
    <div
      className={cn(
        'glass rounded-xl p-3.5 border border-[hsl(var(--border))] cursor-pointer',
        'hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/5',
        'transition-all duration-200 group',
        isDragging && 'opacity-50 rotate-2 scale-105'
      )}
      onClick={() => onEdit(task)}
    >
      {/* Priority Indicator */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <div className={cn('w-2 h-2 rounded-full', priorityDotColors[task.priority])} />
          <Badge className={cn('text-[10px]', priorityColors[task.priority])}>
            {priorityLabels[task.priority]}
          </Badge>
        </div>
        <GripVertical className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))] opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <h4 className="text-sm font-medium text-[hsl(var(--foreground))] mb-2 line-clamp-2 leading-relaxed">
        {task.title}
      </h4>

      {task.description && (
        <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {task.dueDate && (
            <span className={cn(
              'text-xs flex items-center gap-1',
              overdue ? 'text-red-400' : 'text-[hsl(var(--muted-foreground))]'
            )}>
              {overdue ? <AlertTriangle className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
              {formatDate(task.dueDate, 'MMM d')}
            </span>
          )}
          {(task._count?.comments ?? 0) > 0 && (
            <span className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              {task._count?.comments}
            </span>
          )}
        </div>
        {task.assignee && (
          <Avatar src={task.assignee.avatar} name={task.assignee.name} size="xs" title={task.assignee.name} />
        )}
      </div>
    </div>
  );
};

// ─── Sortable Task Card ───────────────────────────────────────────────────────

const SortableTaskCard: React.FC<{ task: Task; onEdit: (task: Task) => void }> = ({ task, onEdit }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
    >
      <TaskCard task={task} isDragging={isDragging} onEdit={onEdit} />
    </div>
  );
};

// ─── Kanban Column ────────────────────────────────────────────────────────────

const KanbanColumn: React.FC<{
  column: typeof COLUMNS[0];
  tasks: Task[];
  onAddTask: (status: TaskStatus) => void;
  onEditTask: (task: Task) => void;
  isAdmin: boolean;
}> = ({ column, tasks, onAddTask, onEditTask, isAdmin }) => (
  <div className={cn(
    'glass rounded-2xl border border-t-2 flex flex-col min-h-[500px] w-72 flex-shrink-0',
    column.color
  )}>
    {/* Column Header */}
    <div className="flex items-center justify-between p-4 pb-3">
      <div className="flex items-center gap-2">
        <Badge className={statusColors[column.id]}>{column.label}</Badge>
        <span className="text-xs text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>
      {isAdmin && (
        <button
          onClick={() => onAddTask(column.id)}
          className="p-1 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      )}
    </div>

    {/* Tasks */}
    <div className="flex-1 px-3 pb-3 space-y-2 overflow-y-auto">
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        {tasks.map((task) => (
          <SortableTaskCard key={task.id} task={task} onEdit={onEditTask} />
        ))}
      </SortableContext>
      {tasks.length === 0 && (
        <div
          className={cn(
            'flex items-center justify-center h-24 border-2 border-dashed border-[hsl(var(--border))] rounded-xl text-[hsl(var(--muted-foreground))] text-sm',
            isAdmin && 'cursor-pointer hover:border-indigo-500/50 hover:text-indigo-400 transition-colors'
          )}
          onClick={() => isAdmin && onAddTask(column.id)}
        >
          {isAdmin ? '+ Add task' : 'No tasks assigned'}
        </div>
      )}
    </div>
  </div>
);

// ─── Task Modal ───────────────────────────────────────────────────────────────

const TaskModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  initialStatus?: TaskStatus;
  task?: Task | null;
  members: Array<{ id: string; name: string; avatar?: string }>;
  isProjectAdmin: boolean;
}> = ({ isOpen, onClose, projectId, initialStatus, task, members, isProjectAdmin }) => {
  const queryClient = useQueryClient();
  const isEdit = !!task;
  const [form, setForm] = useState<TaskForm>({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || initialStatus || 'TODO',
    priority: task?.priority || 'MEDIUM',
    dueDate: task?.dueDate ? task.dueDate.split('T')[0] : '',
    assigneeId: task?.assigneeId || '',
  });

  // Sync form when task changes
  React.useEffect(() => {
    if (task) {
      setForm({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        assigneeId: task.assigneeId || '',
      });
    } else {
      setForm((f) => ({ ...f, status: initialStatus || 'TODO', title: '', description: '' }));
    }
  }, [task, initialStatus, isOpen]);

  const { mutate: createTask, isPending: creating } = useMutation({
    mutationFn: () => tasksApi.create(projectId, { ...form, dueDate: form.dueDate || undefined, assigneeId: form.assigneeId || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      toast.success('Task created!');
      onClose();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to create task'),
  });

  const { mutate: updateTask, isPending: updating } = useMutation({
    mutationFn: () => {
      if (!isProjectAdmin) {
        return tasksApi.update(projectId, task!.id, { status: form.status });
      }
      return tasksApi.update(projectId, task!.id, { ...form, dueDate: form.dueDate || undefined, assigneeId: form.assigneeId || undefined });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      toast.success('Task updated!');
      onClose();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to update task'),
  });

  const { mutate: deleteTask } = useMutation({
    mutationFn: () => tasksApi.delete(projectId, task!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      toast.success('Task deleted');
      onClose();
    },
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Task' : 'Create Task'} size="lg">
      <div className="space-y-4">
        <Input
          label="Task Title *"
          placeholder="What needs to be done?"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          disabled={isEdit && !isProjectAdmin}
        />
        <Textarea
          label="Description"
          placeholder="Add more details about this task..."
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={4}
          disabled={isEdit && !isProjectAdmin}
        />
        <div className="grid grid-cols-2 gap-4">
          <Select label="Status" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as TaskStatus }))}>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="REVIEW">Review</option>
            <option value="COMPLETED">Completed</option>
          </Select>
          <Select label="Priority" value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as Priority }))} disabled={isEdit && !isProjectAdmin}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Select label="Assignee" value={form.assigneeId} onChange={(e) => setForm((f) => ({ ...f, assigneeId: e.target.value }))} disabled={isEdit && !isProjectAdmin}>
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </Select>
          <Input label="Due Date" type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} disabled={isEdit && !isProjectAdmin} />
        </div>

        <div className="flex gap-3 pt-2">
          {isEdit && isProjectAdmin && (
            <Button variant="danger" size="sm" onClick={() => deleteTask()}>Delete</Button>
          )}
          <div className="flex gap-3 flex-1 justify-end">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              isLoading={creating || updating}
              onClick={() => isEdit ? updateTask() : createTask()}
              disabled={!form.title.trim()}
            >
              {isEdit ? 'Update Task' : 'Create Task'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// ─── Project Detail Page ──────────────────────────────────────────────────────

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [taskModal, setTaskModal] = useState<{ open: boolean; status?: TaskStatus; task?: Task | null }>({ open: false });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsApi.getOne(id!),
    enabled: !!id,
    refetchInterval: 15000,
  });

  const { mutate: updateTask } = useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: any }) =>
      tasksApi.update(id!, taskId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project', id] }),
  });

  const { mutate: reorderTasks } = useMutation({
    mutationFn: (tasks: { id: string; position: number }[]) => tasksApi.reorder(id!, tasks),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project', id] }),
  });

  const { mutate: updateProjectDetails } = useMutation({
    mutationFn: (data: Partial<ProjectForm>) => projectsApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      toast.success('Project status updated');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to update project status'),
  });

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const tasks = project?.tasks || [];
    const activeTask = tasks.find((t) => t.id === active.id);
    const overTask = tasks.find((t) => t.id === over.id);

    if (!activeTask || !overTask) return;

    if (activeTask.status !== overTask.status) {
      updateTask({ taskId: activeTask.id, data: { status: overTask.status } });
    } else {
      // Reorder within the same column
      const columnTasks = tasks.filter((t) => t.status === activeTask.status);
      const oldIndex = columnTasks.findIndex((t) => t.id === active.id);
      const newIndex = columnTasks.findIndex((t) => t.id === over.id);

      const newColumnTasks = arrayMove(columnTasks, oldIndex, newIndex);
      const updates = newColumnTasks.map((t, index) => ({ id: t.id, position: index }));

      // Optimistic update
      queryClient.setQueryData(['project', id], (old: any) => {
        if (!old) return old;
        const newTasks = old.tasks.map((t: Task) => {
          const update = updates.find(u => u.id === t.id);
          return update ? { ...t, position: update.position } : t;
        });
        // Important: sort tasks by position immediately so the UI doesn't flicker
        newTasks.sort((a: Task, b: Task) => a.position - b.position);
        return { ...old, tasks: newTasks };
      });

      reorderTasks(updates);
    }
  };

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-32 rounded-2xl" /><Skeleton className="h-96 rounded-2xl" /></div>;
  }

  if (!project) return null;

  const tasks = project.tasks || [];
  const members = project.members?.map((m) => m.user) || [];
  const activeTask = tasks.find((t) => t.id === activeId);

  const currentMember = project.members?.find((m) => m.userId === user?.id);
  const isProjectAdmin = user?.globalRole === 'ADMIN' || project.ownerId === user?.id || currentMember?.role === 'ADMIN';

  const columnTasks = (status: TaskStatus) => tasks.filter((t) => t.status === status);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="glass rounded-2xl p-5 border border-[hsl(var(--border))]">
        <div className="flex items-center gap-2 mb-4">
          <Link to="/projects" className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <span className="text-[hsl(var(--muted-foreground))] text-sm">Projects</span>
          <span className="text-[hsl(var(--muted-foreground))]">/</span>
          <span className="text-sm font-medium">{project.name}</span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ backgroundColor: project.color + '25' }}
            >
              {project.emoji}
            </div>
            <div>
              <h1 className="text-xl font-bold text-[hsl(var(--foreground))]">{project.name}</h1>
              {project.description && (
                <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">{project.description}</p>
              )}
              <div className="flex items-center gap-3 mt-2">
                {isProjectAdmin ? (
                  <select
                    value={project.status}
                    onChange={(e) => updateProjectDetails({ status: e.target.value as ProjectStatus })}
                    className={cn(
                      "text-xs font-semibold px-2.5 py-0.5 rounded-full border focus:outline-none appearance-none cursor-pointer transition-colors",
                      projectStatusColors[project.status]
                    )}
                  >
                    <option value="ACTIVE" className="bg-[hsl(var(--background))] text-emerald-500">Active</option>
                    <option value="COMPLETED" className="bg-[hsl(var(--background))] text-blue-500">Completed</option>
                    <option value="ON_HOLD" className="bg-[hsl(var(--background))] text-amber-500">On Hold</option>
                    <option value="ARCHIVED" className="bg-[hsl(var(--background))] text-slate-500">Archived</option>
                  </select>
                ) : (
                  <Badge className={projectStatusColors[project.status]}>{project.status}</Badge>
                )}
                {project.dueDate && (
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">
                    📅 Due {formatDate(project.dueDate)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Progress */}
            <div className="min-w-[120px]">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-[hsl(var(--muted-foreground))]">Progress</span>
                <span className="font-bold text-indigo-400">{project.progress ?? 0}%</span>
              </div>
              <ProgressBar value={project.progress ?? 0} color={project.color} />
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                {project.completedCount}/{project.taskCount} tasks
              </p>
            </div>

            {/* Members */}
            <div className="flex items-center gap-2">
              <AvatarGroup users={members} max={4} size="sm" />
              <Link to={`/projects/${id}/team`} className="text-xs text-indigo-400 hover:underline">
                {members.length} members
              </Link>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {isProjectAdmin && (
                <Button
                  onClick={() => setTaskModal({ open: true })}
                  icon={<Plus className="w-4 h-4" />}
                  size="sm"
                >
                  Add Task
                </Button>
              )}
              <Link to={`/projects/${id}/team`}>
                <Button variant="outline" size="sm" icon={<Users className="w-4 h-4" />}>
                  Team
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              column={col}
              tasks={columnTasks(col.id)}
              onAddTask={(status) => setTaskModal({ open: true, status })}
              onEditTask={(task) => setTaskModal({ open: true, task })}
              isAdmin={isProjectAdmin}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask && (
            <TaskCard task={activeTask} onEdit={() => {}} />
          )}
        </DragOverlay>
      </DndContext>

      {/* Task Modal */}
      <TaskModal
        isOpen={taskModal.open}
        onClose={() => setTaskModal({ open: false })}
        projectId={id!}
        initialStatus={taskModal.status}
        task={taskModal.task}
        members={members}
        isProjectAdmin={isProjectAdmin}
      />
    </div>
  );
};
