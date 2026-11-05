import { api } from './axios';

// Admin review queue for user reports (backend: app/api/admin/moderation.py).
// Apple guideline 1.2 expects reports on user content to be acted on within
// 24 hours; the summary counts how many are past that window.
//
// The axios interceptor unwraps `response.data`, so these resolve to the JSON body.
export const moderationApi = {
  summary: async () => api.get('/moderation/summary'),

  // Filters: status (omit for the open queue: pending + reviewing), targetType,
  // reason, targetUserId, skip, limit. Oldest first.
  reports: async (params = {}) => api.get('/moderation/reports', { params }),

  report: async (id) => api.get(`/moderation/reports/${id}`),

  // action: dismiss | remove_content | suspend_author. Resolving one report
  // closes every other open report on the same content.
  resolve: async (id, action, note) =>
    api.post(`/moderation/reports/${id}/resolve`, { action, note }),

  restoreVideo: async (videoId) => api.post(`/moderation/videos/${videoId}/restore`),
  reinstateUser: async (userId) => api.post(`/moderation/users/${userId}/reinstate`),
};

export const SLA_HOURS = 24;

export const REASON_LABELS = {
  spam: 'Spam',
  financial_scam: 'Financial scam',
  nudity_or_sexual: 'Nudity or sexual',
  violence: 'Violence',
  hate_or_harassment: 'Hate or harassment',
  self_harm: 'Self-harm',
  misinformation: 'Misinformation',
  intellectual_property: 'Intellectual property',
  other: 'Other',
};

export const TARGET_LABELS = { video: 'Reel', comment: 'Comment', meme: 'Meme' };

export const STATUS_LABELS = {
  pending: 'Pending',
  reviewing: 'Reviewing',
  actioned: 'Actioned',
  dismissed: 'Dismissed',
};

export function formatAge(hours) {
  if (hours == null) return '—';
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} min`;
  if (hours < 48) return `${Math.round(hours)} h`;
  return `${Math.round(hours / 24)} d`;
}
