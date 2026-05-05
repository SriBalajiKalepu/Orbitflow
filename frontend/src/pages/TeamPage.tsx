import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, UserPlus, Crown, UserMinus, Shield, User } from 'lucide-react';
import { projectsApi } from '@/api';
import { useAuth } from '@/context/AuthContext';
import { Avatar, Badge } from '@/components/ui';
import { Modal, Input, Select, Button } from '@/components/ui/Modal';
import { formatDate, cn } from '@/utils';
import type { MemberRole } from '@/types';
import toast from 'react-hot-toast';

const InviteMemberModal: React.FC<{ isOpen: boolean; onClose: () => void; projectId: string }> = ({
  isOpen, onClose, projectId
}) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ email: '', role: 'MEMBER' });

  const { mutate, isPending } = useMutation({
    mutationFn: () => projectsApi.addMember(projectId, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
      toast.success('Member invited!');
      onClose();
      setForm({ email: '', role: 'MEMBER' });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to invite member'),
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite Team Member" size="sm">
      <div className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          placeholder="member@company.com"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        />
        <Select label="Role" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
          <option value="MEMBER">Member</option>
          <option value="ADMIN">Admin</option>
        </Select>
        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" isLoading={isPending} onClick={() => mutate()} disabled={!form.email.trim()}>
            Invite
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export const TeamPage: React.FC = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [showInvite, setShowInvite] = useState(false);

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.getOne(projectId!),
    enabled: !!projectId,
  });

  const { data: members, isLoading } = useQuery({
    queryKey: ['project-members', projectId],
    queryFn: () => projectsApi.getMembers(projectId!),
    enabled: !!projectId,
  });

  const { mutate: removeMember } = useMutation({
    mutationFn: (userId: string) => projectsApi.removeMember(projectId!, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
      toast.success('Member removed');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to remove member'),
  });

  const { mutate: updateRole } = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      projectsApi.updateMemberRole(projectId!, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
      toast.success('Role updated');
    },
  });

  const currentMember = members?.find(m => m.userId === user?.id);
  const isProjectAdmin = user?.globalRole === 'ADMIN' || project?.ownerId === user?.id || currentMember?.role === 'ADMIN';

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={`/projects/${projectId}`} className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-[hsl(var(--foreground))]">Team Members</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{project?.name}</p>
        </div>
        {isProjectAdmin && (
          <Button onClick={() => setShowInvite(true)} icon={<UserPlus className="w-4 h-4" />} size="sm">
            Invite Member
          </Button>
        )}
      </div>

      {/* Members List */}
      <div className="glass rounded-2xl border border-[hsl(var(--border))] overflow-hidden">
        <div className="p-4 border-b border-[hsl(var(--border))]">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{members?.length ?? 0} members</p>
        </div>

        <div className="divide-y divide-[hsl(var(--border))]">
          {members?.map((member) => {
            const isOwner = member.userId === project?.ownerId;
            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-4 p-4 hover:bg-[hsl(var(--muted))/50] transition-colors"
              >
                <Avatar src={member.user.avatar} name={member.user.name} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-[hsl(var(--foreground))]">{member.user.name}</p>
                    {isOwner && (
                      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                        <Crown className="w-2.5 h-2.5 mr-1" />Owner
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">{member.user.email}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Joined {formatDate(member.joinedAt)}</p>
                </div>

                {!isOwner && isProjectAdmin && (
                  <div className="flex items-center gap-2">
                    <Select
                      value={member.role}
                      onChange={(e) => updateRole({ userId: member.userId, role: e.target.value })}
                      className="text-xs py-1.5 w-28"
                    >
                      <option value="MEMBER">Member</option>
                      <option value="ADMIN">Admin</option>
                    </Select>
                    <button
                      onClick={() => removeMember(member.userId)}
                      className="p-2 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Remove member"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {isOwner && (
                  <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30">
                    <Shield className="w-2.5 h-2.5 mr-1" />Admin
                  </Badge>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      <InviteMemberModal
        isOpen={showInvite}
        onClose={() => setShowInvite(false)}
        projectId={projectId!}
      />
    </div>
  );
};
