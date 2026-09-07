'use client';

import React, { useState } from 'react';
import { TeamMemberDetails, OrganizationMember } from '@/types/database';
import { formatDate } from '@/lib/utils/formatters';
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Mail,
} from 'lucide-react';

interface TeamSectionProps {
  members: TeamMemberDetails[];
  currentUserRole: OrganizationMember['role'];
  currentUserId: string;
  onRefresh: () => void;
  canEdit: boolean;
}

const ROLE_DEFINITIONS: Record<
  OrganizationMember['role'],
  { label: string; description: string; badgeClass: string }
> = {
  owner: {
    label: 'Owner',
    description: 'Full account access, billing ownership, team management, and compliance controls.',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  admin: {
    label: 'Admin',
    description: 'Can manage organization settings, team members, products, invoices, and reports.',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  accountant: {
    label: 'Accountant / CA',
    description: 'Access to invoices, GSTR-1 & 3B reports, payments, reconciliations, and expense records.',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  sales_rep: {
    label: 'Sales Representative',
    description: 'Can create invoices, record customer payments, and view customer contacts.',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  viewer: {
    label: 'Viewer',
    description: 'Read-only access to invoices, reports, and product catalog without write permissions.',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
  },
};

export function TeamSection({
  members,
  currentUserId,
  onRefresh,
  canEdit,
}: TeamSectionProps) {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<OrganizationMember['role']>('accountant');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionStatus, setActionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [operatingMemberId, setOperatingMemberId] = useState<string | null>(null);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setIsSubmitting(true);
    setActionStatus('idle');
    setStatusMessage('');

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'invite_member',
          payload: {
            email: inviteEmail.trim(),
            display_name: inviteName.trim() || undefined,
            role: inviteRole,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to invite team member');
      }

      setActionStatus('success');
      setStatusMessage(data.message || `Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      setInviteName('');
      setShowInviteModal(false);
      onRefresh();
      setTimeout(() => setActionStatus('idle'), 5000);
    } catch (err: any) {
      console.error('Error inviting team member:', err);
      setActionStatus('error');
      setStatusMessage(err.message || 'Failed to process invitation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: OrganizationMember['role']) => {
    setOperatingMemberId(memberId);
    setActionStatus('idle');
    setStatusMessage('');

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_member_role',
          payload: { member_id: memberId, new_role: newRole },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update member role');
      }

      setActionStatus('success');
      setStatusMessage('Role updated successfully.');
      onRefresh();
      setTimeout(() => setActionStatus('idle'), 3000);
    } catch (err: any) {
      console.error('Error updating role:', err);
      setActionStatus('error');
      setStatusMessage(err.message || 'Failed to update role.');
    } finally {
      setOperatingMemberId(null);
    }
  };

  const handleRemoveMember = async (memberId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name || 'this member'} from the organization?`)) {
      return;
    }

    setOperatingMemberId(memberId);
    setActionStatus('idle');
    setStatusMessage('');

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove_member',
          payload: { member_id: memberId },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to remove member');
      }

      setActionStatus('success');
      setStatusMessage('Team member removed from organization access list.');
      onRefresh();
      setTimeout(() => setActionStatus('idle'), 3000);
    } catch (err: any) {
      console.error('Error removing member:', err);
      setActionStatus('error');
      setStatusMessage(err.message || 'Failed to remove member.');
    } finally {
      setOperatingMemberId(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden" id="settings-team-card">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Team Members & Access Roles</h2>
              <p className="text-xs text-slate-500">Manage staff access permissions, roles, and accountant access</p>
            </div>
          </div>
        </div>

        {canEdit && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
            id="invite-member-btn"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add / Invite Member</span>
          </button>
        )}
      </div>

      <div className="p-6 space-y-6">
        {actionStatus === 'success' && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {actionStatus === 'error' && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Member List Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Member Name & Account</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Joined Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {members.map((member) => {
                const roleDef = ROLE_DEFINITIONS[member.role] || ROLE_DEFINITIONS.viewer;
                const isCurrentUser = member.user_id === currentUserId;
                const isOwner = member.role === 'owner';

                return (
                  <tr key={member.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-xs">
                          {member.display_name?.charAt(0) || member.email?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">
                              {member.display_name || 'Team Member'}
                            </span>
                            {isCurrentUser && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                You
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500">{member.email || member.phone || 'Active Member'}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      {canEdit && !isOwner ? (
                        <select
                          disabled={operatingMemberId === member.id}
                          value={member.role}
                          onChange={(e) =>
                            handleRoleChange(member.id, e.target.value as OrganizationMember['role'])
                          }
                          className="px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition cursor-pointer"
                        >
                          <option value="admin">Admin</option>
                          <option value="accountant">Accountant / CA</option>
                          <option value="sales_rep">Sales Representative</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${roleDef.badgeClass}`}
                        >
                          {roleDef.label}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">
                      {member.created_at ? formatDate(member.created_at, 'short') : 'Registered'}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      {canEdit && !isOwner && !isCurrentUser && (
                        <button
                          disabled={operatingMemberId === member.id}
                          onClick={() => handleRemoveMember(member.id, member.display_name || 'Member')}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition disabled:opacity-50 cursor-pointer"
                          title="Remove from Organization"
                        >
                          {operatingMemberId === member.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Role Permissions Reference */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            Role Permission Matrix
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(ROLE_DEFINITIONS).map(([roleKey, def]) => (
              <div key={roleKey} className="p-3 bg-white border border-slate-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${def.badgeClass}`}>
                    {def.label}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">{def.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-600" />
                Add Organization Member
              </h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInvite} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="invite-name">
                  Full Name (Optional)
                </label>
                <input
                  id="invite-name"
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="invite-email">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="invite-email"
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="accountant@company.com"
                    className="w-full pl-9 pr-3.5 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="invite-role">
                  Assign Access Role
                </label>
                <select
                  id="invite-role"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as OrganizationMember['role'])}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
                >
                  <option value="accountant">Accountant / CA (Reports & Invoices)</option>
                  <option value="sales_rep">Sales Representative (Create Invoices & Payments)</option>
                  <option value="admin">Admin (Manage settings & staff)</option>
                  <option value="viewer">Viewer (Read-only)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <span>Add Member</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
