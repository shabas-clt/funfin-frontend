import { useState, useEffect } from 'react';
import { Plus, Trash, Edit, Eye, EyeOff, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { TableSkeleton } from '@/components/ui/skeleton';
import { api } from '@/api/axios';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import FieldError from '@/components/shared/FieldError';

export default function TokenManagement() {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingToken, setEditingToken] = useState(null);
  const [visibleTokens, setVisibleTokens] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    token: '',
    name: '',
    description: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    try {
      setLoading(true);
      const response = await api.get('/live-engine/tokens');
      setTokens(response);
    } catch (error) {
      toast.error('Failed to fetch tokens');
    } finally {
      setLoading(false);
    }
  };

  const toggleTokenVisibility = (tokenId) => {
    const newVisible = new Set(visibleTokens);
    if (newVisible.has(tokenId)) {
      newVisible.delete(tokenId);
    } else {
      newVisible.add(tokenId);
    }
    setVisibleTokens(newVisible);
  };

  const maskToken = (token) => {
    if (token.length <= 12) return '*'.repeat(token.length);
    return `${token.slice(0, 8)}...${token.slice(-4)}`;
  };

  const openAddModal = () => {
    setEditingToken(null);
    setFormData({ token: '', name: '', description: '' });
    setFormErrors({});
    setShowModal(true);
  };

  const openEditModal = (token) => {
    setEditingToken(token);
    setFormData({
      token: token.token,
      name: token.name,
      description: token.description || '',
    });
    setFormErrors({});
    setShowModal(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.token.trim()) errors.token = 'Token is required';
    if (!formData.name.trim()) errors.name = 'Name is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      if (editingToken) {
        await api.patch(`/live-engine/tokens/${editingToken.id}`, formData);
        toast.success('Token updated successfully');
      } else {
        await api.post('/live-engine/tokens', formData);
        toast.success('Token added successfully');
      }
      setShowModal(false);
      fetchTokens();
    } catch (error) {
      toast.error(typeof error === 'string' ? error : 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (tokenId, tokenName) => {
    const result = await Swal.fire({
      title: 'Delete token?',
      text: `Are you sure you want to delete "${tokenName}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/live-engine/tokens/${tokenId}`);
      toast.success('Token deleted successfully');
      fetchTokens();
    } catch (error) {
      toast.error(typeof error === 'string' ? error : 'Failed to delete token');
    }
  };

  const filteredTokens = tokens.filter((token) =>
    token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const inputClass = 'dark:bg-neutral-900 dark:border-neutral-800 dark:text-white mt-1';

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold text-[#1e1b4b] dark:text-white">
            Token Management
          </h1>
          <p className="text-[#64748b] dark:text-slate-400 text-sm mt-1">
            Manage your Tiingo API tokens for data collection
          </p>
        </div>
        <Button
          onClick={openAddModal}
          className="bg-[#6366f1] hover:bg-indigo-600 text-white shadow-sm flex items-center gap-2 px-4 h-10 w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" /> Add Token
        </Button>
      </div>

      <Card className="border-0 shadow-[0_2px_10px_rgba(0,0,0,0.04)] bg-white dark:bg-neutral-950 rounded-2xl overflow-hidden pb-4">
        <CardContent className="p-0">
          <div className="p-4 sm:p-5">
            <div className="relative w-full lg:w-[340px]">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search tokens..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-[13px] bg-[#f8fafc] dark:bg-neutral-900 border border-transparent dark:border-neutral-800 focus:border-slate-200 dark:focus:border-neutral-700 focus:bg-white dark:focus:bg-neutral-950 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-100 dark:focus:ring-neutral-800 transition-all placeholder:text-slate-400 dark:text-slate-300"
              />
            </div>
          </div>

          {/* Mobile View */}
          <div className="md:hidden px-3 pb-3 space-y-2">
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-24 bg-slate-100 dark:bg-neutral-900 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filteredTokens.length === 0 ? (
              <p className="p-6 text-center text-slate-400 dark:text-slate-500 text-sm">
                No tokens found
              </p>
            ) : (
              filteredTokens.map((token) => (
                <div
                  key={token.id}
                  className="rounded-xl border border-slate-100 dark:border-neutral-800 p-3 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {token.name}
                      </p>
                      {token.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {token.description}
                        </p>
                      )}
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 ml-2 ${
                        token.status === 'active'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                          : token.status === 'rate_limited'
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400'
                          : 'bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-slate-300'
                      }`}
                    >
                      {token.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-slate-100 dark:bg-neutral-900 px-2 py-1 rounded flex-1 truncate">
                      {visibleTokens.has(token.id) ? token.token : maskToken(token.token)}
                    </code>
                    <button
                      onClick={() => toggleTokenVisibility(token.id)}
                      className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 p-1"
                    >
                      {visibleTokens.has(token.id) ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    <div>Hourly: {token.hourly_requests}/50</div>
                    <div>Daily: {token.daily_requests}/1000</div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => openEditModal(token)}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-xs font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(token.id, token.name)}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop View */}
          <div className="hidden md:block overflow-x-auto px-2">
            <table className="w-full text-[13px] text-left whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-100 dark:border-neutral-800">
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Name
                  </th>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Token
                  </th>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Status
                  </th>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Usage
                  </th>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-neutral-800/70 text-slate-600 dark:text-slate-300 font-medium">
                {loading ? (
                  <TableSkeleton rows={5} cols={5} />
                ) : filteredTokens.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-10 text-center text-slate-400 dark:text-slate-500">
                      No tokens found
                    </td>
                  </tr>
                ) : (
                  filteredTokens.map((token) => (
                    <tr
                      key={token.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-neutral-900/70 group transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">
                            {token.name}
                          </p>
                          {token.description && (
                            <p className="text-[11px] text-slate-400 font-normal">
                              {token.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <code className="text-sm bg-slate-100 dark:bg-neutral-900 px-2 py-1 rounded">
                            {visibleTokens.has(token.id) ? token.token : maskToken(token.token)}
                          </code>
                          <button
                            onClick={() => toggleTokenVisibility(token.id)}
                            className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 p-1"
                            title={visibleTokens.has(token.id) ? 'Hide token' : 'Show token'}
                          >
                            {visibleTokens.has(token.id) ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                            token.status === 'active'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                              : token.status === 'rate_limited'
                              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400'
                              : 'bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-slate-300'
                          }`}
                        >
                          {token.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-sm">
                          <div>Hourly: {token.hourly_requests}/50</div>
                          <div>Daily: {token.daily_requests}/1000</div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(token)}
                            className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors flex items-center justify-center"
                          >
                            <Edit className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                          </button>
                          <button
                            onClick={() => handleDelete(token.id, token.name)}
                            className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-900/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors flex items-center justify-center"
                          >
                            <Trash className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingToken ? 'Edit Token' : 'Add New Token'}
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Token
            </label>
            <div className="relative">
              <Input
                type={visibleTokens.has('form') ? 'text' : 'password'}
                value={formData.token}
                onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                className={inputClass}
                placeholder="Your Tiingo API token"
              />
              <button
                type="button"
                onClick={() => {
                  const newVisible = new Set(visibleTokens);
                  if (newVisible.has('form')) {
                    newVisible.delete('form');
                  } else {
                    newVisible.add('form');
                  }
                  setVisibleTokens(newVisible);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500"
              >
                {visibleTokens.has('form') ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {formErrors.token && <FieldError error={{ message: formErrors.token }} />}
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={inputClass}
              placeholder="Token 1"
            />
            {formErrors.name && <FieldError error={{ message: formErrors.name }} />}
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Description (Optional)
            </label>
            <Input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={inputClass}
              placeholder="Primary token for data collection"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t dark:border-neutral-800">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {submitting ? 'Saving...' : editingToken ? 'Update' : 'Add'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
