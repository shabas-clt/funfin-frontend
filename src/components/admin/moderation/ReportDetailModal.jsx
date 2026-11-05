import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { Modal } from '@/components/ui/modal';
import ActionDialog from '@/components/admin/payments/ActionDialog';
import { errorText } from '@/api/paymentsApi';
import { formatServerDateTime } from '@/lib/format';
import {
  moderationApi,
  REASON_LABELS,
  TARGET_LABELS,
  STATUS_LABELS,
  SLA_HOURS,
  formatAge,
} from '@/api/moderationApi';

const ACTIONS = {
  dismiss: {
    title: 'Dismiss report',
    confirmLabel: 'Dismiss',
    danger: false,
    description: 'No violation. The content stays up. Other open reports on the same content are closed too.',
    done: 'Report dismissed',
  },
  remove_content: {
    title: 'Remove content',
    confirmLabel: 'Remove content',
    danger: true,
    description:
      'Reels are hidden (you can restore them later). Comments and memes are deleted. Other open reports on the same content are closed too.',
    done: 'Content removed',
  },
  suspend_author: {
    title: 'Remove content and suspend author',
    confirmLabel: 'Remove and suspend',
    danger: true,
    description:
      'Removes the content and signs the author out everywhere. They cannot log in until an admin reinstates them.',
    done: 'Content removed and author suspended',
  },
};

function Party({ label, party }) {
  return (
    <div className="rounded-lg border border-slate-100 dark:border-neutral-800 p-3">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      {party ? (
        <>
          <p className="text-sm font-medium text-slate-900 dark:text-white">{party.fullName || '—'}</p>
          <p className="text-xs text-slate-500 break-all">{party.email}</p>
          {party.isActive === false && (
            <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100/70 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300">
              Inactive
            </span>
          )}
        </>
      ) : (
        <p className="text-sm text-slate-500">{label === 'Reporter' ? 'Automatic filter or deleted account' : 'Unknown'}</p>
      )}
    </div>
  );
}

function ContentPreview({ report }) {
  const c = report.content;
  if (!c || !c.exists) {
    return <p className="text-sm text-slate-500">The content no longer exists (deleted by its author or already removed).</p>;
  }
  return (
    <div className="space-y-2">
      {c.status && (
        <p className="text-xs text-slate-500">
          Current status: <span className="font-medium capitalize">{c.status}</span>
        </p>
      )}
      {c.mediaUrl && (
        <video
          src={c.mediaUrl}
          poster={c.thumbnailUrl || undefined}
          controls
          preload="metadata"
          className="w-full max-h-80 rounded-lg bg-black"
        />
      )}
      {c.text && (
        <p className="text-sm whitespace-pre-wrap text-slate-800 dark:text-slate-200 rounded-lg bg-slate-50 dark:bg-neutral-900 p-3">
          {c.text}
        </p>
      )}
    </div>
  );
}

// One report with the reported content, both parties, and the actions.
export default function ReportDetailModal({ reportId, onClose, onChanged }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!reportId) {
      setReport(null);
      return;
    }
    let live = true;
    setLoading(true);
    moderationApi
      .report(reportId)
      .then((r) => live && setReport(r))
      .catch((err) => {
        toast.error(errorText(err, 'Failed to load report'));
        onClose();
      })
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId]);

  const open = report && ['pending', 'reviewing'].includes(report.status);

  const startAction = (key) => {
    const cfg = ACTIONS[key];
    setAction({
      title: cfg.title,
      confirmLabel: cfg.confirmLabel,
      danger: cfg.danger,
      description: <p>{cfg.description}</p>,
      run: async (note) => {
        try {
          const updated = await moderationApi.resolve(report.id, key, note);
          setReport(updated);
          toast.success(cfg.done);
          onChanged();
        } catch (err) {
          toast.error(errorText(err, 'Action failed'));
          throw err;
        }
      },
    });
  };

  const undo = async (kind) => {
    setBusy(true);
    try {
      if (kind === 'video') await moderationApi.restoreVideo(report.targetId);
      else await moderationApi.reinstateUser(report.author.userId);
      toast.success(kind === 'video' ? 'Reel restored' : 'Author reinstated');
      setReport(await moderationApi.report(report.id));
      onChanged();
    } catch (err) {
      toast.error(errorText(err, 'Action failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Modal isOpen={!!reportId} onClose={onClose} title="Report" className="max-w-2xl">
        {loading || !report ? (
          <div className="py-10 text-center text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
            Loading…
          </div>
        ) : (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded-full bg-indigo-100/70 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 font-semibold">
                {TARGET_LABELS[report.targetType] || report.targetType}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-neutral-800 font-semibold">
                {REASON_LABELS[report.reason] || report.reason}
              </span>
              <span className="text-slate-500">{STATUS_LABELS[report.status] || report.status}</span>
              <span className={open && report.ageHours >= SLA_HOURS ? 'text-rose-600 font-semibold' : 'text-slate-500'}>
                Reported {formatAge(report.ageHours)} ago
              </span>
              {report.source === 'auto_filter' && <span className="text-slate-500">(automatic filter)</span>}
            </div>

            {report.details && (
              <p className="text-sm text-slate-700 dark:text-slate-300">
                <span className="text-slate-500">Reporter says: </span>
                {report.details}
              </p>
            )}

            <ContentPreview report={report} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Party label="Author" party={report.author} />
              <Party label="Reporter" party={report.reporter} />
            </div>

            <p className="text-xs text-slate-500">
              {report.reportsOnSameContent} report(s) on this content · {report.reportsOnSameAuthor} report(s) on this author
            </p>

            {!open && (
              <div className="text-xs text-slate-500 rounded-lg bg-slate-50 dark:bg-neutral-900 p-3">
                Resolved {formatServerDateTime(report.resolvedAt)}
                {report.resolutionNote && <>: {report.resolutionNote}</>}
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-slate-100 dark:border-neutral-800">
              {open ? (
                <>
                  <button
                    type="button"
                    onClick={() => startAction('dismiss')}
                    className="px-3 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-neutral-800"
                  >
                    Dismiss
                  </button>
                  <button
                    type="button"
                    onClick={() => startAction('remove_content')}
                    className="px-3 py-2 rounded-lg text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700"
                  >
                    Remove content
                  </button>
                  <button
                    type="button"
                    onClick={() => startAction('suspend_author')}
                    className="px-3 py-2 rounded-lg text-sm font-semibold text-white bg-rose-800 hover:bg-rose-900"
                  >
                    Remove and suspend author
                  </button>
                </>
              ) : (
                <>
                  {report.targetType === 'video' && report.content?.status === 'hidden' && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => undo('video')}
                      className="px-3 py-2 rounded-lg text-sm text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 disabled:opacity-50"
                    >
                      Restore reel
                    </button>
                  )}
                  {report.author && report.author.isActive === false && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => undo('user')}
                      className="px-3 py-2 rounded-lg text-sm text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 disabled:opacity-50"
                    >
                      Reinstate author
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
      <ActionDialog action={action} onClose={() => setAction(null)} />
    </>
  );
}
