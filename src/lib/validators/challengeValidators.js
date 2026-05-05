import * as yup from 'yup';

/**
 * Validation schema for weekly challenge
 */
export const weeklyChallengeSchema = yup.object({
  weekNumber: yup.number()
    .required('Week number is required')
    .integer('Must be an integer')
    .min(1, 'Must be between 1 and 53')
    .max(53, 'Must be between 1 and 53'),
  weekYear: yup.number()
    .required('Year is required')
    .integer('Must be an integer')
    .min(2020, 'Year must be 2020 or later')
});

/**
 * Validation schema for special challenge
 */
export const specialChallengeSchema = yup.object({
  startDate: yup.date()
    .transform((value, originalValue) => (originalValue === '' ? null : value))
    .required('Start date is required')
    .typeError('Must be a valid date'),
  endDate: yup.date()
    .transform((value, originalValue) => (originalValue === '' ? null : value))
    .required('End date is required')
    .typeError('Must be a valid date')
    .min(yup.ref('startDate'), 'End date must be after start date')
});

/**
 * Validation schema for daily challenge
 */
export const dailyChallengeSchema = yup.object({
  challengeDate: yup.date()
    .nullable()
    .transform((value, originalValue) => (originalValue === '' ? null : value))
    .typeError('Must be a valid date')
});