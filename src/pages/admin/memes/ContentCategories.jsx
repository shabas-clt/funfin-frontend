import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Plus, RefreshCw, MessageSquare, Tag, FolderOpen } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/api/axios';
import { useAuth } from '../../../context/AuthContext';
import CategoriesTable from '../../../components/admin/memes/CategoriesTable';
import AddCategoryDialog from '../../../components/admin/memes/AddCategoryDialog';

export default function ContentCategories() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const loadCategories = async (isRefresh = false) => {
    if (!isAuthenticated) return;
    if (!isRefresh) setLoading(true);

    try {
      const data = await api.get('/admin/memes/content-categories');
      setCategories(data || []);
    } catch (error) {
      const message = typeof error === 'string' ? error : 'Failed to load categories';
      toast.error(message);
      console.error('Categories fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, [isAuthenticated]);

  const handleAdd = async (formData) => {
    try {
      await api.post('/admin/memes/content-categories', formData);
      toast.success('Category created successfully');
      setShowAddDialog(false);
      loadCategories(true);
    } catch (error) {
      const message = typeof error === 'string' ? error : 'Failed to create category';
      toast.error(message);
      throw error;
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      await api.delete(`/admin/memes/content-categories/${id}`);
      toast.success('Category deleted successfully');
      loadCategories(true);
    } catch (error) {
      const message = typeof error === 'string' ? error : 'Failed to delete category';
      toast.error(message);
    }
  };

  const tabs = [
    { name: 'All Memes', path: '/admin/memes', icon: MessageSquare },
    { name: 'Posting Categories', path: '/admin/memes/posting-categories', icon: Tag },
    { name: 'Content Categories', path: '/admin/memes/content-categories', icon: FolderOpen },
  ];

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
          <h1 className="text-[22px] font-semibold text-[#1e1b4b] dark:text-white">Content Categories</h1>
          <p className="text-[#64748b] dark:text-slate-400 text-sm mt-1">Manage meme content categories (crypto/stock/trading)</p>
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
        <div className="bg-white dark:bg-neutral-950 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] p-6">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="w-24 h-8" />
                <Skeleton className="w-32 h-8" />
                <Skeleton className="w-20 h-6" />
                <Skeleton className="w-16 h-8" />
                <div className="flex-1" />
                <Skeleton className="w-8 h-8 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <CategoriesTable
          categories={categories}
          onDelete={handleDelete}
        />
      )}

      {showAddDialog && (
        <AddCategoryDialog
          title="Add Content Category"
          onSave={handleAdd}
          onCancel={() => setShowAddDialog(false)}
        />
      )}
    </div>
  );
}
