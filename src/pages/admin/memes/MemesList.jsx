import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { RefreshCw, MessageSquare, Tag, FolderOpen } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/api/axios';
import { useAuth } from '../../../context/AuthContext';
import MemesTable from '../../../components/admin/memes/MemesTable';
import MemeFilters from '../../../components/admin/memes/MemeFilters';
import MemeDetailsModal from '../../../components/admin/memes/MemeDetailsModal';
import DeleteMemeDialog from '../../../components/admin/memes/DeleteMemeDialog';
import { useCachedState, hasCached, useLatestRequest } from '@/lib/pageCache';
import { useDebouncedValue } from '@/lib/useDebouncedValue';

export default function MemesList() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  // List, filters and page are cached, so coming back to this page shows the
  // last list at once and refreshes it in the background.
  const [memes, setMemes] = useCachedState('memes:rows', []);
  const [total, setTotal] = useCachedState('memes:total', 0);
  const [page, setPage] = useCachedState('memes:page', 1);
  const [filters, setFilters] = useCachedState('memes:filters', {
    category: '',
    postingCategory: '',
    search: '',
    sortBy: 'latest'
  });
  const debouncedSearch = useDebouncedValue(filters.search);
  // Skeleton only when there is nothing to show yet; a refresh keeps the
  // current rows on screen (dimmed).
  const showSkeleton = loading && !hasCached('memes:rows');
  const isRefreshing = loading && !showSkeleton;
  const request = useLatestRequest();
  const [selectedMeme, setSelectedMeme] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [memeToDelete, setMemeToDelete] = useState(null);

  const limit = 20;

  const loadMemes = async (isRefresh = false) => {
    if (!isAuthenticated) return;
    const id = request.begin();
    if (!isRefresh) setLoading(true);

    try {
      const params = {
        skip: (page - 1) * limit,
        limit,
        ...(filters.category && { category: filters.category }),
        ...(filters.postingCategory && { postingCategory: filters.postingCategory }),
        ...(debouncedSearch && { userId: debouncedSearch }),
        sortBy: filters.sortBy
      };

      const data = await api.get('/admin/memes', { params });
      if (!request.isLatest(id)) return;
      setMemes(data.memes || []);
      setTotal(data.total || 0);
    } catch (error) {
      if (!request.isLatest(id)) return;
      const message = typeof error === 'string' ? error : 'Failed to load memes';
      toast.error(message);
      console.error('Memes fetch error:', error);
    } finally {
      if (request.isLatest(id)) setLoading(false);
    }
  };

  useEffect(() => {
    loadMemes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, page, filters.category, filters.postingCategory, debouncedSearch, filters.sortBy]);

  const handleRefresh = () => {
    loadMemes(true);
  };

  const handleViewDetails = (meme) => {
    setSelectedMeme(meme);
    setShowDetailsModal(true);
  };

  const handleDeleteClick = (meme) => {
    setMemeToDelete(meme);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!memeToDelete) return;

    try {
      await api.delete(`/admin/memes/${memeToDelete.id}`);
      toast.success('Meme deleted successfully');
      setShowDeleteDialog(false);
      setMemeToDelete(null);
      loadMemes(true);
    } catch (error) {
      const message = typeof error === 'string' ? error : 'Failed to delete meme';
      toast.error(message);
    }
  };

  const totalPages = Math.ceil(total / limit);

  const tabs = [
    { name: 'All Memes', path: '/admin/memes', icon: MessageSquare },
    { name: 'Posting Categories', path: '/admin/memes/posting-categories', icon: Tag },
    { name: 'Content Categories', path: '/admin/memes/content-categories', icon: FolderOpen },
  ];

  const currentTab = tabs.find(tab => tab.path === location.pathname) || tabs[0];

  return (
    <div className="space-y-5">
      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-neutral-950 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] p-1">
        <div className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = location.pathname === tab.path;
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-neutral-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold text-[#1e1b4b] dark:text-white">Memes Management</h1>
          <p className="text-[#64748b] dark:text-slate-400 text-sm mt-1">View and moderate user-posted memes</p>
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

      <MemeFilters filters={filters} setFilters={setFilters} setPage={setPage} />

      {showSkeleton ? (
        <div className="bg-white dark:bg-neutral-950 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="w-20 h-8" />
              </div>
            ))}
          </div>
        </div>
      ) : memes.length === 0 ? (
        <div className="bg-white dark:bg-neutral-950 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] p-12 text-center">
          <p className="text-slate-400 dark:text-slate-500">No memes found</p>
        </div>
      ) : (
        <div className={`transition-opacity ${isRefreshing ? 'opacity-60' : ''}`}>
          <MemesTable
            memes={memes}
            onViewDetails={handleViewDetails}
            onDelete={handleDeleteClick}
          />

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="px-4 py-2 bg-slate-100 dark:bg-neutral-900 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-neutral-800 disabled:opacity-50 transition-colors text-sm font-medium"
              >
                Previous
              </button>
              <span className="text-slate-700 dark:text-slate-300 text-sm">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className="px-4 py-2 bg-slate-100 dark:bg-neutral-900 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-neutral-800 disabled:opacity-50 transition-colors text-sm font-medium"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {showDetailsModal && selectedMeme && (
        <MemeDetailsModal
          meme={selectedMeme}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedMeme(null);
          }}
        />
      )}

      {showDeleteDialog && memeToDelete && (
        <DeleteMemeDialog
          meme={memeToDelete}
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            setShowDeleteDialog(false);
            setMemeToDelete(null);
          }}
        />
      )}
    </div>
  );
}