import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Plus, RefreshCw } from 'lucide-react';
import { getPostingCategories, createPostingCategory, deletePostingCategory } from '../../../api/meme';
import { useAuth } from '../../../context/AuthContext';
import CategoriesTable from '../../../components/admin/memes/CategoriesTable';
import AddCategoryDialog from '../../../components/admin/memes/AddCategoryDialog';

export default function PostingCategories() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const loadCategories = async (isRefresh = false) => {
    if (!token) return;
    if (!isRefresh) setLoading(true);

    try {
      const data = await getPostingCategories(token);
      setCategories(data || []);
    } catch (error) {
      const message = error.response?.data?.detail || error.message || 'Failed to load categories';
      toast.error(message);
      console.error('Categories fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, [token]);

  const handleAdd = async (formData) => {
    if (!token) return;

    try {
      await createPostingCategory(formData, token);
      toast.success('Category created successfully');
      setShowAddDialog(false);
      loadCategories(true);
    } catch (error) {
      const message = error.response?.data?.detail || error.message || 'Failed to create category';
      toast.error(message);
      throw error;
    }
  };

  const handleDelete = async (id) => {
    if (!token) return;
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      await deletePostingCategory(id, token);
      toast.success('Category deleted successfully');
      loadCategories(true);
    } catch (error) {
      const message = error.response?.data?.detail || error.message || 'Failed to delete category';
      toast.error(message);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold text-[#1e1b4b] dark:text-white">Posting Categories</h1>
          <p className="text-[#64748b] dark:text-slate-400 text-sm mt-1">Manage meme posting categories (joke/meme/scenario)</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => loadCategories(true)}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-neutral-800 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-neutral-700 disabled:opacity-50 transition-colors text-sm font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowAddDialog(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <CategoriesTable
          categories={categories}
          onDelete={handleDelete}
        />
      )}

      {showAddDialog && (
        <AddCategoryDialog
          title="Add Posting Category"
          onSave={handleAdd}
          onCancel={() => setShowAddDialog(false)}
        />
      )}
    </div>
  );
}