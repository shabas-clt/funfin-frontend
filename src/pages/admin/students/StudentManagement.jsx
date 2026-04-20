import { useState, useEffect, useMemo } from 'react';
import { Search, Trash, Eye, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TableSkeleton } from '@/components/ui/skeleton';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { api } from '@/api/axios';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const FILTER_OPTIONS = ['All', 'user', 'mentor'];

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const primaryRole = (roles) => {
  if (!Array.isArray(roles) || roles.length === 0) return 'user';
  return String(roles[0]).toLowerCase();
};

export default function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [dateRange, setDateRange] = useState(undefined);

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

  useEffect(() => { fetchStudents(); }, []);

  const filtered = useMemo(() => {
    return students.filter((student) => {
      const role = primaryRole(student.roles);
      const matchesRole = !filterRole || role === filterRole;
      const fullName = student.fullName || '';
      const email = student.email || '';
      const matchesSearch = !searchQuery
        || fullName.toLowerCase().includes(searchQuery.toLowerCase())
        || email.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesRole && matchesSearch;
    });
  }, [students, filterRole, searchQuery]);

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
      toast.error(error?.detail || 'Failed to remove student');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold text-[#1e1b4b] dark:text-white">Students</h1>
          <p className="text-[#64748b] dark:text-slate-400 text-sm mt-1">Manage student accounts from backend</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 px-4 shadow-sm h-10">
            <Download className="w-4 h-4" /> Export
          </Button>
          <Button
            onClick={() => toast.info('Student creation is managed from client signup APIs')}
            className="bg-[#6366f1] hover:bg-indigo-600 text-white shadow-sm flex items-center gap-2 px-4 h-10"
          >
            + Add Student
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-[0_2px_10px_rgba(0,0,0,0.04)] bg-white dark:bg-slate-800 rounded-2xl overflow-hidden pb-4">
        <CardContent className="p-0">
          <div className="p-5 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:w-[340px]">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-[13px] bg-[#f8fafc] dark:bg-slate-900 border border-transparent dark:border-slate-700 focus:border-slate-200 dark:focus:border-slate-600 focus:bg-white dark:focus:bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-100 dark:focus:ring-slate-700 transition-all placeholder:text-slate-400 dark:text-slate-300"
              />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <FilterDropdown options={FILTER_OPTIONS} value={filterRole} onChange={setFilterRole} />
              <DateRangePicker value={dateRange} onChange={setDateRange} />
            </div>
          </div>

          <div className="overflow-x-auto px-2">
            <table className="w-full text-[13px] text-left whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Name</th>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Email</th>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Country</th>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Role</th>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Joined</th>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50 text-slate-600 dark:text-slate-300 font-medium">
                {isLoading ? (
                  <TableSkeleton rows={6} cols={6} />
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-10 text-center text-slate-400 dark:text-slate-500">No students found</td>
                  </tr>
                ) : filtered.map((student) => {
                  const role = primaryRole(student.roles);
                  const roleClass = role === 'mentor'
                    ? 'bg-indigo-100/70 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400'
                    : 'bg-emerald-100/70 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400';

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 group transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={`https://ui-avatars.com/api/?name=${student.fullName || 'User'}&background=6366f1&color=fff&rounded=true`}
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
                      <td className="px-5 py-3.5">{student.country || '-'}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${roleClass}`}>{role}</span>
                      </td>
                      <td className="px-5 py-3.5">{formatDate(student.createdAt)}</td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors flex items-center justify-center">
                            <Eye className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                          </button>
                          <button onClick={() => handleDelete(student.id)} className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-900/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors flex items-center justify-center">
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
        </CardContent>
      </Card>
    </div>
  );
}
