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

// Course-management schemas intentionally omitted here.
//
// The course-management page gets a full overhaul in slice 5 (direct R2
// video uploads, modules, videos, draft/publish state, computed funcoin
// price), and the current form will be replaced rather than extended.
// Defining a transitional schema now would be throwaway work whose rules
// don't match either the current form or the redesigned one; slice 5 will
// add the correct schemas here in one step.

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
  validUntil: yup.string().trim().optional(),
});
