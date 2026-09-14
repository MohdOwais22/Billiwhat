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
  Phone,
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
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<OrganizationMember['role']>('accountant');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [operatingMemberId, setOperatingMemberId] = useState<string | null>(null);

  const formatMemberPhone = (phone?: string, email?: string) => {
    if (phone) {
      const digits = phone.replace(/\D/g, '');
      const ten = digits.slice(-10);
      return `+91 ${ten.slice(0, 5)} ${ten.slice(5)}`;
    }
    if (email) {
      const m = email.match(/(?:master|phone|user)_91(\d{10})/);
      if (m) {
        return `+91 ${m[1].slice(0, 5)} ${m[1].slice(5)}`;
      }
      if (!email.endsWith('@whatsbill.internal')) {
        return email;
      }
    }
    return 'Mobile Login';
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawInput = invitePhone.trim();
    const digits = rawInput.replace(/\D/g, '');
    let cleanPhone = '';

    if (digits.length === 10) {
      cleanPhone = digits;
    } else if (digits.length === 12 && digits.startsWith('91')) {
      cleanPhone = digits.slice(2);
    } else if (digits.length === 11 && digits.startsWith('0')) {
      cleanPhone = digits.slice(1);
    } else {
      setModalError('Please enter a valid 10-digit mobile number (e.g. 9876543210).');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setModalError('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
      return;
    }

    setIsSubmitting(true);
    setModalError(null);
    setActionStatus('idle');
    setStatusMessage('');

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'invite_member',
          payload: {
            phone: cleanPhone,
            display_name: inviteName.trim() || undefined,
            role: inviteRole,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to add team member');
      }

      setActionStatus('success');
      setStatusMessage(data.message || `Member with mobile +91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)} successfully added.`);
      setInvitePhone('');
      setInviteName('');
      setModalError(null);
      setShowInviteModal(false);
      onRefresh();
      setTimeout(() => setActionStatus('idle'), 6000);
    } catch (err: any) {
      console.error('Error inviting team member:', err);
      setModalError(err.message || 'Failed to add team member.');
      setActionStatus('error');
      setStatusMessage(err.message || 'Failed to process member addition.');
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
            onClick={() => {
              setModalError(null);
              setShowInviteModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
            id="invite-member-btn"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Member (Phone)</span>
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
                          {member.display_name?.charAt(0) || 'M'}
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
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{formatMemberPhone(member.phone, member.email)}</span>
                          </div>
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
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-emerald-600" />
                  Add Team Member
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Add staff by their 10-digit mobile number for instant OTP login
                </p>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInvite} className="mt-4 space-y-4">
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Unable to add member</p>
                    <p className="text-[11px] text-rose-700 mt-0.5">{modalError}</p>
                  </div>
                </div>
              )}

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
                <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="invite-phone">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition bg-white">
                  <span className="px-3 py-2 bg-slate-50 border-r border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5 shrink-0 select-none">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    +91
                  </span>
                  <input
                    id="invite-phone"
                    type="tel"
                    inputMode="numeric"
                    required
                    value={invitePhone}
                    onChange={(e) => setInvitePhone(e.target.value)}
                    placeholder="98765 43210"
                    maxLength={14}
                    className="w-full px-3 py-2 text-xs bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Enter 10-digit Indian mobile number. The member can log in using OTP with this number.
                </p>
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
