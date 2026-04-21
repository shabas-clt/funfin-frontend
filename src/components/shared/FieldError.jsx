// Tiny helper for rendering react-hook-form validation errors under a field.
// Older pages inline their own copy; new pages should import this one so
// we don't keep fanning out identical 3-line components.

export default function FieldError({ error }) {
  if (!error?.message) return null;
  return (
    <p className="mt-1 text-xs text-rose-500 dark:text-rose-400">
      {error.message}
    </p>
  );
}
