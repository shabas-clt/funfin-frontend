import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Edit, Trash, Eye, Send, Archive, BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TableSkeleton } from '@/components/ui/skeleton';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { api } from '@/api/axios';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { formatShortDate, formatInr } from '@/lib/format';

const FILTER_OPTIONS = ['All', 'published', 'draft'];
const PAGE_SIZE = 12;

const stateBadgeClass = (state) => {
  if (state === 'published') return 'bg-emerald-100/70 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400';
  return 'bg-amber-100/70 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400';
};

const normalizeState = (course) => {
  if (course.state) return course.state;
  // Legacy courses may not have `state` yet; fall back to the boolean flag.
  return course.isPublished ? 'published' : 'draft';
};

export default function CourseList() {
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith('/mentor') ? '/mentor' : '/admin';
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState('');
  const [skip, setSkip] = useState(0);
  const [total, setTotal] = useState(0);

  const fetchCourses = async (nextSkip = skip) => {
    try {
      setIsLoading(true);
      const params = { limit: PAGE_SIZE, skip: nextSkip };
      if (filterState) params.state = filterState;
      if (searchQuery.trim()) params.q = searchQuery.trim();
      const res = await api.get('/courses', { params });
      setCourses(res.courses || []);
      setTotal(res.total || 0);
      setSkip(nextSkip);
    } catch {
      setCourses([]);
      setTotal(0);
      toast.error('Failed to load courses');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses(0);
  }, [filterState, searchQuery]);

  const onSearch = (event) => {
    event.preventDefault();
    fetchCourses(0);
  };

  const handleDelete = async (course) => {
    const result = await Swal.fire({
      title: `Delete "${course.title}"?`,
      text: 'This removes the course, all its modules, and videos. This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Delete',
    });
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/courses/${course.id}`);
      toast.success('Course deleted');
      fetchCourses();
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to delete course');
    }
  };

  const handlePublishToggle = async (course) => {
    const isPublished = normalizeState(course) === 'published';
    const target = isPublished ? 'unpublish' : 'publish';
    const confirm = await Swal.fire({
      title: `${isPublished ? 'Unpublish' : 'Publish'} "${course.title}"?`,
      text: isPublished
        ? 'Students will no longer see this course.'
        : 'Students will be able to see and purchase this course.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: isPublished ? 'Unpublish' : 'Publish',
      confirmButtonColor: isPublished ? '#f59e0b' : '#10b981',
    });
    if (!confirm.isConfirmed) return;
    try {
      await api.post(`/courses/${course.id}/${target}`);
      toast.success(isPublished ? 'Course moved to draft' : 'Course published');
      fetchCourses();
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to update state');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold text-[#1e1b4b] dark:text-white">Courses</h1>
          <p className="text-[#64748b] dark:text-slate-400 text-sm mt-1">Create, publish, and manage course catalogue</p>
        </div>
        <Button
          onClick={() => navigate(`${basePath}/courses/new`)}
          className="bg-[#6366f1] hover:bg-indigo-600 text-white shadow-sm flex items-center gap-2 px-4 h-10 w-full sm:w-auto justify-center"
        >
          + New Course
        </Button>
      </div>

      <Card className="border-0 shadow-[0_2px_10px_rgba(0,0,0,0.04)] bg-white dark:bg-neutral-950 rounded-2xl overflow-hidden pb-4">
        <CardContent className="p-0">
          <div className="p-4 sm:p-5 flex flex-col md:flex-row md:justify-between md:items-center gap-3">
            <form onSubmit={onSearch} className="relative w-full md:w-[340px]">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-[13px] bg-[#f8fafc] dark:bg-neutral-900 border border-transparent dark:border-neutral-800 focus:border-slate-200 dark:focus:border-neutral-700 focus:bg-white dark:focus:bg-neutral-950 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-100 dark:focus:ring-neutral-800 transition-all placeholder:text-slate-400 dark:text-slate-300"
              />
            </form>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <FilterDropdown options={FILTER_OPTIONS} value={filterState} onChange={setFilterState} />
            </div>
          </div>

          {/* Phone (<md): card stack */}
          <div className="md:hidden px-3 pb-3 space-y-2">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-24 bg-slate-100 dark:bg-neutral-900 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : courses.length === 0 ? (
              <p className="p-6 text-center text-slate-400 dark:text-slate-500 text-sm">No courses found</p>
            ) : courses.map((course) => {
              const state = normalizeState(course);
              return (
                <div key={course.id} className="rounded-xl border border-slate-100 dark:border-neutral-800 p-3 flex gap-3">
                  <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-slate-100 dark:bg-neutral-900">
                    {course.photo ? <img src={course.photo} alt="" className="w-full h-full object-cover" /> : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{course.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatInr(course.priceInr)} · {course.moduleCount ?? course.totalModules ?? 0} mods · {course.videoCount ?? 0} videos
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${stateBadgeClass(state)}`}>{state}</span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => navigate(`${basePath}/courses/${course.id}/edit`)} className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/40 flex items-center justify-center" aria-label="Edit">
                          <Edit className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                        </button>
                        <button onClick={() => navigate(`${basePath}/courses/${course.id}/progress`)} className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-900/40 flex items-center justify-center" aria-label="Progress">
                          <BarChart3 className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
                        </button>
                        <button onClick={() => handleDelete(course)} className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-900/40 flex items-center justify-center" aria-label="Delete">
                          <Trash className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tablet+: table */}
          <div className="hidden md:block overflow-x-auto px-2">
            <table className="w-full text-[13px] text-left whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-100 dark:border-neutral-800">
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Course</th>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400 hidden lg:table-cell">Created</th>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Price</th>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Content</th>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">State</th>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-neutral-800/70 text-slate-600 dark:text-slate-300 font-medium">
                {isLoading ? (
                  <TableSkeleton rows={6} cols={6} />
                ) : courses.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-10 text-center text-slate-400 dark:text-slate-500">No courses match your filter</td>
                  </tr>
                ) : courses.map((course) => {
                  const state = normalizeState(course);
                  const isPublished = state === 'published';
                  return (
                    <tr key={course.id} className="hover:bg-slate-50/80 dark:hover:bg-neutral-900/70 group transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden shadow-sm shrink-0 bg-slate-100 dark:bg-neutral-900">
                            {course.photo ? <img src={course.photo} alt="course" className="w-full h-full object-cover" /> : null}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{course.title}</p>
                            <p className="text-[11px] text-slate-400 font-normal">#{course.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">{formatShortDate(course.createdAt)}</td>
                      <td className="px-5 py-3.5 text-slate-900 dark:text-white font-semibold">{formatInr(course.priceInr)}</td>
                      <td className="px-5 py-3.5">
                        {course.moduleCount ?? course.totalModules ?? 0} mods · {course.videoCount ?? 0} videos
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${stateBadgeClass(state)}`}>{state}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => navigate(`${basePath}/courses/${course.id}/edit`)} className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors flex items-center justify-center" aria-label="View/Edit">
                            <Eye className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                          </button>
                          <button onClick={() => navigate(`${basePath}/courses/${course.id}/progress`)} className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-900/40 hover:bg-sky-100 dark:hover:bg-sky-900/60 transition-colors flex items-center justify-center" aria-label="Progress">
                            <BarChart3 className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
                          </button>
                          <button
                            onClick={() => handlePublishToggle(course)}
                            className={`w-7 h-7 rounded-lg transition-colors flex items-center justify-center ${
                              isPublished
                                ? 'bg-amber-50 dark:bg-amber-900/40 hover:bg-amber-100 dark:hover:bg-amber-900/60'
                                : 'bg-emerald-50 dark:bg-emerald-900/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                            }`}
                            aria-label={isPublished ? 'Unpublish' : 'Publish'}
                          >
                            {isPublished
                              ? <Archive className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                              : <Send className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />}
                          </button>
                          <button onClick={() => handleDelete(course)} className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-900/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors flex items-center justify-center" aria-label="Delete">
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
          {!isLoading && total > PAGE_SIZE && (
            <div className="px-5 pt-2 flex items-center justify-between">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Showing {skip + 1}-{Math.min(skip + PAGE_SIZE, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={skip <= 0}
                  onClick={() => fetchCourses(Math.max(0, skip - PAGE_SIZE))}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-neutral-700 text-xs text-slate-600 dark:text-slate-300 disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="text-xs text-slate-500 dark:text-slate-400">{Math.floor(skip / PAGE_SIZE) + 1} / {Math.max(1, Math.ceil(total / PAGE_SIZE))}</span>
                <button
                  type="button"
                  disabled={skip + PAGE_SIZE >= total}
                  onClick={() => fetchCourses(skip + PAGE_SIZE)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-neutral-700 text-xs text-slate-600 dark:text-slate-300 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
