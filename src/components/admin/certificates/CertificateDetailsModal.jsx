import { Download, ShieldCheck } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { formatShortDate, formatShortDateTime } from '@/lib/format';

function Row({ label, value, mono }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-slate-50 dark:border-neutral-800 last:border-0">
      <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
      <span
        className={`text-sm text-right text-slate-900 dark:text-slate-100 ${
          mono ? 'font-mono' : 'font-medium'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export default function CertificateDetailsModal({ certificate, onClose }) {
  const c = certificate;
  return (
    <Modal isOpen onClose={onClose} title="Certificate details">
      <div className="space-y-1">
        <Row label="Certificate ID" value={c.certificateId} mono />
        <Row
          label="Status"
          value={
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                c.revoked
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  : 'bg-emerald-100/70 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
              }`}
            >
              {c.revoked ? 'Revoked' : 'Active'}
            </span>
          }
        />
        <Row label="Student" value={c.studentName} />
        <Row label="User ID" value={c.userId} mono />
        <Row label="Course" value={c.courseTitle} />
        <Row label="Course ID" value={c.courseId} mono />
        <Row label="Course hours" value={`${c.courseHours}h`} />
        <Row label="Completed on" value={formatShortDate(c.completionDate)} />
        <Row label="Issued on" value={formatShortDateTime(c.issuedAt)} />
      </div>

      <div className="flex items-center gap-3 mt-5">
        {c.pdfUrl && (
          <a
            href={c.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </a>
        )}
        <a
          href={c.verifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors text-sm font-medium"
        >
          <ShieldCheck className="w-4 h-4" />
          Verify page
        </a>
      </div>
    </Modal>
  );
}
