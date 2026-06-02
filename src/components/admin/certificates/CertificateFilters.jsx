export default function CertificateFilters({ filters, setFilters, setPage }) {
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page when filters change
  };

  const selectClass =
    'w-full px-3 py-2 text-sm border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400';

  return (
    <div className="bg-white dark:bg-neutral-950 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] p-5">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
            Search
          </label>
          <input
            type="text"
            value={filters.q}
            onChange={(e) => handleFilterChange('q', e.target.value)}
            placeholder="Certificate ID, student or course"
            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-slate-900 dark:text-white placeholder:text-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
            Status
          </label>
          <select
            value={filters.revoked}
            onChange={(e) => handleFilterChange('revoked', e.target.value)}
            className={selectClass}
          >
            <option value="">All</option>
            <option value="false">Active</option>
            <option value="true">Revoked</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
            Sort By
          </label>
          <select
            value={filters.sort_by}
            onChange={(e) => handleFilterChange('sort_by', e.target.value)}
            className={selectClass}
          >
            <option value="issuedAt">Issued date</option>
            <option value="completionDate">Completion date</option>
            <option value="certificateId">Certificate ID</option>
            <option value="studentName">Student name</option>
            <option value="courseTitle">Course title</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
            Order
          </label>
          <select
            value={filters.order}
            onChange={(e) => handleFilterChange('order', e.target.value)}
            className={selectClass}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>
    </div>
  );
}
