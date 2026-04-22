import { useState, useEffect, useMemo } from 'react';
import { Search, Edit, Trash, Eye, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
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
import { mentorCreateSchema, mentorUpdateSchema } from '@/lib/validation/schemas';
import { applyServerErrors } from '@/lib/validation/serverErrors';
import { formatShortDate } from '@/lib/format';
import FieldError from '@/components/shared/FieldError';

const STATUS_FILTER_OPTIONS = ['All', 'Active', 'Inactive'];

const ADD_DEFAULTS = { fullName: '', email: '', password: '', isActive: true };
const EDIT_DEFAULTS = { fullName: '', email: '', password: '', isActive: true };
const PAGE_SIZE = 12;

export default function MentorManagement() {
  const [mentors, setMentors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState(null);

  const addForm = useForm({
    resolver: yupResolver(mentorCreateSchema),
    mode: 'onChange',
    defaultValues: ADD_DEFAULTS,
  });
  const editForm = useForm({
    resolver: yupResolver(mentorUpdateSchema),
    mode: 'onChange',
    defaultValues: EDIT_DEFAULTS,
  });

  const fetchMentors = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/admins', { params: { role: 'mentor', limit: 200 } });
      setMentors(res.admins || []);
    } catch {
      setMentors([]);
      toast.error('Failed to load mentors');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMentors();
  }, []);

  const filtered = useMemo(() => {
    return mentors.filter((mentor) => {
      const statusText = mentor.isActive ? 'Active' : 'Inactive';
      const matchesStatus = !filterStatus || statusText === filterStatus;
      const query = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery
        || (mentor.fullName || '').toLowerCase().includes(query)
        || (mentor.email || '').toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [mentors, filterStatus, searchQuery]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paged = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, filterStatus]);

  const openAddModal = () => {
    addForm.reset(ADD_DEFAULTS);
    setIsAddModalOpen(true);
  };

  const openEditModal = (mentor) => {
    setCurrentRow(mentor);
    editForm.reset({
      fullName: mentor.fullName || '',
      email: mentor.email || '',
      password: '',
      isActive: Boolean(mentor.isActive),
    });
    setIsEditModalOpen(true);
  };

  const openViewModal = (mentor) => {
    setCurrentRow(mentor);
    setIsViewModalOpen(true);
  };

  const submitAdd = async (values) => {
    const confirm = await Swal.fire({
      title: 'Add new mentor?',
      text: 'This creates a mentor panel account.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      confirmButtonText: 'Create',
    });
    if (!confirm.isConfirmed) return;

    try {
      await api.post('/admins', { ...values, role: 'mentor' });
      setIsAddModalOpen(false);
      fetchMentors();
      toast.success('Mentor created successfully');
    } catch (err) {
      const fallback = applyServerErrors(addForm, err, 'Failed to create mentor');
      if (fallback) toast.error(fallback);
    }
  };

  const submitEdit = async (values) => {
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
    const trimmed = (values.password || '').trim();
    if (trimmed) payload.password = trimmed;

    if (Object.keys(payload).length === 0) {
      setIsEditModalOpen(false);
      return;
    }

    try {
      await api.patch(`/admins/${currentRow.id}`, payload);
      setIsEditModalOpen(false);
      fetchMentors();
      toast.success('Mentor updated successfully');
    } catch (err) {
      const fallback = applyServerErrors(editForm, err, 'Failed to update mentor');
      if (fallback) toast.error(fallback);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete mentor account?',
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
      fetchMentors();
      toast.success('Mentor removed');
    } catch (error) {
      toast.error(typeof error === 'string' ? error : 'Failed to remove mentor');
    }
  };

  const inputClass = 'dark:bg-neutral-900 dark:border-neutral-800 dark:text-white mt-1';

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold text-[#1e1b4b] dark:text-white">Mentor Management</h1>
          <p className="text-[#64748b] dark:text-slate-400 text-sm mt-1">Admins and superadmins can add, edit, view, and delete mentor accounts</p>
        </div>
        <Button onClick={openAddModal} className="bg-[#6366f1] hover:bg-indigo-600 text-white shadow-sm flex items-center gap-2 px-4 h-10 w-full sm:w-auto justify-center">
          <Plus className="w-4 h-4" /> Add Mentor
        </Button>
      </div>

      <Card className="border-0 shadow-[0_2px_10px_rgba(0,0,0,0.04)] bg-white dark:bg-neutral-950 rounded-2xl overflow-hidden pb-4">
        <CardContent className="p-0">
          <div className="p-4 sm:p-5 flex flex-col md:flex-row md:justify-between md:items-center gap-3">
            <div className="relative w-full md:w-[340px]">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-[13px] bg-[#f8fafc] dark:bg-neutral-900 border border-transparent dark:border-neutral-800 focus:border-slate-200 dark:focus:border-neutral-700 focus:bg-white dark:focus:bg-neutral-950 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-100 dark:focus:ring-neutral-800 transition-all placeholder:text-slate-400 dark:text-slate-300"
              />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <FilterDropdown options={STATUS_FILTER_OPTIONS} value={filterStatus} onChange={setFilterStatus} />
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
            ) : paged.length === 0 ? (
              <p className="p-6 text-center text-slate-400 dark:text-slate-500 text-sm">No mentors found</p>
            ) : paged.map((person) => {
              const badgeClass = person.isActive
                ? 'bg-emerald-100/70 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
                : 'bg-rose-100/70 text-rose-500 dark:bg-rose-900/40 dark:text-rose-400';
              return (
                <div key={person.id} className="rounded-xl border border-slate-100 dark:border-neutral-800 p-3 flex items-center gap-3">
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(person.fullName || 'Mentor')}&background=6366f1&color=fff&rounded=true`}
                    alt="avatar"
                    className="w-10 h-10 rounded-full shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{person.fullName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{person.email}</p>
                    <div className="mt-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${badgeClass}`}>{person.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <button onClick={() => openEditModal(person)} className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/40 flex items-center justify-center" aria-label="Edit">
                      <Edit className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                    </button>
                    <button onClick={() => handleDelete(person.id)} className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-900/40 flex items-center justify-center" aria-label="Delete">
                      <Trash className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                    </button>
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
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Joined</th>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Status</th>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-neutral-800/70 text-slate-600 dark:text-slate-300 font-medium">
                {isLoading ? (
                  <TableSkeleton rows={5} cols={5} />
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-10 text-center text-slate-400 dark:text-slate-500">No mentors found</td>
                  </tr>
                ) : paged.map((person) => {
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
                          <button onClick={() => handleDelete(person.id)} className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-900/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors flex items-center justify-center">
                            <Trash className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!isLoading && filtered.length > PAGE_SIZE && (
            <div className="px-5 pt-2 flex items-center justify-between">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-neutral-700 text-xs text-slate-600 dark:text-slate-300 disabled:opacity-40"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </button>
                <span className="text-xs text-slate-500 dark:text-slate-400">{currentPage} / {pageCount}</span>
                <button
                  type="button"
                  disabled={currentPage >= pageCount}
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-neutral-700 text-xs text-slate-600 dark:text-slate-300 disabled:opacity-40"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Mentor">
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
          <div className="flex items-center gap-2">
            <input type="checkbox" id="mentorIsActiveAdd" className="accent-indigo-500" {...addForm.register('isActive')} />
            <label htmlFor="mentorIsActiveAdd" className="text-sm dark:text-slate-300">Account Active</label>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t dark:border-neutral-800">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={addForm.formState.isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {addForm.formState.isSubmitting ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Mentor Details">
        <div className="space-y-3 text-sm">
          <p><span className="font-semibold">Full Name:</span> {currentRow?.fullName || '-'}</p>
          <p><span className="font-semibold">Email:</span> {currentRow?.email || '-'}</p>
          <p><span className="font-semibold">Status:</span> {currentRow?.isActive ? 'Active' : 'Inactive'}</p>
          <p><span className="font-semibold">Joined:</span> {formatShortDate(currentRow?.createdAt)}</p>
          <p className="text-xs text-slate-500">Password is hidden for security and cannot be viewed.</p>
        </div>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Mentor">
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
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Set New Password (Optional)</label>
            <Input type="password" placeholder="Leave blank to keep current" className={inputClass} {...editForm.register('password')} />
            <FieldError error={editForm.formState.errors.password} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="mentorIsActiveEdit" className="accent-indigo-500" {...editForm.register('isActive')} />
            <label htmlFor="mentorIsActiveEdit" className="text-sm dark:text-slate-300">Account Active</label>
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
