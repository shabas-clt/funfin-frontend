import { useState, useEffect, useMemo } from 'react';
import { Search, Edit, Trash, Eye, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TableSkeleton } from '@/components/ui/skeleton';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { api } from '@/api/axios';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const MOCK_STUDENTS = [
  { id: 101, name: 'Alice Johnson',    email: 'alice.j@example.com',  enrolledAt: '12 Oct, 2025', completion: '75%', status: 'Active' },
  { id: 102, name: 'Mark Peterson',   email: 'mark.p@example.com',   enrolledAt: '05 Nov, 2025', completion: '20%', status: 'Suspend' },
  { id: 103, name: 'Samantha Lee',    email: 'sam.lee@example.com',  enrolledAt: '14 Jan, 2026', completion: '45%', status: 'Active' },
  { id: 104, name: 'Rahul Verma',     email: 'rahul.v@example.com',  enrolledAt: '28 Feb, 2026', completion: '10%', status: 'Pending' },
  { id: 105, name: 'Fatima Ahmed',    email: 'fatima.a@example.com', enrolledAt: '03 Mar, 2026', completion: '60%', status: 'Active' },
  { id: 106, name: 'David Chen',      email: 'david.c@example.com',  enrolledAt: '19 Mar, 2026', completion: '5%',  status: 'Pending' },
];

const FILTER_OPTIONS = ['All', 'Active', 'Suspend', 'Pending'];

export default function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [dateRange, setDateRange] = useState(undefined);

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/students');
      setStudents(res.students || []);
    } catch {
      setStudents(MOCK_STUDENTS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchStudents(); }, []);

  const filtered = useMemo(() => {
    return students.filter(s => {
      const matchesStatus = !filterStatus || s.status === filterStatus;
      const matchesSearch = !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.email.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [students, filterStatus, searchQuery]);

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Remove student?',
      text: 'This will permanently remove the student.',
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
    } catch {
      toast.error('Failed to remove student');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold text-[#1e1b4b] dark:text-white">Students</h1>
          <p className="text-[#64748b] dark:text-slate-400 text-sm mt-1">Manage enrolled students</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 px-4 shadow-sm h-10">
            <Download className="w-4 h-4" /> Export
          </Button>
          <Button
            onClick={() => toast.info('Add student form coming soon')}
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
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-[13px] bg-[#f8fafc] dark:bg-slate-900 border border-transparent dark:border-slate-700 focus:border-slate-200 dark:focus:border-slate-600 focus:bg-white dark:focus:bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-100 dark:focus:ring-slate-700 transition-all placeholder:text-slate-400 dark:text-slate-300"
              />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <FilterDropdown options={FILTER_OPTIONS} value={filterStatus} onChange={setFilterStatus} />
              <DateRangePicker value={dateRange} onChange={setDateRange} />
            </div>
          </div>

          <div className="overflow-x-auto px-2">
            <table className="w-full text-[13px] text-left whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Name</th>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Email</th>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Joined</th>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Progress</th>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Status</th>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50 text-slate-600 dark:text-slate-300 font-medium">
                {isLoading ? (
                  <TableSkeleton rows={6} cols={6} />
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-10 text-center text-slate-400 dark:text-slate-500">No students match your filter</td>
                  </tr>
                ) : filtered.map((student) => {
                  const badgeClass =
                    student.status === 'Active'  ? 'bg-emerald-100/70 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400' :
                    student.status === 'Suspend' ? 'bg-rose-100/70 text-rose-500 dark:bg-rose-900/40 dark:text-rose-400' :
                                                   'bg-amber-100/70 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400';

                  const completionNum = parseInt(student.completion, 10);
                  const barColor = completionNum >= 60 ? 'bg-indigo-500' : completionNum >= 30 ? 'bg-amber-400' : 'bg-rose-400';

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 group transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={`https://ui-avatars.com/api/?name=${student.name}&background=6366f1&color=fff&rounded=true`}
                            alt="avatar"
                            className="w-9 h-9 rounded-full shadow-sm"
                          />
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{student.name}</p>
                            <p className="text-[11px] text-slate-400 font-normal">#stu{student.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{student.email}</td>
                      <td className="px-5 py-3.5">{student.enrolledAt}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className={`h-full ${barColor} rounded-full`} style={{ width: student.completion }} />
                          </div>
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{student.completion}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${badgeClass}`}>{student.status}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors flex items-center justify-center">
                            <Eye className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                          </button>
                          <button className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors flex items-center justify-center">
                            <Edit className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
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
