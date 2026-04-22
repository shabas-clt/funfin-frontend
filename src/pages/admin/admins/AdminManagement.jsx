import { useState, useEffect } from 'react';
import { Search, Edit, Trash, Eye, KeyRound, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { TableSkeleton } from '@/components/ui/skeleton';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { api } from '@/api/axios';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { useAuth } from '@/context/AuthContext';
import { adminCreateSchema, adminUpdateSchema } from '@/lib/validation/schemas';
import { applyServerErrors } from '@/lib/validation/serverErrors';
import { formatShortDate } from '@/lib/format';
import FieldError from '@/components/shared/FieldError';

const ROLE_FILTER_OPTIONS = ['All', 'admin', 'superadmin'];

const ADD_DEFAULTS = {
  fullName: '',
  email: '',
  password: '',
  role: 'admin',
  isActive: true,
};

const EDIT_DEFAULTS = {
  fullName: '',
  email: '',
  role: 'admin',
  isActive: true,
  password: '',
};
const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { value: 'createdAt:desc', label: 'Newest first' },
  { value: 'createdAt:asc', label: 'Oldest first' },
  { value: 'name:asc', label: 'Name A-Z' },
  { value: 'name:desc', label: 'Name Z-A' },
];

export default function AdminManagement() {
  const { admin: currentAdmin } = useAuth();
  const isSuperAdmin = String(currentAdmin?.role || '').toLowerCase() === 'superadmin';

  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [skip, setSkip] = useState(0);
  const [total, setTotal] = useState(0);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState(null);

  // Separate rhf instances so add/edit state don't trample each other if
  // both modals are briefly open during a transition.
  const addForm = useForm({
    resolver: yupResolver(adminCreateSchema),
    mode: 'onChange',
    defaultValues: ADD_DEFAULTS,
  });
  const editForm = useForm({
    resolver: yupResolver(adminUpdateSchema),
    mode: 'onChange',
    defaultValues: EDIT_DEFAULTS,
  });

  const fetchAdmins = async (nextSkip = skip) => {
    try {
      setIsLoading(true);
      const params = {
        role: filterRole || undefined,
        q: searchQuery || undefined,
        sortBy,
        sortOrder,
        skip: nextSkip,
        limit: PAGE_SIZE,
      };
      const res = await api.get('/admins', { params });
      const rows = (res.admins || []).filter((row) => row.role !== 'mentor');
      setAdmins(rows);
      setTotal(res.total || 0);
      setSkip(nextSkip);
    } catch {
      setAdmins([]);
      setTotal(0);
      toast.error('Failed to load admins');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins(0);
  }, [filterRole, sortBy, sortOrder, searchQuery]);

  const onSearchSubmit = (e) => {
    e.preventDefault();
    fetchAdmins(0);
  };

  const openAddModal = () => {
    if (!isSuperAdmin) {
      toast.error('Only superadmin can add admin accounts');
      return;
    }
    addForm.reset(ADD_DEFAULTS);
    setIsAddModalOpen(true);
  };

  const openViewModal = (admin) => {
    setCurrentRow(admin);
    setIsViewModalOpen(true);
  };

  const openEditModal = (admin) => {
    setCurrentRow(admin);
    editForm.reset({
      fullName: admin.fullName || '',
      email: admin.email || '',
      role: admin.role || 'admin',
      isActive: Boolean(admin.isActive),
      password: '',
    });
    setIsEditModalOpen(true);
  };

  const submitAdd = async (values) => {
    const confirm = await Swal.fire({
      title: 'Create admin account?',
      text: 'A new admin user will be created.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Create',
      confirmButtonColor: '#4f46e5',
      cancelButtonText: 'Cancel',
    });
    if (!confirm.isConfirmed) return;

    try {
      await api.post('/admins', values);
      setIsAddModalOpen(false);
      fetchAdmins();
      toast.success('Admin created successfully');
    } catch (err) {
      const fallback = applyServerErrors(addForm, err, 'Failed to create admin');
      if (fallback) toast.error(fallback);
    }
  };

  const submitEdit = async (values) => {
    // Only send fields that actually changed so optional backend fields
    // aren't overwritten with no-ops.
    const payload = {};
    if (values.fullName && values.fullName !== currentRow?.fullName) {
      payload.fullName = values.fullName;
    }
    if (values.email && values.email !== currentRow?.email) {
      payload.email = values.email;
    }
    if (typeof values.isActive === 'boolean' && values.isActive !== currentRow?.isActive) {
      payload.isActive = values.isActive;
    }
    if (isSuperAdmin) {
      if (values.role && values.role !== currentRow?.role) {
        payload.role = values.role;
      }
      const trimmed = (values.password || '').trim();
      if (trimmed) payload.password = trimmed;
    }
    if (Object.keys(payload).length === 0) {
      setIsEditModalOpen(false);
      return;
    }

    try {
      await api.patch(`/admins/${currentRow.id}`, payload);
      setIsEditModalOpen(false);
      fetchAdmins();
      toast.success('Admin updated successfully');
    } catch (err) {
      const fallback = applyServerErrors(editForm, err, 'Failed to update admin');
      if (fallback) toast.error(fallback);
    }
  };

  const handlePasswordReset = async (row) => {
    if (!isSuperAdmin) return;

    const passwordPrompt = await Swal.fire({
      title: `Set new password for ${row.fullName}?`,
      input: 'password',
      inputPlaceholder: 'Enter new password',
      inputAttributes: { autocapitalize: 'off', autocorrect: 'off' },
      showCancelButton: true,
      confirmButtonText: 'Update password',
      preConfirm: (value) => {
        if (!value || value.length < 8) {
          Swal.showValidationMessage('Password must be at least 8 characters');
          return false;
        }
        return value;
      },
    });

    if (!passwordPrompt.isConfirmed) return;

    try {
      await api.patch(`/admins/${row.id}`, { password: passwordPrompt.value });
      toast.success('Password updated successfully');
    } catch (error) {
      toast.error(typeof error === 'string' ? error : 'Failed to update password');
    }
  };

  const handleDelete = async (id) => {
    if (!isSuperAdmin) {
      toast.error('Only superadmin can delete admins');
      return;
    }

    const result = await Swal.fire({
      title: 'Delete admin account?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/admins/${id}`);
      fetchAdmins();
      toast.success('Admin removed');
    } catch (error) {
      toast.error(typeof error === 'string' ? error : 'Failed to remove admin');
    }
  };

  const inputClass = 'dark:bg-neutral-900 dark:border-neutral-800 dark:text-white mt-1';

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold text-[#1e1b4b] dark:text-white">Admin Management</h1>
          <p className="text-[#64748b] dark:text-slate-400 text-sm mt-1">View, edit, and control admin accounts with role-safe permissions</p>
        </div>
        {isSuperAdmin ? (
          <Button onClick={openAddModal} className="bg-[#6366f1] hover:bg-indigo-600 text-white shadow-sm flex items-center gap-2 px-4 h-10 w-full sm:w-auto justify-center">
            <Plus className="w-4 h-4" /> Add Admin
          </Button>
        ) : null}
      </div>

      <Card className="border-0 shadow-[0_2px_10px_rgba(0,0,0,0.04)] bg-white dark:bg-neutral-950 rounded-2xl overflow-hidden pb-4">
        <CardContent className="p-0">
          <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3">
            <form onSubmit={onSearchSubmit} className="relative w-full lg:w-[340px]">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-[13px] bg-[#f8fafc] dark:bg-neutral-900 border border-transparent dark:border-neutral-800 focus:border-slate-200 dark:focus:border-neutral-700 focus:bg-white dark:focus:bg-neutral-950 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-100 dark:focus:ring-neutral-800 transition-all placeholder:text-slate-400 dark:text-slate-300"
              />
            </form>

            <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap">
              <FilterDropdown options={ROLE_FILTER_OPTIONS} value={filterRole} onChange={setFilterRole} />
              <select
                value={`${sortBy}:${sortOrder}`}
                onChange={(e) => {
                  const [by, order] = e.target.value.split(':');
                  setSortBy(by);
                  setSortOrder(order);
                }}
                className="h-10 px-3 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-slate-700 dark:text-slate-200"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Phone (<md): card stack */}
          <div className="md:hidden px-3 pb-3 space-y-2">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-20 bg-slate-100 dark:bg-neutral-900 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : admins.length === 0 ? (
              <p className="p-6 text-center text-slate-400 dark:text-slate-500 text-sm">No admins match your filter</p>
            ) : admins.map((person) => {
              const badgeClass = person.isActive
                ? 'bg-emerald-100/70 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
                : 'bg-rose-100/70 text-rose-500 dark:bg-rose-900/40 dark:text-rose-400';
              return (
                <div key={person.id} className="rounded-xl border border-slate-100 dark:border-neutral-800 p-3 flex items-center gap-3">
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(person.fullName || 'Admin')}&background=6366f1&color=fff&rounded=true`}
                    alt="avatar"
                    className="w-10 h-10 rounded-full shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{person.fullName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{person.email}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-slate-300 uppercase">{person.role}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${badgeClass}`}>{person.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button onClick={() => openEditModal(person)} className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/40 flex items-center justify-center" aria-label="Edit">
                      <Edit className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                    </button>
                    {isSuperAdmin && (
                      <button onClick={() => handleDelete(person.id)} className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-900/40 flex items-center justify-center" aria-label="Delete">
                        <Trash className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="hidden md:block overflow-x-auto px-2">
            <table className="w-full text-[13px] text-left whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-100 dark:border-neutral-800">
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Name</th>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Email</th>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Role</th>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Joined</th>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Status</th>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-neutral-800/70 text-slate-600 dark:text-slate-300 font-medium">
                {isLoading ? (
                  <TableSkeleton rows={5} cols={6} />
                ) : admins.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-10 text-center text-slate-400 dark:text-slate-500">No admins match your filter</td>
                  </tr>
                ) : admins.map((person) => {
                  const statusText = person.isActive ? 'Active' : 'Inactive';
                  const badgeClass = person.isActive
                    ? 'bg-emerald-100/70 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
                    : 'bg-rose-100/70 text-rose-500 dark:bg-rose-900/40 dark:text-rose-400';

                  return (
                    <tr key={person.id} className="hover:bg-slate-50/80 dark:hover:bg-neutral-900/70 group transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={`https://ui-avatars.com/api/?name=${person.fullName}&background=6366f1&color=fff&rounded=true`}
                            alt="avatar"
                            className="w-9 h-9 rounded-full shadow-sm"
                          />
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{person.fullName}</p>
                            <p className="text-[11px] text-slate-400 font-normal">#{person.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{person.email}</td>
                      <td className="px-5 py-3.5 uppercase">{person.role}</td>
                      <td className="px-5 py-3.5">{formatShortDate(person.createdAt)}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${badgeClass}`}>{statusText}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openViewModal(person)} className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors flex items-center justify-center">
                            <Eye className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                          </button>
                          <button onClick={() => openEditModal(person)} className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors flex items-center justify-center">
                            <Edit className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                          </button>
                          {isSuperAdmin && (
                            <button onClick={() => handlePasswordReset(person)} className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-900/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors flex items-center justify-center">
                              <KeyRound className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                            </button>
                          )}
                          {isSuperAdmin && (
                            <button onClick={() => handleDelete(person.id)} className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-900/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors flex items-center justify-center">
                              <Trash className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!isLoading && total > PAGE_SIZE && (
            <div className="px-5 pt-2 flex items-center justify-between">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Showing {skip + 1}-{Math.min(skip + PAGE_SIZE, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={skip <= 0}
                  onClick={() => fetchAdmins(Math.max(0, skip - PAGE_SIZE))}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-neutral-700 text-xs text-slate-600 dark:text-slate-300 disabled:opacity-40"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </button>
                <span className="text-xs text-slate-500 dark:text-slate-400">{Math.floor(skip / PAGE_SIZE) + 1} / {Math.max(1, Math.ceil(total / PAGE_SIZE))}</span>
                <button
                  type="button"
                  disabled={skip + PAGE_SIZE >= total}
                  onClick={() => fetchAdmins(skip + PAGE_SIZE)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-neutral-700 text-xs text-slate-600 dark:text-slate-300 disabled:opacity-40"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Admin">
        <form onSubmit={addForm.handleSubmit(submitAdd)} noValidate className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
            <Input {...addForm.register('fullName')} className={inputClass} />
            <FieldError error={addForm.formState.errors.fullName} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
            <Input type="email" {...addForm.register('email')} className={inputClass} />
            <FieldError error={addForm.formState.errors.email} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Temporary Password</label>
            <Input type="password" {...addForm.register('password')} className={inputClass} />
            <FieldError error={addForm.formState.errors.password} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Role</label>
            <select
              {...addForm.register('role')}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm dark:bg-neutral-900 dark:border-neutral-800 dark:text-white mt-1"
            >
              <option value="admin">Admin</option>
              <option value="superadmin">Superadmin</option>
            </select>
            <FieldError error={addForm.formState.errors.role} />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActiveAdd"
              className="accent-indigo-500"
              {...addForm.register('isActive')}
            />
            <label htmlFor="isActiveAdd" className="text-sm dark:text-slate-300">Account Active</label>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t dark:border-neutral-800">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={addForm.formState.isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {addForm.formState.isSubmitting ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Admin Details">
        <div className="space-y-3 text-sm">
          <p><span className="font-semibold">Full Name:</span> {currentRow?.fullName || '-'}</p>
          <p><span className="font-semibold">Email:</span> {currentRow?.email || '-'}</p>
          <p><span className="font-semibold">Role:</span> {currentRow?.role || '-'}</p>
          <p><span className="font-semibold">Status:</span> {currentRow?.isActive ? 'Active' : 'Inactive'}</p>
          <p><span className="font-semibold">Joined:</span> {formatShortDate(currentRow?.createdAt)}</p>
          <p className="text-xs text-slate-500">Password is hidden for security and cannot be viewed.</p>
        </div>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Admin">
        <form onSubmit={editForm.handleSubmit(submitEdit)} noValidate className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
            <Input {...editForm.register('fullName')} className={inputClass} />
            <FieldError error={editForm.formState.errors.fullName} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
            <Input type="email" {...editForm.register('email')} className={inputClass} />
            <FieldError error={editForm.formState.errors.email} />
          </div>
          {isSuperAdmin && (
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Role</label>
              <select
                {...editForm.register('role')}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm dark:bg-neutral-900 dark:border-neutral-800 dark:text-white mt-1"
              >
                <option value="admin">Admin</option>
                <option value="superadmin">Superadmin</option>
              </select>
              <FieldError error={editForm.formState.errors.role} />
            </div>
          )}
          {isSuperAdmin && (
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Set New Password (Optional)</label>
              <Input
                type="password"
                placeholder="Leave blank to keep current"
                className={inputClass}
                {...editForm.register('password')}
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActiveEdit"
              className="accent-indigo-500"
              {...editForm.register('isActive')}
            />
            <label htmlFor="isActiveEdit" className="text-sm dark:text-slate-300">Account Active</label>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t dark:border-neutral-800">
            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={editForm.formState.isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {editForm.formState.isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
