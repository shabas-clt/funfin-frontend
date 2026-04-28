import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { RefreshCw } from 'lucide-react';
import { getMemes, deleteMeme } from '../../../api/meme';
import { useAuth } from '../../../context/AuthContext';
import MemesTable from '../../../components/admin/memes/MemesTable';
import MemeFilters from '../../../components/admin/memes/MemeFilters';
import MemeDetailsModal from '../../../components/admin/memes/MemeDetailsModal';
import DeleteMemeDialog from '../../../components/admin/memes/DeleteMemeDialog';

export default function MemesList() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [memes, setMemes] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    category: '',
    postingCategory: '',
    search: '',
    sortBy: 'latest'
  });
  const [selectedMeme, setSelectedMeme] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [memeToDelete, setMemeToDelete] = useState(null);

  const limit = 20;

  const loadMemes = async (isRefresh = false) => {
    if (!token) return;
    if (!isRefresh) setLoading(true);

    try {
      const params = {
        skip: (page - 1) * limit,
        limit,
        ...(filters.category && { category: filters.category }),
        ...(filters.postingCategory && { postingCategory: filters.postingCategory }),
        ...(filters.search && { userId: filters.search }),
        sortBy: filters.sortBy
      };

      const data = await getMemes(token, params);
      setMemes(data.memes || []);
      setTotal(data.total || 0);
    } catch (error) {
      const message = error.response?.data?.detail || error.message || 'Failed to load memes';
      toast.error(message);
      console.error('Memes fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMemes();
  }, [token, page, filters]);

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
    if (!memeToDelete || !token) return;

    try {
      await deleteMeme(memeToDelete.id, token);
      toast.success('Meme deleted successfully');
      setShowDeleteDialog(false);
      setMemeToDelete(null);
      loadMemes(true);
    } catch (error) {
      const message = error.response?.data?.detail || error.message || 'Failed to delete meme';
      toast.error(message);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Memes Management</h1>
          <p className="text-gray-600 mt-1">View and moderate user-posted memes</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <MemeFilters filters={filters} setFilters={setFilters} setPage={setPage} />

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : memes.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">No memes found</p>
        </div>
      ) : (
        <>
          <MemesTable
            memes={memes}
            onViewDetails={handleViewDetails}
            onDelete={handleDeleteClick}
          />

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-gray-700">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
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