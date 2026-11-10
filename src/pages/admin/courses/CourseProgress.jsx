import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Loader2, Users, Trophy, TrendingUp, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/api/axios';
import { toast } from 'react-toastify';
import { formatNumber, formatShortDateTime } from '@/lib/format';
import { useCachedState, hasCached, useLatestRequest } from '@/lib/pageCache';

const PAGE_SIZE = 25;

function Metric({ icon: Icon, label, value, accent }) {
  return (
    <Card className="bg-white dark:bg-black border border-slate-100 dark:border-neutral-800">
      <CardContent className="p-4 flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${accent}`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
          <div className="text-lg font-semibold text-slate-900 dark:text-white">
            {value}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProgressBar({ pct }) {
  const clamped = Math.max(0, Math.min(100, Number(pct) || 0));
  return (
    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-neutral-800 overflow-hidden">
      <div
        className="h-2 rounded-full bg-indigo-500"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export default function CourseProgress() {
  const { id } = useParams();
  const location = useLocation();
  const basePath = location.pathname.startsWith('/mentor') ? '/mentor' : '/admin';
  // Cached per course so reopening this page shows the last numbers and
  // learner page at once while they refresh in the background.
  const [course, setCourse] = useCachedState(`course-progress:${id}:course`, null);
  const [summary, setSummary] = useCachedState(`course-progress:${id}:summary`, null);
  const [users, setUsers] = useCachedState(`course-progress:${id}:users`, []);
  const [total, setTotal] = useCachedState(`course-progress:${id}:total`, 0);
  const [skip, setSkip] = useCachedState(`course-progress:${id}:skip`, 0);
  const [loading, setLoading] = useState(true);
  const showSkeleton = loading && !hasCached(`course-progress:${id}:users`);
  const isRefreshing = loading && !showSkeleton;
  // Stable functions; a slower response for an older learner page is dropped.
  const { begin, isLatest } = useLatestRequest();
  // The course the shown page belongs to, and the page restored on open.
  const pageCourseId = useRef(id);
  const restoredSkip = useRef(skip);

  const loadCourse = useCallback(async () => {
    try {
      const res = await api.get(`/courses/${id}`);
      setCourse(res.course || res);
    } catch {
      toast.error('Failed to load course');
    }
  }, [id, setCourse]);

  const loadSummary = useCallback(async () => {
    try {
      const res = await api.get(`/courses/${id}/progress-summary`);
      setSummary(res);
    } catch (err) {
      if (err?.status !== 404) toast.error('Failed to load progress summary');
    }
  }, [id, setSummary]);

  const loadUsers = useCallback(
    async (nextSkip = 0) => {
      const reqId = begin();
      try {
        setLoading(true);
        const res = await api.get(`/courses/${id}/progress-users`, {
          params: { skip: nextSkip, limit: PAGE_SIZE },
        });
        if (!isLatest(reqId)) return;
        setUsers(res.users || []);
        setTotal(res.total || 0);
        setSkip(nextSkip);
      } catch {
        if (!isLatest(reqId)) return;
        toast.error('Failed to load learners');
      } finally {
        if (isLatest(reqId)) setLoading(false);
      }
    },
    [id, begin, isLatest, setUsers, setTotal, setSkip],
  );

  useEffect(() => {
    loadCourse();
    loadSummary();
    // On open, refresh the learner page the admin was on; another course
    // starts on the first page.
    const keepPage = pageCourseId.current === id;
    pageCourseId.current = id;
    loadUsers(keepPage ? restoredSkip.current : 0);
  }, [loadCourse, loadSummary, loadUsers, id]);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link
          to={`${basePath}/courses`}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <ArrowLeft className="w-4 h-4" /> Back to courses
        </Link>
      </div>

      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-slate-900 dark:text-white">
          {course?.title || 'Course progress'}
        </h1>
        {course && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {course.moduleCount ?? 0} modules · {course.videoCount ?? 0} videos ·{' '}
            <span className="capitalize">{course.state}</span>
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Metric
          icon={Users}
          label="Learners with progress"
          value={summary ? formatNumber(summary.distinctUsers) : '—'}
          accent="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400"
        />
        <Metric
          icon={Trophy}
          label="Finished the course"
          value={summary ? formatNumber(summary.usersFinished) : '—'}
          accent="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
        />
        <Metric
          icon={TrendingUp}
          label="Average progress"
          value={summary ? `${summary.averageProgressPct}%` : '—'}
          accent="bg-amber-50 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400"
        />
        <Metric
          icon={BookOpen}
          label="Total topics"
          value={summary ? formatNumber(summary.totalTopics) : '—'}
          accent="bg-sky-50 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400"
        />
      </div>

      <Card className="bg-white dark:bg-black border border-slate-100 dark:border-neutral-800">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Learners <span className="text-xs text-slate-500">({total})</span>
            </h3>
          </div>

          <div className="overflow-x-auto -mx-4">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 dark:bg-neutral-900 text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-2.5 font-medium">User</th>
                  <th className="px-4 py-2.5 font-medium">Topics</th>
                  <th className="px-4 py-2.5 font-medium w-1/3">Progress</th>
                  <th className="px-4 py-2.5 font-medium">Avg video %</th>
                  <th className="px-4 py-2.5 font-medium">Last activity</th>
                </tr>
              </thead>
              <tbody className={`divide-y divide-slate-100 dark:divide-neutral-800 transition-opacity ${isRefreshing ? 'opacity-60' : ''}`}>
                {showSkeleton && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500 text-sm">
                      <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading…
                    </td>
                  </tr>
                )}
                {!showSkeleton && users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500 text-sm">
                      No one has made progress yet.
                    </td>
                  </tr>
                )}
                {!showSkeleton &&
                  users.map((row) => (
                    <tr key={row.userId} className="hover:bg-slate-50 dark:hover:bg-neutral-900/60">
                      <td className="px-4 py-2.5">
                        <div className="text-slate-900 dark:text-white">
                          {row.userName || '—'}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {row.userEmail || row.userId}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-slate-900 dark:text-white whitespace-nowrap">
                        {row.completedTopics} / {row.totalTopics}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <ProgressBar pct={row.progressPct} />
                          <span className="text-xs text-slate-500 w-10 text-right">
                            {row.progressPct}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">
                        {row.averageVideoProgressPct}%
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatShortDateTime(row.lastActivityAt)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {total > PAGE_SIZE && (
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                disabled={skip === 0 || loading}
                onClick={() => loadUsers(Math.max(0, skip - PAGE_SIZE))}
                className="text-xs text-slate-600 dark:text-slate-300 disabled:opacity-40"
              >
                Previous
              </button>
              <div className="text-xs text-slate-500">
                {skip + 1}–{Math.min(skip + PAGE_SIZE, total)} of {total}
              </div>
              <button
                type="button"
                disabled={skip + PAGE_SIZE >= total || loading}
                onClick={() => loadUsers(skip + PAGE_SIZE)}
                className="text-xs text-slate-600 dark:text-slate-300 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
