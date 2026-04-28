import * as yup from 'yup';

/**
 * Validation schema for posting category
 */
export const postingCategorySchema = yup.object({
  code: yup.string()
    .required('Code is required')
    .matches(/^[a-z0-9]+$/, 'Code must be lowercase alphanumeric')
    .max(50, 'Code must be 50 characters or less'),
  name: yup.string()
    .required('Name is required')
    .max(100, 'Name must be 100 characters or less'),
  sortOrder: yup.number()
    .required('Sort order is required')
    .integer('Must be an integer')
    .min(0, 'Must be 0 or greater')
});

/**
 * Validation schema for content category (same as posting category)
 */
export const contentCategorySchema = postingCategorySchema;
