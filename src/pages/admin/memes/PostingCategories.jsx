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
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Posting Categories</h1>
          <p className="text-gray-600 mt-1">Manage meme posting categories (joke/meme/scenario)</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => loadCategories(true)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowAddDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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