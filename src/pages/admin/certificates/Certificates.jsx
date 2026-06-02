import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { certificatesApi } from '@/api/certificatesApi';
import { useAuth } from '../../../context/AuthContext';
import CertificatesTable from '../../../components/admin/certificates/CertificatesTable';
import CertificateFilters from '../../../components/admin/certificates/CertificateFilters';
import CertificateDetailsModal from '../../../components/admin/certificates/CertificateDetailsModal';

export default function Certificates() {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    q: '',
    revoked: '',
    sort_by: 'issuedAt',
    order: 'desc',
  });
  const [selected, setSelected] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const limit = 20;

  const loadCertificates = async (isRefresh = false) => {
    if (!isAuthenticated) return;
    if (!isRefresh) setLoading(true);

    try {
      const params = {
        skip: (page - 1) * limit,
        limit,
        ...(filters.q && { q: filters.q }),
        ...(filters.revoked !== '' && { revoked: filters.revoked }),
        sort_by: filters.sort_by,
        order: filters.order,
      };

      const data = await certificatesApi.list(params);
      setCertificates(data.items || []);
      setTotal(data.total || 0);
    } catch (error) {
      const message = typeof error === 'string' ? error : 'Failed to load certificates';
      toast.error(message);
      console.error('Certificates fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCertificates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, page, filters]);

  const handleRefresh = () => loadCertificates(true);

  const handleViewDetails = (cert) => {
    setSelected(cert);
    setShowDetails(true);
  };

  const totalPages = Math.ceil(total / limit);
  const showingFrom = total === 0 ? 0 : (page - 1) * limit + 1;
  const showingTo = Math.min(page * limit, total);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold text-[#1e1b4b] dark:text-white">Certificates</h1>
          <p className="text-[#64748b] dark:text-slate-400 text-sm mt-1">
            Issued course-completion certificates
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors text-sm font-medium"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <CertificateFilters filters={filters} setFilters={setFilters} setPage={setPage} />

      {loading ? (
        <div className="bg-white dark:bg-neutral-950 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] p-6">
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-28" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="w-20 h-8" />
              </div>
            ))}
          </div>
        </div>
      ) : certificates.length === 0 ? (
        <div className="bg-white dark:bg-neutral-950 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] p-12 text-center">
          <p className="text-slate-400 dark:text-slate-500">No certificates found</p>
        </div>
      ) : (
        <>
          <CertificatesTable certificates={certificates} onViewDetails={handleViewDetails} />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-2">
            <span className="text-slate-500 dark:text-slate-400 text-sm">
              Showing {showingFrom}–{showingTo} of {total}
            </span>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-slate-100 dark:bg-neutral-900 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-neutral-800 disabled:opacity-50 transition-colors text-sm font-medium"
                >
                  Previous
                </button>
                <span className="text-slate-700 dark:text-slate-300 text-sm">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-slate-100 dark:bg-neutral-900 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-neutral-800 disabled:opacity-50 transition-colors text-sm font-medium"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {showDetails && selected && (
        <CertificateDetailsModal
          certificate={selected}
          onClose={() => {
            setShowDetails(false);
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}
