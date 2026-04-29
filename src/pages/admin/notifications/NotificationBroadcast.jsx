import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Loader2, Send, Users, User as UserIcon, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/api/axios';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import FieldError from '@/components/shared/FieldError';
import { notificationCreateSchema } from '@/lib/validation/schemas';

export default function NotificationBroadcast() {
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [userMatches, setUserMatches] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

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
      setHistory((prev) =>
        [
          {
            id: Date.now(),
            title: values.title.trim(),
            body: values.body.trim(),
            target: values.target,
            userId: values.target === 'user' ? values.userId.trim() : null,
            message: res?.message || 'Notification sent',
            at: new Date().toISOString(),
          },
          ...prev,
        ].slice(0, 10),
      );
      reset();
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-slate-900 dark:text-white">
          Notifications
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Broadcast a one-off notification to everyone, or target a specific
          user by ID. This writes an AppNotification document which the mobile
          app picks up on its next refresh.
        </p>
      </div>

      <Card className="bg-white dark:bg-black border border-slate-100 dark:border-neutral-800">
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
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
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
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-neutral-800"
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
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
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
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
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
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send notification
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      {history.length > 0 && (
        <Card className="bg-white dark:bg-black border border-slate-100 dark:border-neutral-800">
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              This session
            </h3>
            <ul className="divide-y divide-slate-100 dark:divide-neutral-800">
              {history.map((h) => (
                <li key={h.id} className="py-2.5 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                      {h.title}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 whitespace-pre-line">
                      {h.body}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {h.target === 'all'
                        ? 'Broadcast · '
                        : `User ${h.userId} · `}
                      {h.message}
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 whitespace-nowrap">
                    {new Date(h.at).toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Session-only log. Reload resets it; server-side audit lives in
              the AppNotification collection.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
