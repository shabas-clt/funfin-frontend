export default function MemeFilters({ filters, setFilters, setPage }) {
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page when filters change
  };

  return (
    <div className="bg-white dark:bg-neutral-950 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] p-5">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
            Content Category
          </label>
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
          >
            <option value="">All</option>
            <option value="crypto">Crypto</option>
            <option value="stock">Stock</option>
            <option value="trading">Trading</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
            Posting Category
          </label>
          <select
            value={filters.postingCategory}
            onChange={(e) => handleFilterChange('postingCategory', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
          >
            <option value="">All</option>
            <option value="joke">Joke</option>
            <option value="meme">Meme</option>
            <option value="scenario">Scenario</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
            Search User
          </label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder="User ID or name"
            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-slate-900 dark:text-white placeholder:text-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
            Sort By
          </label>
          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
          >
            <option value="latest">Latest</option>
            <option value="popular">Most Liked</option>
          </select>
        </div>
      </div>
    </div>
  );
}