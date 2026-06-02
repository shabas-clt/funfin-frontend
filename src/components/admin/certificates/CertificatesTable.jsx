import { Eye, Download, ShieldCheck } from 'lucide-react';
import { formatShortDate, formatShortDateTime } from '@/lib/format';

const TH =
  'px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400';

function StatusBadge({ revoked }) {
  if (revoked) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
        Revoked
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold bg-emerald-100/70 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
      Active
    </span>
  );
}

export default function CertificatesTable({ certificates, onViewDetails }) {
  return (
    <div className="bg-white dark:bg-neutral-950 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="overflow-x-auto px-2">
        <table className="w-full text-[13px] text-left whitespace-nowrap">
          <thead>
            <tr className="border-b border-slate-100 dark:border-neutral-800">
              <th className={TH}>Certificate ID</th>
              <th className={TH}>Student</th>
              <th className={TH}>Course</th>
              <th className={TH}>Hours</th>
              <th className={TH}>Completed</th>
              <th className={TH}>Issued</th>
              <th className={TH}>Status</th>
              <th className={`${TH} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-neutral-800/70 text-slate-600 dark:text-slate-300 font-medium">
            {certificates.map((cert) => (
              <tr
                key={cert.id}
                className="hover:bg-slate-50/80 dark:hover:bg-neutral-900/70 group transition-colors"
              >
                <td className="px-5 py-3.5">
                  <span className="font-mono text-slate-900 dark:text-slate-100">
                    {cert.certificateId}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="font-semibold text-slate-900 dark:text-slate-100">
                    {cert.studentName}
                  </div>
                  <div className="text-[11px] text-slate-400 font-normal">#{cert.userId}</div>
                </td>
                <td className="px-5 py-3.5">
                  <div className="text-slate-900 dark:text-slate-100">{cert.courseTitle}</div>
                </td>
                <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                  {cert.courseHours}h
                </td>
                <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                  {formatShortDate(cert.completionDate)}
                </td>
                <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                  {formatShortDateTime(cert.issuedAt)}
                </td>
                <td className="px-5 py-3.5">
                  <StatusBadge revoked={cert.revoked} />
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onViewDetails(cert)}
                      className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors flex items-center justify-center"
                      title="View details"
                      aria-label="View"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                    </button>
                    {cert.pdfUrl && (
                      <a
                        href={cert.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors flex items-center justify-center"
                        title="Download PDF"
                        aria-label="Download PDF"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                      </a>
                    )}
                    <a
                      href={cert.verifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-7 h-7 rounded-lg bg-slate-50 dark:bg-neutral-800 hover:bg-slate-100 dark:hover:bg-neutral-700 transition-colors flex items-center justify-center"
                      title="Open verification page"
                      aria-label="Verify"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
