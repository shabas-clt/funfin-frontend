import * as yup from 'yup';

// Coerce '' (empty input) to undefined so optional numbers don't fail with NaN.
const optionalNumber = () =>
  yup.number().transform((v, o) => (o === '' || o === null ? undefined : v));

/**
 * Validation schema for referral configuration.
 * Ranges mirror ADMIN.md §2 — out-of-range values are rejected by the API (422).
 */
export const referralConfigSchema = yup.object({
  isEnabled: yup.boolean().required('Status is required'),
  rewardAmount: optionalNumber()
    .integer('Must be an integer')
    .min(0, 'Must be 0 or greater')
    .max(10000, 'Must be 10,000 or less')
    .required('Reward amount is required'),
  tier1Percent: optionalNumber()
    .min(0, 'Must be 0 or greater')
    .max(100, 'Must be 100 or less')
    .required('Tier 1 % is required'),
  tier2Percent: optionalNumber()
    .min(0, 'Must be 0 or greater')
    .max(100, 'Must be 100 or less')
    .required('Tier 2 % is required'),
  tier1Cap: optionalNumber()
    .integer('Must be an integer')
    .min(0, 'Must be 0 or greater')
    .max(1000, 'Must be 1,000 or less')
    .required('Tier 1 cap is required'),
  tier2Cap: optionalNumber()
    .integer('Must be an integer')
    .min(0, 'Must be 0 or greater')
    .max(10000, 'Must be 10,000 or less')
    .required('Tier 2 cap is required'),
  networkCap: optionalNumber()
    .integer('Must be an integer')
    .min(0, 'Must be 0 or greater')
    .max(10000, 'Must be 10,000 or less')
    .required('Network cap is required'),
  minPayoutUsd: optionalNumber()
    .min(0, 'Must be 0 or greater')
    .max(1000000, 'Must be 1,000,000 or less')
    .required('Minimum payout is required'),
});

/**
 * Validation schema for rejecting a payout (ADMIN.md §9).
 */
export const payoutRejectSchema = yup.object({
  reason: yup
    .string()
    .trim()
    .min(1, 'A reason is required')
    .max(500, 'Must be 500 characters or less')
    .required('A reason is required'),
});
