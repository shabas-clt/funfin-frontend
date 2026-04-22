import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { ArrowLeft, Loader2, Save, Send, Archive } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/api/axios';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import ImageUploader from '@/components/shared/ImageUploader';
import VideoUploader from '@/components/shared/VideoUploader';
import FieldError from '@/components/shared/FieldError';
import SyllabusEditor from './SyllabusEditor';
import { courseCreateSchema, courseUpdateSchema } from '@/lib/validation/schemas';
import { applyServerErrors } from '@/lib/validation/serverErrors';
import { formatInr } from '@/lib/format';
import { deleteObject } from '@/api/media';

const LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const CREATE_DEFAULTS = {
  title: '',
  description: '',
  priceInr: 0,
  photo: '',
  videoUrl: '',
  level: 'beginner',
  language: '',
  tags: [],
};

// The funcoin price is derived at purchase time from the live rate, but we
// surface a *live preview* here so the admin knows roughly what students
// will pay in funcoins today. This avoids the previous UI trap where the
// admin had to enter `priceFuncoins` manually and get it wrong.
function FuncoinPreview({ priceInr, rate }) {
  if (!rate || !priceInr || priceInr <= 0) return null;
  const estimate = Math.round(priceInr / rate);
  return (
    <p className="mt-1 text-xs text-indigo-500 dark:text-indigo-400">
      ≈ {estimate.toLocaleString('en-IN')} FunCoins at today&apos;s rate ({formatInr(rate)} / coin)
    </p>
  );
}

export default function CourseEditor() {
  const navigate = useNavigate();
  const location = useLocation();
  const basePath = location.pathname.startsWith('/mentor') ? '/mentor' : '/admin';
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [rate, setRate] = useState(null);
  const [course, setCourse] = useState(null);
  const [tagsDraft, setTagsDraft] = useState('');

  const form = useForm({
    resolver: yupResolver(isEdit ? courseUpdateSchema : courseCreateSchema),
    mode: 'onChange',
    defaultValues: CREATE_DEFAULTS,
  });
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = form;

  const photo = watch('photo');
  const videoUrl = watch('videoUrl');
  const priceInr = watch('priceInr');

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/funcoin/price');
        setRate(res.pricePerCoin || null);
      } catch {
        // Non-fatal; the preview simply won't render.
      }
    })();
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        setInitialLoading(true);
        const res = await api.get(`/courses/${id}`);
        const data = res.course || res;
        setCourse(data);
        reset({
          title: data.title || '',
          description: data.description || '',
          priceInr: data.priceInr || 0,
          photo: data.photo || '',
          videoUrl: data.videoUrl || '',
          level: data.level || 'beginner',
          language: data.language || '',
          tags: data.tags || [],
        });
        setTagsDraft((data.tags || []).join(', '));
      } catch (err) {
        toast.error(typeof err === 'string' ? err : 'Failed to load course');
        navigate(`${basePath}/courses`);
      } finally {
        setInitialLoading(false);
      }
    })();
  }, [basePath, id, isEdit, navigate, reset]);

  const onSubmit = async (values) => {
    // Transform the comma-separated tag input into the array the backend
    // expects. We keep the text field easy to type into and normalize on
    // submit.
    const tags = tagsDraft
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const payload = { ...values, tags };

    setSaving(true);
    try {
      if (isEdit) {
        // Only send fields that actually changed so optional backend
        // fields don't get clobbered with no-ops.
        const diff = {};
        const keys = ['title', 'description', 'priceInr', 'photo', 'videoUrl', 'level', 'language'];
        const norm = (v) => (v === '' || v === undefined ? null : v);
        for (const k of keys) {
          if (norm(course?.[k]) !== norm(payload[k])) {
            // Pass through the user's value (including ""). The backend's
            // PATCH handlers treat `None` as "no change", so to actually
            // clear a field the caller must send the empty string. Only
            // `photo`/`videoUrl` support clearing today; for title and
            // description we also send empty on purpose to surface the
            // 422 from the backend validator if the admin tried that.
            diff[k] = payload[k] ?? '';
          }
        }
        const originalTags = (course?.tags || []).join(',');
        if (originalTags !== tags.join(',')) diff.tags = tags;
        if (Object.keys(diff).length === 0) {
          toast.info('No changes to save');
          setSaving(false);
          return;
        }
        const res = await api.patch(`/courses/${id}`, diff);
        setCourse(res.course || res);
        toast.success('Course updated');
      } else {
        const res = await api.post('/courses', payload);
        const created = res.course || res;
        toast.success('Draft course created');
        // Drop the admin straight into the edit view so they can add
        // modules and videos without an extra click.
        navigate(`${basePath}/courses/${created.id}/edit`, { replace: true });
      }
    } catch (err) {
      const fallback = applyServerErrors(form, err, 'Failed to save course');
      if (fallback) toast.error(fallback);
    } finally {
      setSaving(false);
    }
  };

  const handlePublishToggle = async () => {
    if (!course) return;
    const state = course.state || (course.isPublished ? 'published' : 'draft');
    const isPublished = state === 'published';
    const target = isPublished ? 'unpublish' : 'publish';
    const confirm = await Swal.fire({
      title: `${isPublished ? 'Unpublish' : 'Publish'} this course?`,
      text: isPublished
        ? 'Students will no longer see this course.'
        : 'Students will be able to see and purchase this course.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: isPublished ? 'Unpublish' : 'Publish',
      confirmButtonColor: isPublished ? '#f59e0b' : '#10b981',
    });
    if (!confirm.isConfirmed) return;
    try {
      const res = await api.post(`/courses/${id}/${target}`);
      setCourse(res.course || res);
      toast.success(isPublished ? 'Moved to draft' : 'Published');
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to change state');
    }
  };

  if (initialLoading) {
    return (
      <div className="p-10 flex items-center gap-2 text-slate-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading course...
      </div>
    );
  }

  const state = course?.state || (course?.isPublished ? 'published' : 'draft');
  const isPublished = state === 'published';

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(`${basePath}/courses`)}
            className="w-9 h-9 rounded-lg bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 flex items-center justify-center"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-[22px] font-semibold text-[#1e1b4b] dark:text-white">
              {isEdit ? 'Edit Course' : 'Create New Course'}
            </h1>
            {isEdit ? (
              <p className="text-xs text-slate-500">
                State:{' '}
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                  isPublished
                    ? 'bg-emerald-100/70 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
                    : 'bg-amber-100/70 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400'
                }`}>
                  {state}
                </span>
              </p>
            ) : (
              <p className="text-xs text-slate-500">New courses start in draft. Publish when ready.</p>
            )}
          </div>
        </div>
        {isEdit ? (
          <Button
            type="button"
            onClick={handlePublishToggle}
            className={isPublished ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}
          >
            {isPublished ? <><Archive className="w-4 h-4 mr-1" /> Unpublish</> : <><Send className="w-4 h-4 mr-1" /> Publish</>}
          </Button>
        ) : null}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <Card className="border-0 shadow-[0_2px_10px_rgba(0,0,0,0.04)] bg-white dark:bg-neutral-950 rounded-2xl">
          <CardContent className="p-4 sm:p-6 space-y-4">
            <h2 className="text-[15px] font-bold text-slate-900 dark:text-white">Basics</h2>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Title</label>
              <Input {...register('title')} className="mt-1" />
              <FieldError error={errors.title} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
              <textarea
                {...register('description')}
                rows="4"
                className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm dark:bg-neutral-900 dark:border-neutral-800"
              />
              <FieldError error={errors.description} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Level</label>
                <select
                  {...register('level')}
                  className="mt-1 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm dark:bg-neutral-900 dark:border-neutral-800"
                >
                  {LEVELS.map((l) => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
                <FieldError error={errors.level} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Language</label>
                <Input {...register('language')} className="mt-1" placeholder="English, Hindi..." />
                <FieldError error={errors.language} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tags</label>
                <Input
                  value={tagsDraft}
                  onChange={(e) => setTagsDraft(e.target.value)}
                  placeholder="trading, intraday, nifty"
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-slate-400">Comma-separated. Up to 20 tags, 30 chars each.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-[0_2px_10px_rgba(0,0,0,0.04)] bg-white dark:bg-neutral-950 rounded-2xl">
          <CardContent className="p-4 sm:p-6 space-y-4">
            <h2 className="text-[15px] font-bold text-slate-900 dark:text-white">Pricing</h2>
            <div className="max-w-sm">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Price (INR)</label>
              <Input
                type="number"
                step="1"
                min="0"
                {...register('priceInr', { valueAsNumber: true })}
                className="mt-1"
              />
              <FieldError error={errors.priceInr} />
              <FuncoinPreview priceInr={Number(priceInr) || 0} rate={rate} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-[0_2px_10px_rgba(0,0,0,0.04)] bg-white dark:bg-neutral-950 rounded-2xl">
          <CardContent className="p-4 sm:p-6 space-y-4">
            <h2 className="text-[15px] font-bold text-slate-900 dark:text-white">Media</h2>
            <p className="text-xs text-slate-500">Upload a cover image, a trailer video, or both. At least one is required.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ImageUploader
                label="Cover Image"
                value={photo}
                onChange={(url) => setValue('photo', url, { shouldDirty: true })}
              />
              <VideoUploader
                label="Trailer Video (optional)"
                value={videoUrl}
                onChange={({ url }) => setValue('videoUrl', url, { shouldDirty: true })}
              />
            </div>
            <FieldError error={errors[''] || errors._form} />
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              // If the admin bails on a new course with assets already in
              // R2, try to clean them up so we don't orphan.
              if (!isEdit) {
                if (photo) deleteObject(photo);
                if (videoUrl) deleteObject(videoUrl);
              }
              navigate(`${basePath}/courses`);
            }}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-1" /> Saving...</> : <><Save className="w-4 h-4 mr-1" /> {isEdit ? 'Save Changes' : 'Save Draft'}</>}
          </Button>
        </div>
      </form>

      {isEdit ? (
        <Card className="border-0 shadow-[0_2px_10px_rgba(0,0,0,0.04)] bg-white dark:bg-neutral-950 rounded-2xl">
          <CardContent className="p-4 sm:p-6 space-y-4">
            <h2 className="text-[15px] font-bold text-slate-900 dark:text-white">Modules &amp; Videos</h2>
            <SyllabusEditor courseId={id} />
          </CardContent>
        </Card>
      ) : (
        <p className="text-xs text-slate-400 text-center">Save the course as a draft first to start adding modules and videos.</p>
      )}
    </div>
  );
}
