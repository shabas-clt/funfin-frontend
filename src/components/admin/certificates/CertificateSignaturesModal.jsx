import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FileText, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { certificatesApi } from '@/api/certificatesApi';

const MAX = 60;
const EMPTY = {
  instructorName: '',
  instructorTitle: '',
  directorName: '',
  directorTitle: '',
  showInstructor: true,
  showDirector: true,
};

const errorText = (err, fallback) => {
  if (typeof err === 'string') return err;
  if (Array.isArray(err)) return err.map((e) => e?.msg).filter(Boolean).join(', ') || fallback;
  return fallback;
};

function Field({ label, hint, value, placeholder, onChange, disabled }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>
      <input
        type="text"
        value={value}
        maxLength={MAX}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full h-10 px-3 rounded-lg border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-60"
      />
      {hint && <span className="mt-1 block text-xs text-slate-400 dark:text-slate-500">{hint}</span>}
    </label>
  );
}

function SignatureToggle({ label, checked, onChange, disabled }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-neutral-600 dark:bg-neutral-900"
      />
      <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</span>
    </label>
  );
}

// What's wrong with the form, or null. Mirrors the backend rules: at least
// one signature, and every ticked signature needs a name.
const validationError = (v) => {
  if (!v.showInstructor && !v.showDirector) return 'Select at least one signature.';
  if (v.showInstructor && !v.instructorName.trim()) return 'Enter the mentor’s name or untick the mentor signature.';
  if (v.showDirector && !v.directorName.trim()) return 'Enter the director’s name or untick the director signature.';
  return null;
};

// Choose which signature blocks are printed on course certificates (course
// mentor, director, or both) and the names and titles they show. Only the
// ticked signatures are printed.
export default function CertificateSignaturesModal({ isOpen, onClose }) {
  const [values, setValues] = useState(EMPTY);
  const [effective, setEffective] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!isOpen) return undefined;
    let cancelled = false;
    setLoading(true);
    setDirty(false);
    certificatesApi
      .getSignatories()
      .then((res) => {
        if (cancelled) return;
        // A director with no saved name was never printed, so start it unticked.
        setValues({ ...EMPTY, ...res.saved, showDirector: Boolean(res.saved?.showDirector ?? true) && Boolean(res.saved?.directorName) });
        setEffective({ ...EMPTY, ...res.effective });
      })
      .catch((err) => {
        if (!cancelled) toast.error(errorText(err, 'Failed to load signatures'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const set = (key) => (value) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await certificatesApi.saveSignatories(values);
      setValues({ ...EMPTY, ...res.saved, showDirector: Boolean(res.saved?.showDirector ?? true) && Boolean(res.saved?.directorName) });
      setEffective({ ...EMPTY, ...res.effective });
      setDirty(false);
      toast.success('Signatures saved. New certificates will use them.');
    } catch (err) {
      toast.error(errorText(err, 'Failed to save signatures'));
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async () => {
    // Open the tab synchronously so the popup blocker allows it, then load
    // the PDF into it.
    const tab = window.open('', '_blank');
    setPreviewing(true);
    try {
      const blob = await certificatesApi.previewPdf();
      const url = URL.createObjectURL(blob);
      if (tab) tab.location.href = url;
      else window.location.assign(url);
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      if (tab) tab.close();
      toast.error(errorText(err, 'Failed to build the preview'));
    } finally {
      setPreviewing(false);
    }
  };

  const busy = loading || saving;
  const problem = validationError(values);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Certificate signatures" className="max-w-xl dark:bg-neutral-950">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Tick the signatures to print on newly issued certificates. Certificates already issued keep
        their existing PDF until they are regenerated.
      </p>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-3">
          <SignatureToggle label="Course mentor" checked={values.showInstructor} onChange={set('showInstructor')} disabled={busy} />
          <Field label="Name" value={values.instructorName} placeholder="e.g. full name" onChange={set('instructorName')} disabled={busy || !values.showInstructor} />
          <Field label="Title" value={values.instructorTitle} placeholder={effective.instructorTitle || 'Lead Mentor'} onChange={set('instructorTitle')} disabled={busy || !values.showInstructor} hint="Printed as “Title, FunFin”." />
        </div>
        <div className="space-y-3">
          <SignatureToggle label="Director" checked={values.showDirector} onChange={set('showDirector')} disabled={busy} />
          <Field label="Name" value={values.directorName} placeholder="e.g. full name" onChange={set('directorName')} disabled={busy || !values.showDirector} />
          <Field label="Title" value={values.directorTitle} placeholder="CEO & Managing Director" onChange={set('directorTitle')} disabled={busy || !values.showDirector} />
        </div>
      </div>

      {dirty && problem && (
        <p className="mt-4 text-sm text-amber-600 dark:text-amber-400">{problem}</p>
      )}

      <div className="mt-6 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
        <button
          type="button"
          onClick={handlePreview}
          disabled={busy || previewing || dirty}
          title={dirty ? 'Save first to preview the new names' : 'Open a sample certificate'}
          className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg border border-slate-200 dark:border-neutral-700 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-neutral-900 disabled:opacity-50"
        >
          {previewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          Preview certificate
        </button>
        <div className="flex gap-2 sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-neutral-900"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={busy || !dirty || Boolean(problem)}
            className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium disabled:opacity-50"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </Modal>
  );
}
