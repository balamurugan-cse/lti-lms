import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useLMS } from '../../context/LMSContext';
import {
  Users,
  Shield,
  KeyRound,
  UserPlus,
  Trash2,
  Lock,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
  UserCheck,
  Ban,
} from 'lucide-react';

const ALL_PERMISSIONS = [
  { id: 'USER_MANAGE', label: 'User Management', desc: 'Create users, modify accounts, and delete records' },
  { id: 'COURSE_EDIT', label: 'Curriculum Authoring', desc: 'Create and edit courses, modules, and lessons' },
  { id: 'COURSE_VIEW', label: 'Course Inspection', desc: 'Inspect unreleased or restricted course tracks' },
  { id: 'REPORT_VIEW', label: 'Institutional Analytics', desc: 'View grade reports, completion metrics, and stats' },
  { id: 'SYSTEM_CONFIG', label: 'System Configuration', desc: 'Configure platform security and maintenance mode' },
  { id: 'AUDIT_VIEW', label: 'Security Audit Stream', desc: 'Inspect immutable cryptographic event audit trail' },
  { id: 'ENROLLMENT_MANAGE', label: 'Enrollment Control', desc: 'Manually register or drop student enrollments' },
  { id: 'SECURITY_MANAGE', label: 'Session & MFA Control', desc: 'Revoke active sessions and view 2FA enrollments' },
];

export const UserRbacManager: React.FC = () => {
  const { currentUser } = useLMS();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Edit Permissions Modal
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);

  // Create User Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createRole, setCreateRole] = useState<'STUDENT' | 'INSTRUCTOR' | 'ADMIN'>('STUDENT');
  const [createPermissions, setCreatePermissions] = useState<string[]>([]);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.getAdminUsers();
      setUsers(res.users || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Update Status
  const handleStatusChange = async (userId: string, newStatus: string) => {
    setErrorMsg(null);
    try {
      await api.updateUserStatus(userId, newStatus);
      setSuccessMsg(`User status updated to ${newStatus}.`);
      await loadUsers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update user status.');
    }
  };

  // Update Role
  const handleRoleChange = async (userId: string, newRole: string) => {
    setErrorMsg(null);
    try {
      await api.updateUserRole(userId, newRole);
      setSuccessMsg(`User role updated to ${newRole}.`);
      await loadUsers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update user role.');
    }
  };

  // Delete User
  const handleDeleteUser = async (user: any) => {
    if (user.id === currentUser?.id) {
      alert('Security violation: Cannot delete your own active administrator account.');
      return;
    }
    if (!window.confirm(`Permanently delete account for "${user.name}" (${user.email})?`)) {
      return;
    }
    setErrorMsg(null);
    try {
      await api.deleteUser(user.id);
      setSuccessMsg(`User "${user.name}" deleted from registry.`);
      await loadUsers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete user.');
    }
  };

  // Open Permissions Modal
  const handleOpenPermissions = (user: any) => {
    setEditingUser(user);
    setSelectedPermissions(user.permissions || []);
  };

  // Save Permissions
  const handleSavePermissions = async () => {
    if (!editingUser) return;
    setIsSavingPermissions(true);
    setErrorMsg(null);
    try {
      await api.updateUserPermissions(editingUser.id, selectedPermissions);
      setSuccessMsg(`Granular permissions updated for ${editingUser.name}.`);
      setEditingUser(null);
      await loadUsers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update permissions.');
    } finally {
      setIsSavingPermissions(false);
    }
  };

  // Create User Submit
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName || !createEmail || !createPassword) return;
    setIsCreatingUser(true);
    setErrorMsg(null);
    try {
      await api.createAdminUser({
        name: createName.trim(),
        email: createEmail.trim(),
        password: createPassword,
        role: createRole,
        permissions: createRole === 'ADMIN' ? createPermissions : undefined,
      });
      setSuccessMsg(`Account created successfully for ${createName}.`);
      setShowCreateModal(false);
      setCreateName('');
      setCreateEmail('');
      setCreatePassword('');
      setCreatePermissions([]);
      await loadUsers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create user.');
    } finally {
      setIsCreatingUser(false);
    }
  };

  // Filter users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-rose-200">
            ×
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-200">
            ×
          </button>
        </div>
      )}

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            User Registry & Granular RBAC
          </h3>
          <p className="text-xs text-slate-400">
            Inspect verified credentials, manage access statuses, and configure fine-grained permissions.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={loadUsers}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            title="Refresh Users"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 shadow-md flex items-center gap-1.5 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Create Account
          </button>
        </div>
      </div>

      {/* Filter Strip */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email address..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300"
          >
            <option value="ALL">All Roles</option>
            <option value="STUDENT">Student</option>
            <option value="INSTRUCTOR">Instructor</option>
            <option value="ADMIN">Admin</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="DEACTIVATED">Deactivated</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400 font-mono">
          Loading user database...
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
          No users matching the selected filters.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-xs text-left text-slate-300 bg-slate-900">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-mono border-b border-slate-800">
              <tr>
                <th className="p-3.5">User Details</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Granular Permissions</th>
                <th className="p-3.5">MFA</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-850/50 transition-colors">
                  <td className="p-3.5">
                    <div className="font-bold text-white">{u.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                  </td>
                  <td className="p-3.5">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      disabled={u.id === currentUser?.id}
                      className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] font-mono font-bold text-amber-400"
                    >
                      <option value="STUDENT">STUDENT</option>
                      <option value="INSTRUCTOR">INSTRUCTOR</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                    </select>
                  </td>
                  <td className="p-3.5">
                    <select
                      value={u.status || 'ACTIVE'}
                      onChange={(e) => handleStatusChange(u.id, e.target.value)}
                      disabled={u.id === currentUser?.id}
                      className={`bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] font-mono font-bold ${
                        u.status === 'ACTIVE'
                          ? 'text-emerald-400'
                          : u.status === 'SUSPENDED'
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="SUSPENDED">SUSPENDED</option>
                      <option value="DEACTIVATED">DEACTIVATED</option>
                    </select>
                  </td>
                  <td className="p-3.5">
                    {u.role === 'SUPER_ADMIN' ? (
                      <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                        ALL_PERMISSIONS (ROOT)
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] text-slate-400 font-mono">
                          {u.permissions?.length || 0} granted
                        </span>
                        {(u.role === 'ADMIN' || u.role === 'INSTRUCTOR') && (
                          <button
                            onClick={() => handleOpenPermissions(u)}
                            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold"
                          >
                            Configure
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="p-3.5">
                    {u.mfaEnabled ? (
                      <span className="text-emerald-400 text-[11px] font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Enforced
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">None</span>
                    )}
                  </td>
                  <td className="p-3.5 text-right">
                    {u.id !== currentUser?.id && (
                      <button
                        onClick={() => handleDeleteUser(u)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete User Account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Permissions Editor Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  Configure Granular Permissions
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Assign specific capabilities to <strong className="text-white">{editingUser.name}</strong> ({editingUser.email})
                </p>
              </div>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 pt-2">
              {ALL_PERMISSIONS.map((p) => {
                const isChecked = selectedPermissions.includes(p.id);
                return (
                  <label
                    key={p.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      isChecked
                        ? 'bg-amber-400/10 border-amber-400/30'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPermissions([...selectedPermissions, p.id]);
                        } else {
                          setSelectedPermissions(selectedPermissions.filter((id) => id !== p.id));
                        }
                      }}
                      className="mt-0.5 rounded border-slate-700 text-amber-400 focus:ring-0 w-4 h-4"
                    />
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>{p.label}</span>
                        <code className="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-1 py-0.2 rounded">
                          {p.id}
                        </code>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{p.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingPermissions}
                onClick={handleSavePermissions}
                className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-md disabled:opacity-50"
              >
                {isSavingPermissions ? 'Updating...' : 'Save Permissions'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-amber-400" />
                Create Institutional Account
              </h4>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  placeholder="jane.doe@institution.edu"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">Role</label>
                <select
                  value={createRole}
                  onChange={(e) => setCreateRole(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white"
                >
                  <option value="STUDENT">Student (Learner)</option>
                  <option value="INSTRUCTOR">Instructor (Faculty)</option>
                  <option value="ADMIN">Administrator (Staff)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingUser}
                  className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-md disabled:opacity-50"
                >
                  {isCreatingUser ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
