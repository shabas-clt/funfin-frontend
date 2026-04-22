import { useState, useEffect, useMemo } from 'react';
import { Search, Trash, Eye, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { TableSkeleton } from '@/components/ui/skeleton';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { Modal } from '@/components/ui/modal';
import { api } from '@/api/axios';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { formatShortDate } from '@/lib/format';

const FILTER_OPTIONS = ['All', 'user', 'mentor'];
const PAGE_SIZE = 12;
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'name-asc', label: 'Name A-Z' },
  { value: 'name-desc', label: 'Name Z-A' },
];

const primaryRole = (roles) => {
  if (!Array.isArray(roles) || roles.length === 0) return 'user';
  return String(roles[0]).toLowerCase();
};

export default function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/students');
      setStudents(res.students || []);
    } catch {
      setStudents([]);
      toast.error('Failed to load students');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const filtered = useMemo(() => {
    const rows = students.filter((student) => {
      const role = primaryRole(student.roles);
      const matchesRole = !filterRole || role === filterRole;
      const fullName = student.fullName || '';
      const email = student.email || '';
      const q = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery
        || fullName.toLowerCase().includes(q)
        || email.toLowerCase().includes(q);
      return matchesRole && matchesSearch;
    });

    rows.sort((a, b) => {
      if (sortBy === 'name-asc') return (a.fullName || '').localeCompare(b.fullName || '');
      if (sortBy === 'name-desc') return (b.fullName || '').localeCompare(a.fullName || '');
      const ad = new Date(a.createdAt || 0).getTime();
      const bd = new Date(b.createdAt || 0).getTime();
      return sortBy === 'oldest' ? ad - bd : bd - ad;
    });

    return rows;
  }, [students, filterRole, searchQuery, sortBy]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paged = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, filterRole, sortBy]);

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Remove student?',
      text: 'This will permanently remove the student account.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, remove',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/students/${id}`);
      fetchStudents();
      toast.success('Student removed');
    } catch (error) {
      toast.error(typeof error === 'string' ? error : 'Failed to remove student');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold text-[#1e1b4b] dark:text-white">Students</h1>
          <p className="text-[#64748b] dark:text-slate-400 text-sm mt-1">
            Student accounts are created through client-side signup. Admins can review, inspect, and remove them here.
          </p>
        </div>
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
              <FilterDropdown options={FILTER_OPTIONS} value={filterRole} onChange={setFilterRole} />
              <div className="relative">
                <ArrowUpDown className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-9 pl-8 pr-3 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-slate-700 dark:text-slate-200"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="md:hidden px-3 pb-3 space-y-2">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-20 bg-slate-100 dark:bg-neutral-900 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : paged.length === 0 ? (
              <p className="p-6 text-center text-slate-400 dark:text-slate-500 text-sm">No students found</p>
            ) : paged.map((student) => {
              const role = primaryRole(student.roles);
              const roleClass = role === 'mentor'
                ? 'bg-indigo-100/70 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400'
                : 'bg-emerald-100/70 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400';
              return (
                <div
                  key={student.id}
                  className="rounded-xl border border-slate-100 dark:border-neutral-800 p-3 flex items-center gap-3"
                >
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(student.fullName || 'User')}&background=6366f1&color=fff&rounded=true`}
                    alt="avatar"
                    className="w-10 h-10 rounded-full shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {student.fullName || 'Unknown User'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{student.email || '-'}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${roleClass}`}>{role}</span>
                      <span className="text-[10px] text-slate-400">{formatShortDate(student.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setSelectedStudent(student)}
                      className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center"
                      aria-label="View"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                    </button>
                    <button
                      onClick={() => handleDelete(student.id)}
                      className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-900/40 flex items-center justify-center"
                      aria-label="Delete"
                    >
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
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400 hidden lg:table-cell">Country</th>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Role</th>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400 hidden lg:table-cell">Joined</th>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-neutral-800/70 text-slate-600 dark:text-slate-300 font-medium">
                {isLoading ? (
                  <TableSkeleton rows={6} cols={6} />
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-10 text-center text-slate-400 dark:text-slate-500">No students found</td>
                  </tr>
                ) : paged.map((student) => {
                  const role = primaryRole(student.roles);
                  const roleClass = role === 'mentor'
                    ? 'bg-indigo-100/70 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400'
                    : 'bg-emerald-100/70 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400';

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 dark:hover:bg-neutral-900/70 group transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(student.fullName || 'User')}&background=6366f1&color=fff&rounded=true`}
                            alt="avatar"
                            className="w-9 h-9 rounded-full shadow-sm"
                          />
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{student.fullName || 'Unknown User'}</p>
                            <p className="text-[11px] text-slate-400 font-normal">#{student.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{student.email || '-'}</td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">{student.country || '-'}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${roleClass}`}>{role}</span>
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">{formatShortDate(student.createdAt)}</td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedStudent(student)}
                            className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors flex items-center justify-center"
                            aria-label="View"
                          >
                            <Eye className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                          </button>
                          <button
                            onClick={() => handleDelete(student.id)}
                            className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-900/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors flex items-center justify-center"
                            aria-label="Delete"
                          >
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

      <Modal isOpen={Boolean(selectedStudent)} onClose={() => setSelectedStudent(null)} title="Student Details">
        <div className="space-y-2 text-sm">
          <p><span className="font-semibold">Full Name:</span> {selectedStudent?.fullName || '-'}</p>
          <p><span className="font-semibold">Email:</span> {selectedStudent?.email || '-'}</p>
          <p><span className="font-semibold">Phone:</span> {selectedStudent?.phone || '-'}</p>
          <p><span className="font-semibold">Country:</span> {selectedStudent?.country || '-'}</p>
          <p><span className="font-semibold">Role:</span> {primaryRole(selectedStudent?.roles)}</p>
          <p><span className="font-semibold">Joined:</span> {formatShortDate(selectedStudent?.createdAt)}</p>
          <p><span className="font-semibold">User ID:</span> <span className="font-mono text-xs">{selectedStudent?.id || '-'}</span></p>
        </div>
      </Modal>
    </div>
  );
}
