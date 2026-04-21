import { useEffect, useState, useCallback } from 'react';
import { ChevronUp, ChevronDown, Trash, Plus, Loader2, Save, Edit2, Check, X } from 'lucide-react';
import { api } from '@/api/axios';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import VideoUploader from '@/components/shared/VideoUploader';
import ImageUploader from '@/components/shared/ImageUploader';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { deleteObject } from '@/api/media';

// Modules are syllabuses. Each module contains ordered topics (videos).
//
// Topic order is a simple integer (`order`) persisted on each Topic.
// We render topics sorted by `order` ascending; reorder buttons swap
// order values between adjacent rows and PATCH both in a single batch.

function TopicCard({ topic, index, total, onMove, onUpdate, onDelete, busy }) {
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(topic.title);
  const [draftOverview, setDraftOverview] = useState(topic.overview || '');

  const onSaveMeta = async () => {
    const title = (draftTitle || '').trim();
    const overview = (draftOverview || '').trim();
    if (title.length < 2) return toast.error('Title must be at least 2 characters');
    if (overview.length < 10) return toast.error('Overview must be at least 10 characters');
    await onUpdate(topic.id, { title, overview });
    setEditing(false);
  };

  const onVideoChange = async ({ url, durationSec }) => {
    if (!url && !topic.videoUrl) return;
    if (!url) return;
    await onUpdate(topic.id, { videoUrl: url, durationSec });
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-neutral-800 bg-slate-50/60 dark:bg-neutral-900/60 p-3">
      <div className="flex items-center gap-2">
        <div className="flex flex-col">
          <button
            type="button"
            disabled={index === 0 || busy}
            onClick={() => onMove(topic, 'up')}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-200 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Move up"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={index === total - 1 || busy}
            onClick={() => onMove(topic, 'down')}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-200 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Move down"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="space-y-2">
              <Input
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                placeholder="Video title"
              />
              <textarea
                value={draftOverview}
                onChange={(e) => setDraftOverview(e.target.value)}
                placeholder="Short overview"
                rows={2}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm dark:bg-neutral-900 dark:border-neutral-800"
              />
              <div className="flex items-center gap-2">
                <Button size="sm" type="button" onClick={onSaveMeta} className="h-8">
                  <Check className="w-3.5 h-3.5 mr-1" /> Save
                </Button>
                <Button
                  size="sm"
                  type="button"
                  variant="outline"
                  className="h-8"
                  onClick={() => {
                    setDraftTitle(topic.title);
                    setDraftOverview(topic.overview || '');
                    setEditing(false);
                  }}
                >
                  <X className="w-3.5 h-3.5 mr-1" /> Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                {index + 1}. {topic.title}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                {topic.overview}
              </p>
              {topic.durationSec ? (
                <p className="text-[11px] text-slate-400 mt-1">
                  Duration: {Math.floor(topic.durationSec / 60)}m {topic.durationSec % 60}s
                </p>
              ) : null}
            </>
          )}
        </div>

        <div className="flex flex-col gap-1 shrink-0">
          {!editing ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              disabled={busy}
              className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center"
              aria-label="Edit title/overview"
            >
              <Edit2 className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => onDelete(topic)}
            disabled={busy}
            className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-900/40 flex items-center justify-center"
            aria-label="Delete video"
          >
            <Trash className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
          </button>
        </div>
      </div>

      <div className="mt-3">
        <VideoUploader
          label="Video file"
          value={topic.videoUrl}
          durationSec={topic.durationSec}
          onChange={onVideoChange}
        />
      </div>
    </div>
  );
}

function NewTopicForm({ syllabusId, courseId, nextOrder, onCreated }) {
  const [title, setTitle] = useState('');
  const [overview, setOverview] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [durationSec, setDurationSec] = useState(0);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setTitle('');
    setOverview('');
    setVideoUrl('');
    setDurationSec(0);
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if ((title || '').trim().length < 2) return toast.error('Title must be at least 2 characters');
    if ((overview || '').trim().length < 10) return toast.error('Overview must be at least 10 characters');
    if (!videoUrl) return toast.error('Upload a video first');

    setSaving(true);
    try {
      const res = await api.post('/topics', {
        syllabusId,
        courseId,
        title: title.trim(),
        overview: overview.trim(),
        videoUrl,
        order: nextOrder,
        durationSec,
      });
      onCreated(res.topic);
      toast.success('Video added');
      reset();
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to add video');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-dashed border-slate-300 dark:border-neutral-700 p-3 space-y-3">
      <p className="text-xs uppercase tracking-wide font-semibold text-slate-500">Add new video</p>
      <Input placeholder="Video title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea
        value={overview}
        onChange={(e) => setOverview(e.target.value)}
        placeholder="Short overview (min 10 characters)"
        rows={2}
        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm dark:bg-neutral-900 dark:border-neutral-800"
      />
      <VideoUploader
        label="Video file"
        value={videoUrl}
        durationSec={durationSec}
        onChange={({ url, durationSec: d }) => {
          setVideoUrl(url);
          setDurationSec(d);
        }}
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Plus className="w-3.5 h-3.5 mr-1" />}
          Add Video
        </Button>
      </div>
    </form>
  );
}

function ModuleCard({ module: mod, allTopics, courseId, onChanged, onDelete }) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState(mod.title);
  const [draftLabel, setDraftLabel] = useState(mod.moduleLabel);
  const [busy, setBusy] = useState(false);
  const [cover, setCover] = useState(mod.coverImage || '');

  const topics = allTopics
    .filter((t) => t.syllabusId === mod.id)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const saveMeta = async () => {
    setBusy(true);
    try {
      await api.patch(`/syllabuses/${mod.id}`, {
        title: draftTitle,
        moduleLabel: draftLabel,
      });
      toast.success('Module updated');
      setEditingTitle(false);
      onChanged();
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to save module');
    } finally {
      setBusy(false);
    }
  };

  const saveCover = async (url) => {
    setCover(url);
    setBusy(true);
    try {
      await api.patch(`/syllabuses/${mod.id}`, { coverImage: url });
      onChanged();
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to save cover');
    } finally {
      setBusy(false);
    }
  };

  const handleTopicUpdate = async (topicId, patch) => {
    setBusy(true);
    try {
      await api.patch(`/topics/${topicId}`, patch);
      onChanged();
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to save video');
    } finally {
      setBusy(false);
    }
  };

  const handleTopicDelete = async (topic) => {
    const confirm = await Swal.fire({
      title: `Delete "${topic.title}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      confirmButtonColor: '#ef4444',
    });
    if (!confirm.isConfirmed) return;
    setBusy(true);
    try {
      await api.delete(`/topics/${topic.id}`);
      if (topic.videoUrl) deleteObject(topic.videoUrl);
      toast.success('Video deleted');
      onChanged();
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to delete video');
    } finally {
      setBusy(false);
    }
  };

  const handleMove = async (topic, dir) => {
    const idx = topics.findIndex((t) => t.id === topic.id);
    const neighbor = topics[dir === 'up' ? idx - 1 : idx + 1];
    if (!neighbor) return;
    setBusy(true);
    try {
      await Promise.all([
        api.patch(`/topics/${topic.id}`, { order: neighbor.order || 0 }),
        api.patch(`/topics/${neighbor.id}`, { order: topic.order || 0 }),
      ]);
      onChanged();
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to reorder');
    } finally {
      setBusy(false);
    }
  };

  const nextOrder = topics.length > 0 ? Math.max(...topics.map((t) => t.order || 0)) + 1 : 0;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          {editingTitle ? (
            <div className="flex flex-col sm:flex-row gap-2">
              <Input value={draftLabel} onChange={(e) => setDraftLabel(e.target.value)} placeholder="Label (e.g. Module 1)" className="sm:max-w-[160px]" />
              <Input value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} placeholder="Module title" />
              <div className="flex items-center gap-2">
                <Button size="sm" type="button" onClick={saveMeta} disabled={busy} className="h-9">
                  <Check className="w-3.5 h-3.5 mr-1" /> Save
                </Button>
                <Button size="sm" type="button" variant="outline" onClick={() => { setEditingTitle(false); setDraftLabel(mod.moduleLabel); setDraftTitle(mod.title); }} className="h-9">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-xs uppercase font-semibold text-indigo-500 tracking-wide">{mod.moduleLabel}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{mod.title}</h3>
                <button type="button" onClick={() => setEditingTitle(true)} className="text-slate-400 hover:text-indigo-500" aria-label="Edit module">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{topics.length} video{topics.length === 1 ? '' : 's'}</p>
            </>
          )}
        </div>
        <button type="button" onClick={onDelete} className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-900/40 flex items-center justify-center" aria-label="Delete module">
          <Trash className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
        </button>
      </div>

      <div className="mt-3 max-w-md">
        <ImageUploader label="Module cover (optional)" value={cover} onChange={saveCover} />
      </div>

      <div className="mt-4 space-y-2">
        {topics.map((topic, idx) => (
          <TopicCard
            key={topic.id}
            topic={topic}
            index={idx}
            total={topics.length}
            busy={busy}
            onMove={handleMove}
            onUpdate={handleTopicUpdate}
            onDelete={handleTopicDelete}
          />
        ))}
        <NewTopicForm
          syllabusId={mod.id}
          courseId={courseId}
          nextOrder={nextOrder}
          onCreated={() => onChanged()}
        />
      </div>
    </div>
  );
}

export default function SyllabusEditor({ courseId }) {
  const [modules, setModules] = useState([]);
  const [topics, setTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newLabel, setNewLabel] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      const [syl, top] = await Promise.all([
        api.get('/syllabuses', { params: { courseId, limit: 200 } }),
        api.get('/topics', { params: { courseId, limit: 500 } }),
      ]);
      setModules(syl.syllabuses || []);
      setTopics(top.topics || []);
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to load modules');
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (courseId) load();
  }, [courseId, load]);

  const handleCreateModule = async (event) => {
    event.preventDefault();
    const label = newLabel.trim();
    const title = newTitle.trim();
    if (!label) return toast.error('Module label is required');
    if (title.length < 2) return toast.error('Module title must be at least 2 characters');

    setCreating(true);
    try {
      await api.post('/syllabuses', { courseId, title, moduleLabel: label });
      toast.success('Module added');
      setNewLabel('');
      setNewTitle('');
      load();
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to add module');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteModule = async (mod) => {
    const confirm = await Swal.fire({
      title: `Delete module "${mod.title}"?`,
      text: 'Videos belonging to this module will also be removed from the module but the video rows remain in the database.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      confirmButtonColor: '#ef4444',
    });
    if (!confirm.isConfirmed) return;
    try {
      await api.delete(`/syllabuses/${mod.id}`);
      toast.success('Module deleted');
      load();
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to delete module');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center gap-2 text-slate-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading modules...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleCreateModule} className="rounded-2xl border border-dashed border-slate-300 dark:border-neutral-700 p-4 bg-slate-50/60 dark:bg-neutral-900/40">
        <p className="text-xs uppercase tracking-wide font-semibold text-slate-500 mb-3">Add new module</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input placeholder="Label (e.g. Module 1)" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} className="sm:max-w-[180px]" />
          <Input placeholder="Module title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
          <Button type="submit" disabled={creating} className="bg-indigo-600 hover:bg-indigo-700 text-white h-10">
            {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />}
            Add
          </Button>
        </div>
      </form>

      {modules.length === 0 ? (
        <p className="text-center text-sm text-slate-400 py-6">No modules yet. Add your first module above.</p>
      ) : (
        <div className="space-y-4">
          {modules.map((mod) => (
            <ModuleCard
              key={mod.id}
              module={mod}
              allTopics={topics}
              courseId={courseId}
              onChanged={load}
              onDelete={() => handleDeleteModule(mod)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
