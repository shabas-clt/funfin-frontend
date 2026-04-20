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

const TRADING_COURSES = [
  {
    id: 'mock-1',
    title: 'Stock Market Fundamentals',
    priceInr: 499,
    duration: '40 Hours',
    totalModules: 12,
    isPublished: true,
    isUpcoming: false,
    instructor: 'Rajesh Kumar',
    sale: 843,
    photo: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=100&h=100&fit=crop',
  },
  {
    id: 'mock-2',
    title: 'Technical Analysis Mastery',
    priceInr: 799,
    duration: '56 Hours',
    totalModules: 18,
    isPublished: true,
    isUpcoming: false,
    instructor: 'Priya Sharma',
    sale: 621,
    photo: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=100&h=100&fit=crop',
  },
  {
    id: 'mock-3',
    title: 'Options & Derivatives Trading',
    priceInr: 1199,
    duration: '72 Hours',
    totalModules: 24,
    isPublished: false,
    isUpcoming: false,
    instructor: 'Arjun Mehta',
    sale: 385,
    photo: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=100&h=100&fit=crop',
  },
  {
    id: 'mock-4',
    title: 'Forex Trading Strategies',
    priceInr: 649,
    duration: '48 Hours',
    totalModules: 15,
    isPublished: true,
    isUpcoming: false,
    instructor: 'Sneha Verma',
    sale: 512,
    photo: 'https://images.unsplash.com/photo-1565372195458-9de0b320ef04?w=100&h=100&fit=crop',
  },
  {
    id: 'mock-5',
    title: 'Cryptocurrency & Web3 Investing',
    priceInr: 999,
    duration: '64 Hours',
    totalModules: 20,
    isPublished: false,
    isUpcoming: true,
    instructor: 'Vikram Nair',
    sale: 278,
    photo: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=100&h=100&fit=crop',
  },
  {
    id: 'mock-6',
    title: 'Mutual Funds & SIP Planning',
    priceInr: 399,
    duration: '32 Hours',
    totalModules: 10,
    isPublished: true,
    isUpcoming: false,
    instructor: 'Anita Bose',
    sale: 967,
    photo: 'https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?w=100&h=100&fit=crop',
  },
];

const FILTER_OPTIONS = ['All', 'Published', 'Pause', 'Upcoming'];

export default function CourseManagement() {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [dateRange, setDateRange] = useState(undefined);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentCourse, setCurrentCourse] = useState(null);

  const [formData, setFormData] = useState({
    title: '', description: '', priceInr: 0, priceFuncoins: 0,
    duration: '', photo: '', videoUrl: '', totalModules: 0, isPublished: false,
  });

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/courses');
      setCourses(res.courses || []);
    } catch {
      setCourses(TRADING_COURSES);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchCourses(); }, []);

  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      const status = c.isUpcoming ? 'Upcoming' : (c.isPublished ? 'Published' : 'Pause');
      const matchesStatus = !filterStatus || status === filterStatus;
      const matchesSearch = !searchQuery || c.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [courses, filterStatus, searchQuery]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev, [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value),
    }));
  };

  const openAddModal = () => {
    setFormData({ title: '', description: '', priceInr: 0, priceFuncoins: 0, duration: '', photo: '', videoUrl: '', totalModules: 0, isPublished: false });
    setIsAddModalOpen(true);
  };

  const openEditModal = (course) => {
    setCurrentCourse(course);
    setFormData({
      title: course.title, description: course.description || '', priceInr: course.priceInr || 0,
      priceFuncoins: course.priceFuncoins || 0, duration: course.duration || '',
      photo: course.photo || '', videoUrl: course.videoUrl || '',
      totalModules: course.totalModules || 0, isPublished: course.isPublished || false,
    });
    setIsEditModalOpen(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/courses', formData);
      setIsAddModalOpen(false);
      fetchCourses();
      toast.success('Course created successfully');
    } catch {
      toast.error('Failed to create course');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/courses/${currentCourse.id}`, formData);
      setIsEditModalOpen(false);
      fetchCourses();
      toast.success('Course updated successfully');
    } catch {
      toast.error('Failed to update course');
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete course?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/courses/${id}`);
      fetchCourses();
      toast.success('Course deleted');
    } catch {
      toast.error('Failed to delete course');
    }
  };

  const formFields = (
    <div className="space-y-4 max-h-[65vh] overflow-y-auto px-1 pr-2">
      <div>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Course Title</label>
        <Input name="title" value={formData.title} onChange={handleInputChange} required minLength={2} className="dark:bg-slate-700 dark:border-slate-600 dark:text-white mt-1" />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
        <textarea
          name="description" value={formData.description} onChange={handleInputChange} required minLength={10}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 min-h-[80px] dark:bg-slate-700 dark:border-slate-600 dark:text-white mt-1"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Price (INR)</label>
          <Input type="number" name="priceInr" value={formData.priceInr} onChange={handleInputChange} min={0} className="dark:bg-slate-700 dark:border-slate-600 dark:text-white mt-1" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Price (FunCoins)</label>
          <Input type="number" name="priceFuncoins" value={formData.priceFuncoins} onChange={handleInputChange} min={0} className="dark:bg-slate-700 dark:border-slate-600 dark:text-white mt-1" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Duration</label>
          <Input name="duration" value={formData.duration} onChange={handleInputChange} required className="dark:bg-slate-700 dark:border-slate-600 dark:text-white mt-1" />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Total Modules</label>
          <Input type="number" name="totalModules" value={formData.totalModules} onChange={handleInputChange} min={0} className="dark:bg-slate-700 dark:border-slate-600 dark:text-white mt-1" />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Banner Photo URL</label>
        <Input name="photo" value={formData.photo} onChange={handleInputChange} className="dark:bg-slate-700 dark:border-slate-600 dark:text-white mt-1" />
      </div>
      <div className="flex items-center gap-2 pt-1">
        <input type="checkbox" name="isPublished" checked={formData.isPublished} onChange={handleInputChange} id="isPublishedField" className="accent-indigo-500" />
        <label htmlFor="isPublishedField" className="text-sm text-slate-700 dark:text-slate-300">Publish immediately</label>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold text-[#1e1b4b] dark:text-white">Courses</h1>
          <p className="text-[#64748b] dark:text-slate-400 text-sm mt-1">Manage your trading & finance courses</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 px-4 shadow-sm h-10">
            <Download className="w-4 h-4" /> Export
          </Button>
          <Button onClick={openAddModal} className="bg-[#6366f1] hover:bg-indigo-600 text-white shadow-sm flex items-center gap-2 px-4 h-10">
            + Add Course
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-[0_2px_10px_rgba(0,0,0,0.04)] bg-white dark:bg-slate-800 rounded-2xl overflow-hidden pb-4">
        <CardContent className="p-0">
          <div className="p-5 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:w-[340px]">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-[13px] bg-[#f8fafc] dark:bg-slate-900 border border-transparent dark:border-slate-700 focus:border-slate-200 dark:focus:border-slate-600 focus:bg-white dark:focus:bg-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-100 dark:focus:ring-slate-700 transition-all placeholder:text-slate-400 dark:text-slate-300"
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
                <tr className="border-b border-slate-100 dark:border-slate-700 text-slate-900 dark:text-slate-200">
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Course</th>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Instructor</th>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Sales</th>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Price</th>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Lessons</th>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Duration</th>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Status</th>
                  <th className="px-5 py-4 font-semibold text-[12px] uppercase tracking-wide text-slate-500 dark:text-slate-400 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50 text-slate-600 dark:text-slate-300 font-medium">
                {isLoading ? (
                  <TableSkeleton rows={6} cols={8} />
                ) : filteredCourses.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-10 text-center text-slate-400 dark:text-slate-500">No courses match your filter</td>
                  </tr>
                ) : filteredCourses.map((course) => {
                  const statusText = course.isUpcoming ? 'Upcoming' : (course.isPublished ? 'Published' : 'Pause');
                  const badgeClass =
                    statusText === 'Published' ? 'bg-emerald-100/70 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400' :
                    statusText === 'Upcoming'  ? 'bg-amber-100/70 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400' :
                                                 'bg-rose-100/70 text-rose-500 dark:bg-rose-900/40 dark:text-rose-400';

                  return (
                    <tr key={course.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 group transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden shadow-sm shrink-0">
                            <img src={course.photo || 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=100&h=100&fit=crop'} alt="course" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{course.title}</p>
                            <p className="text-[11px] text-slate-400 font-normal">#{course.id.replace('mock-', 'FF')}{Math.floor(Math.random() * 9000 + 1000)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">{course.instructor}</td>
                      <td className="px-5 py-3.5">{course.sale}</td>
                      <td className="px-5 py-3.5 text-slate-900 dark:text-white font-semibold">₹{course.priceInr}</td>
                      <td className="px-5 py-3.5">{course.totalModules}</td>
                      <td className="px-5 py-3.5">{course.duration}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${badgeClass}`}>{statusText}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors flex items-center justify-center">
                            <Eye className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                          </button>
                          <button onClick={() => openEditModal(course)} className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors flex items-center justify-center">
                            <Edit className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                          </button>
                          <button onClick={() => handleDelete(course.id)} className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-900/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors flex items-center justify-center">
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

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Create Course">
        <form onSubmit={handleAddSubmit}>
          {formFields}
          <div className="flex justify-end gap-2 pt-4 border-t dark:border-slate-700 mt-4">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">Create</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Course">
        <form onSubmit={handleEditSubmit}>
          {formFields}
          <div className="flex justify-end gap-2 pt-4 border-t dark:border-slate-700 mt-4">
            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">Save Changes</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
