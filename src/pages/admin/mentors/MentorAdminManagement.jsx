import { useState, useEffect, useMemo } from 'react';
import { Search, Edit, Trash, Eye, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { TableSkeleton } from '@/components/ui/skeleton';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { api } from '@/api/axios';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const FILTER_OPTIONS = ['All', 'Active', 'Inactive'];

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function MentorAdminManagement() {
  const [staff, setStaff] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [dateRange, setDateRange] = useState(undefined);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState(null);

  const [formData, setFormData] = useState({
    fullName: '', email: '', password: '', role: 'admin', isActive: true,
  });

  const fetchAdmins = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/admins');
      setStaff(res.admins || []);
    } catch {
      setStaff([]);
      toast.error('Failed to load admins');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAdmins(); }, []);

  const filtered = useMemo(() => {
    return staff.filter((person) => {
      const status = person.isActive ? 'Active' : 'Inactive';
      const matchesStatus = !filterStatus || status === filterStatus;
      const matchesSearch = !searchQuery
        || person.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
        || person.email?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [staff, filterStatus, searchQuery]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const openAddModal = () => {
    setFormData({ fullName: '', email: '', password: '', role: 'admin', isActive: true });
    setIsAddModalOpen(true);
  };

  const openEditModal = (admin) => {
    setCurrentAdmin(admin);
    setFormData({
      fullName: admin.fullName,
      email: admin.email,
      password: '',
      role: admin.role,
      isActive: admin.isActive,
    });
    setIsEditModalOpen(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admins', formData);
      setIsAddModalOpen(false);
      fetchAdmins();
      toast.success('Admin created successfully');
    } catch (error) {
      toast.error(error?.detail || 'Failed to create admin');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (!payload.password) delete payload.password;
      await api.patch(`/admins/${currentAdmin.id}`, payload);
      setIsEditModalOpen(false);
      fetchAdmins();
      toast.success('Admin updated successfully');
    } catch (error) {
      toast.error(error?.detail || 'Failed to update admin');
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Remove admin?',
      text: 'This will permanently remove the admin account.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, remove',
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/admins/${id}`);
      fetchAdmins();
      toast.success('Admin removed');
    } catch (error) {
      toast.error(error?.detail || 'Failed to remove admin');
    }
  };

  const inputClass = 'dark:bg-neutral-900 dark:border-neutral-800 dark:text-white mt-1';

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold text-[#1e1b4b] dark:text-white">Admins</h1>
          <p className="text-[#64748b] dark:text-slate-400 text-sm mt-1">Manage admin accounts from backend</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 px-4 shadow-sm h-10">
            <Download className="w-4 h-4" /> Export
          </Button>
          <Button onClick={openAddModal} className="bg-[#6366f1] hover:bg-indigo-600 text-white shadow-sm flex items-center gap-2 px-4 h-10">
            + Add Admin
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-[0_2px_10px_rgba(0,0,0,0.04)] bg-white dark:bg-neutral-950 rounded-2xl overflow-hidden pb-4">
        <CardContent className="p-0">
          <div className="p-5 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:w-[340px]">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-[13px] bg-[#f8fafc] dark:bg-neutral-900 border border-transparent dark:border-neutral-800 focus:border-slate-200 dark:focus:border-neutral-700 focus:bg-white dark:focus:bg-neutral-950 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-100 dark:focus:ring-neutral-800 transition-all placeholder:text-slate-400 dark:text-slate-300"
              />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <FilterDropdown options={FILTER_OPTIONS} value={filterStatus} onChange={setFilterStatus} />
              <DateRangePicker value={dateRange} onChange={setDateRange} />
            </div>
          </div>

          <div className="overflow-x-auto px-2">
            <table className="w-full text-[13px] text-left whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-100 dark:border-neutral-800">
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Name</th>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Email</th>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Role</th>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Joined</th>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Status</th>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-neutral-800/70 text-slate-600 dark:text-slate-300 font-medium">
                {isLoading ? (
                  <TableSkeleton rows={5} cols={6} />
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-10 text-center text-slate-400 dark:text-slate-500">No admins match your filter</td>
                  </tr>
                ) : filtered.map((person) => {
                  const statusText = person.isActive ? 'Active' : 'Inactive';
                  const badgeClass = person.isActive
                    ? 'bg-emerald-100/70 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
                    : 'bg-rose-100/70 text-rose-500 dark:bg-rose-900/40 dark:text-rose-400';

                  return (
                    <tr key={person.id} className="hover:bg-slate-50/80 dark:hover:bg-neutral-900/70 group transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <img
                            src={`https://ui-avatars.com/api/?name=${person.fullName}&background=6366f1&color=fff&rounded=true`}
                            alt="avatar"
                            className="w-9 h-9 rounded-full shadow-sm"
                          />
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{person.fullName}</p>
                            <p className="text-[11px] text-slate-400 font-normal">#{person.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{person.email}</td>
                      <td className="px-5 py-3.5 uppercase">{person.role}</td>
                      <td className="px-5 py-3.5">{formatDate(person.createdAt)}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${badgeClass}`}>{statusText}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors flex items-center justify-center">
                            <Eye className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                          </button>
                          <button onClick={() => openEditModal(person)} className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors flex items-center justify-center">
                            <Edit className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                          </button>
                          <button onClick={() => handleDelete(person.id)} className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-900/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors flex items-center justify-center">
                            <Trash className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Admin">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
            <Input name="fullName" value={formData.fullName} onChange={handleInputChange} required className={inputClass} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
            <Input type="email" name="email" value={formData.email} onChange={handleInputChange} required className={inputClass} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
            <Input type="password" name="password" value={formData.password} onChange={handleInputChange} required className={inputClass} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Role</label>
            <select name="role" value={formData.role} onChange={handleInputChange} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm dark:bg-neutral-900 dark:border-neutral-800 dark:text-white mt-1">
              <option value="admin">Admin</option>
              <option value="superadmin">Superadmin</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} id="isActiveAdd" className="accent-indigo-500" />
            <label htmlFor="isActiveAdd" className="text-sm dark:text-slate-300">Account Active</label>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t dark:border-neutral-800">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">Create</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Admin">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
            <Input name="fullName" value={formData.fullName} onChange={handleInputChange} required className={inputClass} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
            <Input type="email" name="email" value={formData.email} onChange={handleInputChange} required className={inputClass} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
            <Input type="password" name="password" value={formData.password} onChange={handleInputChange} placeholder="Leave blank to keep current" className={inputClass} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} id="isActiveEdit" className="accent-indigo-500" />
            <label htmlFor="isActiveEdit" className="text-sm dark:text-slate-300">Account Active</label>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t dark:border-neutral-800">
            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
