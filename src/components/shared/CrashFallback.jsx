// Shown when a page crashes instead of a blank screen. The crash has already
// been sent to Sentry by the error boundary.
export default function CrashFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F0f2f5] dark:bg-black p-6">
      <div className="max-w-md w-full bg-white dark:bg-neutral-950 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.06)] p-8 text-center">
        <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Something went wrong</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          This page hit an error and the team has been notified. Reload to try again.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 inline-flex items-center justify-center h-10 px-5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium"
        >
          Reload
        </button>
      </div>
    </div>
  );
}
