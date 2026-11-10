import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FileText, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { certificatesApi } from '@/api/certificatesApi';

const MAX = 60;
const EMPTY = { instructorName: '', instructorTitle: '', directorName: '', directorTitle: '' };

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

// Edit the two signature blocks printed on course certificates: the course
// mentor and the CEO & Managing Director. A blank field uses the default
// shown as its placeholder; a blank director name leaves that signature off.
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
        setValues({ ...EMPTY, ...res.saved });
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
      setValues({ ...EMPTY, ...res.saved });
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Certificate signatures" className="max-w-xl dark:bg-neutral-950">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        These names are printed on newly issued certificates. Certificates already issued keep their
        existing PDF until they are regenerated.
      </p>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Course mentor</h3>
          <Field label="Name" value={values.instructorName} placeholder={effective.instructorName} onChange={set('instructorName')} disabled={busy} />
          <Field label="Title" value={values.instructorTitle} placeholder={effective.instructorTitle} onChange={set('instructorTitle')} disabled={busy} hint="Printed as “Title, FunFin Academy”." />
        </div>
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Director</h3>
          <Field label="Name" value={values.directorName} placeholder="e.g. full name" onChange={set('directorName')} disabled={busy} hint="Leave blank to print only the mentor’s signature." />
          <Field label="Title" value={values.directorTitle} placeholder="CEO & Managing Director" onChange={set('directorTitle')} disabled={busy} />
        </div>
      </div>

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
            disabled={busy || !dirty}
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
