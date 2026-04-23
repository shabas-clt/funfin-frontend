// Centralized yup schemas.
//
// Each form in the admin panel imports the schema it needs from here rather
// than defining its own, so validation rules stay consistent and match the
// FastAPI backend's Pydantic constraints (app/schemas/*.py).
//
// When a backend schema changes, update the matching block in this file
// and every form that uses it will pick up the new rule.

import * as yup from 'yup';

// Lightweight, common primitives reused across forms.
const emailRule = yup
  .string()
  .trim()
  .lowercase()
  .email('Enter a valid email address')
  .required('Email is required');

const passwordRule = yup
  .string()
  .required('Password is required')
  .min(6, 'Password must be at least 6 characters');

const requiredString = (label) =>
  yup.string().trim().required(`${label} is required`);

// ----- auth -----

export const signInSchema = yup.object({
  email: emailRule,
  password: yup.string().required('Password is required'),
});

// ----- admin: admin management -----
// Backend: AdminCreateInput / AdminUpdateInput.

export const adminCreateSchema = yup.object({
  fullName: requiredString('Full name').min(2, 'Full name is too short'),
  email: emailRule,
  password: passwordRule,
  role: yup
    .string()
    .oneOf(['admin', 'editor', 'superadmin'], 'Invalid role')
    .required('Role is required'),
  isActive: yup.boolean().default(true),
});

export const adminUpdateSchema = yup.object({
  fullName: yup
    .string()
    .trim()
    .min(2, 'Full name is too short')
    .optional(),
  email: yup
    .string()
    .trim()
    .lowercase()
    .email('Enter a valid email')
    .optional(),
  // Password on the edit form is optional; enforce min length only if typed.
  password: yup
    .string()
    .transform((v) => (v === '' ? undefined : v))
    .min(6, 'Password must be at least 6 characters')
    .optional(),
  role: yup
    .string()
    .oneOf(['admin', 'editor', 'superadmin'], 'Invalid role')
    .optional(),
  isActive: yup.boolean().optional(),
});

// ----- admin: student management -----

export const studentUpdateSchema = yup.object({
  fullName: yup.string().trim().min(2, 'Full name is too short').optional(),
  email: yup.string().trim().lowercase().email('Enter a valid email').optional(),
  isActive: yup.boolean().optional(),
});

// ----- admin: mentor management -----
// Mentor accounts are created through POST /admins with role='mentor' on the
// backend, so the payload shape is the same as an admin minus the role.

export const mentorCreateSchema = yup.object({
  fullName: requiredString('Full name').min(2, 'Full name is too short'),
  email: emailRule,
  password: passwordRule,
  isActive: yup.boolean().default(true),
});

export const mentorUpdateSchema = yup.object({
  fullName: yup.string().trim().min(2, 'Full name is too short').optional(),
  email: yup.string().trim().lowercase().email('Enter a valid email').optional(),
  password: yup
    .string()
    .transform((v) => (v === '' ? undefined : v))
    .min(6, 'Password must be at least 6 characters')
    .optional(),
  isActive: yup.boolean().optional(),
});

// ----- admin: course management -----
// Backend: CourseCreate / CourseUpdate (see app/schemas/course.py).
//
// Notes that are easy to miss if you glance at the backend file:
// - `state` is deliberately NOT part of create/update; it flips through
//   dedicated publish/unpublish endpoints.
// - `priceFuncoins` is derived at purchase time from the live rate, not
//   sent from the admin.
// - `duration`, `totalModules` were removed from the admin payload; they
//   are now derived server-side from topic rows.
// - `photo` or `videoUrl` must be present. We enforce this with a cross-
//   field test so the admin gets a single, clear error.

const levelEnum = ['beginner', 'intermediate', 'advanced'];

const tagsField = yup
  .array()
  .of(
    yup
      .string()
      .trim()
      .lowercase()
      .max(30, 'Each tag must be 30 characters or fewer')
  )
  .max(20, 'Up to 20 tags allowed')
  .transform((value, original) => {
    if (Array.isArray(value)) return value;
    if (typeof original !== 'string') return value;
    return original
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  })
  .optional();

export const courseCreateSchema = yup.object({
  title: requiredString('Title').min(2).max(140),
  description: requiredString('Description').min(10),
  priceInr: yup
    .number()
    .typeError('Price must be a number')
    .min(0, 'Price cannot be negative')
    .required('Price is required'),
  photo: yup.string().trim().optional(),
  videoUrl: yup.string().trim().optional(),
  level: yup.string().oneOf(levelEnum, 'Invalid level').default('beginner'),
  language: yup.string().trim().max(40).optional(),
  tags: tagsField,
}).test(
  'photo-or-video',
  'Upload a cover image or a trailer video',
  (values) => Boolean(values?.photo) || Boolean(values?.videoUrl)
);

export const courseUpdateSchema = yup.object({
  title: yup.string().trim().min(2).max(140).optional(),
  description: yup.string().trim().min(10).optional(),
  priceInr: yup
    .number()
    .typeError('Price must be a number')
    .min(0, 'Price cannot be negative')
    .optional(),
  photo: yup.string().trim().optional(),
  videoUrl: yup.string().trim().optional(),
  level: yup.string().oneOf(levelEnum, 'Invalid level').optional(),
  language: yup.string().trim().max(40).optional(),
  tags: tagsField,
});

// Note: syllabus (module) and topic (video) create/update payloads are
// validated inline in SyllabusEditor since those rows are added through
// several small, context-dependent forms rather than one monolithic form.
// If we ever consolidate them, the rules to enforce are:
//   - module: title >= 2 chars, moduleLabel required, coverImage optional URL.
//   - topic: title >= 2 chars, overview >= 10 chars, videoUrl required,
//     order and durationSec non-negative integers.

// ----- mentor: signals -----
// Backend: TradingSignalCreateInput (see app/schemas/signal.py).
//
// `targetPrices` is entered as a comma-separated string in the UI and
// normalized to a list of positive numbers before validation.

const positiveNumber = (label) =>
  yup
    .number()
    .typeError(`${label} must be a number`)
    .positive(`${label} must be greater than 0`)
    .required(`${label} is required`);

const parseLocalDateTime = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const signalCreateSchema = yup.object({
  headline: requiredString('Headline').min(4, 'Headline is too short').max(140),
  instrument: requiredString('Instrument').min(2).max(40),
  exchange: yup.string().trim().max(20).optional(),
  segment: yup.string().trim().max(20).optional(),
  direction: yup
    .string()
    .oneOf(['buy', 'sell'], 'Direction must be buy or sell')
    .required('Direction is required'),
  entryPrice: positiveNumber('Entry price'),
  stopLoss: positiveNumber('Stop loss'),
  targetPrices: yup
    .array()
    .of(
      yup
        .number()
        .typeError('Target price must be a number')
        .positive('Target price must be greater than 0')
    )
    .min(1, 'Add at least one target price')
    .required('Target prices are required')
    .transform((value, original) => {
      if (Array.isArray(value)) return value;
      if (typeof original !== 'string') return value;
      return original
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map(Number)
        .filter((n) => Number.isFinite(n));
    }),
  timeframe: yup.string().trim().max(30).optional(),
  riskLevel: yup.string().trim().max(20).optional(),
  confidence: yup
    .number()
    .typeError('Confidence must be a number')
    .integer('Confidence must be a whole number')
    .min(1, 'Confidence must be between 1 and 5')
    .max(5, 'Confidence must be between 1 and 5')
    .optional(),
  rationale: yup.string().trim().max(2000).optional(),
  validFrom: yup.string().trim().required('Valid from is required'),
  validUntil: yup.string().trim().required('Valid until is required'),
}).test('signal-schedule-range', function (values) {
  const validFrom = parseLocalDateTime(values?.validFrom);
  const validUntil = parseLocalDateTime(values?.validUntil);
  if (!validFrom || !validUntil) return true;

  if (validFrom < new Date(Date.now() - 60 * 1000)) {
    return this.createError({ path: 'validFrom', message: 'Valid from cannot be in the past' });
  }

  if (validUntil <= validFrom) {
    return this.createError({ path: 'validUntil', message: 'Valid until must be after valid from' });
  }

  return true;
});

// ----- admin: funcoin pricing -----
// Backend: FuncoinAdminPriceUpdate (see app/schemas/funcoin.py).

export const funcoinPriceSchema = yup.object({
  pricePerCoin: yup
    .number()
    .typeError('Price must be a number')
    .positive('Price must be greater than 0')
    .required('Price is required'),
  note: yup.string().trim().max(200, 'Note is too long').optional(),
});

// ----- admin: funcoin category -----
// Backend: FuncoinCategoryCreate / FuncoinCategoryUpdate.

const kindEnum = yup
  .string()
  .oneOf(['earn', 'spend'], 'Kind must be earn or spend')
  .required('Kind is required');

export const funcoinCategoryCreateSchema = yup.object({
  code: requiredString('Code').min(2, 'Code is too short'),
  name: requiredString('Name').min(2, 'Name is too short'),
  kind: kindEnum,
  description: yup.string().trim().optional(),
  isActive: yup.boolean().default(true),
  sortOrder: yup
    .number()
    .typeError('Sort order must be a number')
    .integer()
    .min(0)
    .default(0),
});

export const funcoinCategoryUpdateSchema = yup.object({
  name: yup.string().trim().min(2, 'Name is too short').optional(),
  kind: yup.string().oneOf(['earn', 'spend']).optional(),
  description: yup.string().trim().optional(),
  isActive: yup.boolean().optional(),
  sortOrder: yup
    .number()
    .typeError('Sort order must be a number')
    .integer()
    .min(0)
    .optional(),
});

// ----- admin: funcoin transaction (manual ledger entry) -----
// Backend: FuncoinTransactionCreate. Admin picks a user, kind (earn/spend),
// category code and coin amount; the other fields are optional metadata.

export const funcoinTransactionCreateSchema = yup.object({
  userId: requiredString('User'),
  kind: kindEnum,
  categoryCode: requiredString('Category'),
  coins: yup
    .number()
    .typeError('Coins must be a number')
    .integer('Coins must be whole')
    .positive('Coins must be greater than 0')
    .required('Coins are required'),
  referenceType: yup.string().trim().optional(),
  referenceId: yup.string().trim().optional(),
  referenceTitle: yup.string().trim().optional(),
  notes: yup.string().trim().max(500, 'Notes are too long').optional(),
});

// ----- admin: course coupons -----
// Backend: CourseCouponCreateInput / CourseCouponUpdateInput.

const discountTypeEnum = yup
  .string()
  .oneOf(['percent', 'flat'], 'Discount type must be percent or flat')
  .required('Discount type is required');

const optionalDate = yup
  .string()
  .trim()
  .matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Use YYYY-MM-DD', excludeEmptyString: true })
  .optional();

export const couponCreateSchema = yup.object({
  code: requiredString('Code').min(2).max(40),
  title: yup.string().trim().max(120).optional(),
  description: yup.string().trim().max(500).optional(),
  discountType: discountTypeEnum,
  discountValue: yup
    .number()
    .typeError('Discount value must be a number')
    .positive('Discount value must be greater than 0')
    .required('Discount value is required'),
  maxDiscountInr: yup
    .number()
    .typeError('Max discount must be a number')
    .min(0)
    .nullable()
    .transform((v, o) => (o === '' || o === null || o === undefined ? null : v)),
  minOrderAmountInr: yup
    .number()
    .typeError('Minimum order amount must be a number')
    .min(0)
    .default(0),
  perUserLimit: yup
    .number()
    .typeError('Per-user limit must be a number')
    .integer()
    .min(1)
    .default(1),
  usageLimit: yup
    .number()
    .typeError('Usage limit must be a number')
    .integer()
    .min(1)
    .nullable()
    .transform((v, o) => (o === '' || o === null || o === undefined ? null : v)),
  applicableCourseIds: yup.array().of(yup.string().trim()).default([]),
  validFrom: optionalDate,
  validUntil: optionalDate,
  isActive: yup.boolean().default(true),
});

export const couponUpdateSchema = couponCreateSchema
  // For PATCH, the code is immutable server-side so we omit it.
  .omit(['code'])
  .shape({
    discountType: yup.string().oneOf(['percent', 'flat']).optional(),
    discountValue: yup
      .number()
      .typeError('Discount value must be a number')
      .positive('Discount value must be greater than 0')
      .optional(),
  });

// ----- admin: gamification -----
// Backend: AdminMissionCreateInput / AdminMissionUpdateInput,
// AdminChallengeCreateInput / AdminChallengeUpdateInput,
// AdminBadgeCreateInput / AdminBadgeUpdateInput,
// AdminTitleCreateInput / AdminTitleUpdateInput.

export const missionCreateSchema = yup.object({
  code: requiredString('Code').min(2),
  title: requiredString('Title').min(2),
  description: requiredString('Description').min(2),
  missionType: yup
    .string()
    .oneOf(['daily', 'weekly', 'special'], 'Type must be daily, weekly, or special')
    .required('Mission type is required'),
  targetCount: yup
    .number()
    .typeError('Target count must be a number')
    .integer()
    .min(1)
    .default(1),
  rewardCoins: yup
    .number()
    .typeError('Reward must be a number')
    .integer()
    .min(0)
    .default(0),
  isActive: yup.boolean().default(true),
});

export const challengeCreateSchema = yup.object({
  question: requiredString('Question').min(5),
  optionsRaw: yup
    .string()
    .trim()
    .required('Provide at least two options (one per line)'),
  // `optionsRaw` is a textarea; we transform into an array for the server.
  options: yup
    .array()
    .of(yup.string().trim().min(1))
    .min(2, 'Provide at least two options')
    .when('optionsRaw', ([raw], schema) =>
      schema.transform(() =>
        String(raw || '')
          .split(/\r?\n/)
          .map((s) => s.trim())
          .filter(Boolean),
      ),
    ),
  correctOptionIndex: yup
    .number()
    .typeError('Correct option index must be a number')
    .integer()
    .min(0, 'Index must be 0 or greater')
    .required('Correct option index is required'),
  explanation: yup.string().trim().max(2000).optional(),
  rewardCoins: yup
    .number()
    .typeError('Reward must be a number')
    .integer()
    .min(0)
    .default(0),
  isActive: yup.boolean().default(true),
});

export const badgeCreateSchema = yup.object({
  code: requiredString('Code').min(2),
  name: requiredString('Name').min(2),
  description: yup.string().trim().max(500).optional(),
  iconUrl: yup.string().trim().url('Enter a valid URL').optional(),
  isActive: yup.boolean().default(true),
});

export const titleCreateSchema = yup.object({
  code: requiredString('Code').min(2),
  name: requiredString('Name').min(2),
  description: yup.string().trim().max(500).optional(),
  isActive: yup.boolean().default(true),
});

// ----- admin: notifications -----
// Backend: AdminNotificationCreateInput.

export const notificationCreateSchema = yup.object({
  title: requiredString('Title').min(2).max(140),
  body: requiredString('Body').min(2).max(1000),
  target: yup
    .string()
    .oneOf(['all', 'user'], 'Pick a target')
    .required('Target is required'),
  userId: yup
    .string()
    .trim()
    .when('target', {
      is: 'user',
      then: (s) => s.required('User ID is required for single-user send'),
      otherwise: (s) => s.optional(),
    }),
});
