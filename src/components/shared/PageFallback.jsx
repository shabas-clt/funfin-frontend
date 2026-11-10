// Shown inside the layout while a page's code downloads, so the sidebar
// and header stay in place.
export default function PageFallback() {
  return (
    <div className="flex items-center justify-center py-24" role="status" aria-label="Loading page">
      <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent" />
    </div>
  );
}
