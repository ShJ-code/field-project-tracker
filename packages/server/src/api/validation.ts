import { z } from 'zod';
import { PRIORITIES, PROJECT_STATUSES } from '@field-tracker/shared';

/**
 * Request validation lives at the API boundary: untrusted HTTP input is parsed
 * into a known-good shape before it ever reaches the domain.
 */

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'dueDate must be YYYY-MM-DD');

export const createProjectSchema = z.object({
  title: z.string().trim().min(1, 'title is required').max(200),
  status: z.enum(PROJECT_STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  notes: z.string().max(2000).optional(),
  dueDate: isoDate.nullable().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const updateProjectSchema = createProjectSchema.partial();
