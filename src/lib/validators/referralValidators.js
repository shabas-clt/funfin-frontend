import * as yup from 'yup';

/**
 * Validation schema for referral configuration
 */
export const referralConfigSchema = yup.object({
  isEnabled: yup.boolean()
    .required('Status is required'),
  rewardAmount: yup.number()
    .required('Reward amount is required')
    .integer('Must be an integer')
    .min(0, 'Must be 0 or greater')
    .max(10000, 'Must be 10,000 or less')
});
