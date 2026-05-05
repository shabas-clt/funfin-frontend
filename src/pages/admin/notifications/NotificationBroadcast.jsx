import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { 
  Loader2, 
  Send, 
  Users, 
  User as UserIcon, 
  AlertTriangle, 
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Filter
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/api/axios';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import FieldError from '@/components/shared/FieldError';
import { notificationCreateSchema } from '@/lib/validation/schemas';

export default function NotificationBroadcast() {
  const [sending, setSending] = useState(false);
  const [logItems, setLogItems] = useState([]);
  const [logTotal, setLogTotal] = useState(0);
  const [logLoading, setLogLoading] = useState(false);
  const [logPage, setLogPage] = useState(0);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [targetFilter, setTargetFilter] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [userMatches, setUserMatches] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const LOG_LIMIT = 20;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(notificationCreateSchema),
    mode: 'onChange',
    defaultValues: {
      title: '',
      body: '',
      target: 'all',
      userId: '',
    },
  });

  const target = watch('target');
  const userId = watch('userId');

  const loadLogs = useCallback(async ({ reset = false } = {}) => {
    try {
      setLogLoading(true);
      const nextPage = reset ? 0 : logPage;
      const params = {
        skip: nextPage * LOG_LIMIT,
        limit: LOG_LIMIT,
        sortBy,
        sortOrder,
      };
      if (targetFilter) {
        params.target = targetFilter;
      }
      const res = await api.get('/admin/notifications/logs', { params });
      const nextItems = res?.items || [];
      setLogTotal(res?.total ?? 0);
      if (reset) {
        setLogItems(nextItems);
        setLogPage(1);
      } else {
        setLogItems((prev) => [...prev, ...nextItems]);
        setLogPage((prev) => prev + 1);
      }
    } catch (err) {
      console.error('Failed to load notification log:', err);
      toast.error('Failed to load notification log');
    } finally {
      setLogLoading(false);
    }
  }, [logPage, sortBy, sortOrder, targetFilter]);

  useEffect(() => {
    if (target !== 'user') return;
    if (!userSearch.trim()) {
      setUserMatches([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        setLoadingUsers(true);
        const res = await api.get('/students', {
          params: { q: userSearch.trim(), limit: 8, skip: 0, sortBy: 'name', sortOrder: 'asc' },
        });
        setUserMatches(res.students || []);
      } catch {
        setUserMatches([]);
      } finally {
        setLoadingUsers(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [userSearch, target]);

  useEffect(() => {
    loadLogs({ reset: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, sortOrder, targetFilter]);

  const onSubmit = async (values) => {
    // Broadcasting to everyone is irreversible; require an explicit second
    // confirm so accidental clicks don't spam every user.
    if (values.target === 'all') {
      const confirm = await Swal.fire({
        title: 'Send to ALL users?',
        text: 'Every registered learner will receive this notification. This cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Yes, send to all',
      });
      if (!confirm.isConfirmed) return;
    }

    setSending(true);
    try {
      const resolvedUserId = values.userId?.trim();

      const payload = {
        title: values.title.trim(),
        body: values.body.trim(),
      };
      if (values.target === 'user') payload.userId = resolvedUserId;
      const res = await api.post('/admin/notifications', payload);
      toast.success(res?.message || 'Notification sent');
      
      // Reload logs to show the newly sent notification
      await loadLogs({ reset: true });
      
      reset();
      setSelectedUser(null);
      setUserSearch('');
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[22px] font-semibold text-[#1e1b4b] dark:text-white">
          Notifications
        </h1>
        <p className="text-[#64748b] dark:text-slate-400 text-sm mt-1">
          Broadcast a one-off notification to everyone, or target a specific
          user by ID. This writes an AppNotification document which the mobile
          app picks up on its next refresh.
        </p>
      </div>

      <Card className="border-0 shadow-[0_2px_10px_rgba(0,0,0,0.04)] bg-white dark:bg-neutral-950 rounded-2xl">
        <CardContent className="p-5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Target
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <label
                  className={`flex-1 cursor-pointer flex items-start gap-3 p-3 rounded-xl border ${
                    target === 'all'
                      ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/40'
                      : 'border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900'
                  }`}
                >
                  <input type="radio" value="all" {...register('target')} className="mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-2">
                      <Users className="w-4 h-4" /> Broadcast to all users
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Inserts one AppNotification per user.
                    </div>
                  </div>
                </label>
                <label
                  className={`flex-1 cursor-pointer flex items-start gap-3 p-3 rounded-xl border ${
                    target === 'user'
                      ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/40'
                      : 'border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900'
                  }`}
                >
                  <input type="radio" value="user" {...register('target')} className="mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-2">
                      <UserIcon className="w-4 h-4" /> Single user
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Requires a user's MongoDB _id.
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {target === 'user' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Choose user
                </label>
                <input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search by name or email"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/30"
                />
                {loadingUsers && <p className="mt-1 text-xs text-slate-500">Searching...</p>}
                {!loadingUsers && userMatches.length > 0 && (
                  <div className="mt-2 rounded-lg border border-slate-200 dark:border-neutral-700 divide-y divide-slate-100 dark:divide-neutral-800 max-h-48 overflow-y-auto">
                    {userMatches.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          setSelectedUser(u);
                          setUserSearch(`${u.fullName || ''} (${u.email || ''})`);
                          setValue('userId', u.id, { shouldValidate: true, shouldDirty: true });
                          setUserMatches([]);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors"
                      >
                        <div className="text-sm text-slate-900 dark:text-white">{u.fullName || 'Unknown'}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{u.email || u.id}</div>
                      </button>
                    ))}
                  </div>
                )}
                <input type="hidden" {...register('userId')} />
                <FieldError error={errors.userId} />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Select a user from search results. We send their internal user id in the API.
                </p>
                {selectedUser && userId && (
                  <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
                    Selected: {selectedUser.fullName || selectedUser.email} ({userId})
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Title
              </label>
              <input
                {...register('title')}
                placeholder="e.g. New course is live!"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/30"
              />
              <FieldError error={errors.title} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Body
              </label>
              <textarea
                {...register('body')}
                rows={4}
                placeholder="Short message body…"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-500/30 resize-none"
              />
              <FieldError error={errors.body} />
            </div>

            {target === 'all' && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div className="text-xs text-amber-800 dark:text-amber-300">
                  This will insert one AppNotification per registered user. On
                  larger installs this can take a few seconds.
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={sending}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium transition-colors shadow-sm"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send notification
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-[0_2px_10px_rgba(0,0,0,0.04)] bg-white dark:bg-neutral-950 rounded-2xl">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Notification History
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Complete log of all sent notifications with admin details
              </p>
            </div>
            <button
              onClick={() => loadLogs({ reset: true })}
              disabled={logLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-700 hover:bg-slate-50 dark:hover:bg-neutral-800 text-sm text-slate-700 dark:text-slate-300 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${logLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Filters and Sorting */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <select
                value={targetFilter}
                onChange={(e) => {
                  setTargetFilter(e.target.value);
                  setLogPage(0);
                }}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-[13px] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">All targets</option>
                <option value="all">Broadcast</option>
                <option value="user">Single user</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setLogPage(0);
                }}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-[13px] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="createdAt">Date</option>
                <option value="adminName">Admin</option>
                <option value="pushSent">Push sent</option>
                <option value="pushFailed">Push failed</option>
                <option value="totalUsers">Total users</option>
              </select>
              <button
                onClick={() => {
                  setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                  setLogPage(0);
                }}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-neutral-700 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors"
              >
                {sortOrder === 'asc' ? (
                  <ChevronUp className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                )}
              </button>
            </div>

            <div className="ml-auto text-xs text-slate-500 dark:text-slate-400">
              {logTotal} total notification{logTotal !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Log Items */}
          {logLoading && logItems.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : logItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No notifications sent yet
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {logItems.map((log) => (
                <div
                  key={log.id}
                  className="p-4 rounded-lg border border-slate-200 dark:border-neutral-700 bg-slate-50/50 dark:bg-neutral-900/50 space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                          {log.title}
                        </h4>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            log.target === 'all'
                              ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                              : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                          }`}
                        >
                          {log.target === 'all' ? (
                            <>
                              <Users className="w-3 h-3" /> Broadcast
                            </>
                          ) : (
                            <>
                              <UserIcon className="w-3 h-3" /> Single User
                            </>
                          )}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                        {log.body}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {new Date(log.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {new Date(log.createdAt).toLocaleTimeString('en-GB', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        Admin:
                      </span>
                      <span>{log.adminName}</span>
                      <span className="text-slate-400">({log.adminEmail})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-2 border-t border-slate-200 dark:border-neutral-700">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Recipients:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {log.totalUsers}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Push sent:</span>
                      <span className="font-medium text-emerald-600 dark:text-emerald-400">
                        {log.pushSent}
                      </span>
                    </div>
                    {log.pushFailed > 0 && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-slate-500 dark:text-slate-400">Failed:</span>
                        <span className="font-medium text-red-600 dark:text-red-400">
                          {log.pushFailed}
                        </span>
                      </div>
                    )}
                    {log.pushSkipped > 0 && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-slate-500 dark:text-slate-400">Skipped:</span>
                        <span className="font-medium text-amber-600 dark:text-amber-400">
                          {log.pushSkipped}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Load More */}
          {logItems.length < logTotal && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => loadLogs({ reset: false })}
                disabled={logLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 hover:bg-slate-50 dark:hover:bg-neutral-800 text-sm text-slate-700 dark:text-slate-300 disabled:opacity-50 transition-colors"
              >
                {logLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Load more
                    <span className="text-xs text-slate-500">
                      ({logItems.length} of {logTotal})
                    </span>
                  </>
                )}
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
