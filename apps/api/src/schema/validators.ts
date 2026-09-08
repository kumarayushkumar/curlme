import { z } from 'zod'
import {
  BIO_MAX_LENGTH,
  PASSWORD_MAX_BYTES,
  PASSWORD_MIN_LENGTH,
  STATS_MAX_LIMIT
} from '../utils/constants.js'

// auth
export const deviceCodeSchema = z.object({
  device_code: z.string().optional()
})

const usernameField = z
  .string()
  .min(3, 'username must be at least 3 characters')
  .max(39, 'username cannot exceed 39 characters')
  .regex(/^[a-zA-Z0-9-]+$/, 'invalid username')

/**
 * Bcrypt only reads the first 72 bytes of a password, so anything longer is
 * rejected rather than silently truncated into a weaker secret.
 */
const passwordField = z
  .string()
  .min(
    PASSWORD_MIN_LENGTH,
    `password must be at least ${PASSWORD_MIN_LENGTH} characters`
  )
  .max(
    PASSWORD_MAX_BYTES,
    `password cannot exceed ${PASSWORD_MAX_BYTES} characters`
  )
  .regex(/[a-zA-Z]/, 'password must contain at least one letter')
  .regex(/[0-9]/, 'password must contain at least one number')
  .refine(
    value => Buffer.byteLength(value, 'utf8') <= PASSWORD_MAX_BYTES,
    `password cannot exceed ${PASSWORD_MAX_BYTES} bytes`
  )

const bioField = z
  .string()
  .trim()
  .max(BIO_MAX_LENGTH, `bio cannot exceed ${BIO_MAX_LENGTH} characters`)

export const registerSchema = z.object({
  username: usernameField,
  password: passwordField,
  name: z
    .string()
    .trim()
    .min(1, 'name is required')
    .max(200, 'name cannot exceed 200 characters'),
  designation: z
    .string()
    .trim()
    .min(1, 'designation is required')
    .max(64, 'designation cannot exceed 64 characters'),
  bio: bioField.optional()
})

export const signinSchema = z.object({
  username: usernameField,
  password: z
    .string()
    .min(1, 'password is required')
    .max(
      PASSWORD_MAX_BYTES,
      `password cannot exceed ${PASSWORD_MAX_BYTES} characters`
    )
})

export const updateProfileSchema = z.object({
  bio: bioField
})

// post
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).optional()
})

export const postIdSchema = z.object({
  postId: z.uuid('invalid post id')
})

export const contentSchema = z.object({
  content: z
    .string()
    .min(1, 'content is required')
    .max(500, 'content cannot exceed 500 characters')
    .trim()
})

export const usernameSchema = z.object({
  username: usernameField.optional()
})

/** Same shape as `usernameSchema` but for routes where the param is mandatory. */
export const usernameParamSchema = z.object({
  username: usernameField
})

export const replyIdSchema = z.object({
  replyId: z.uuid('invalid reply id')
})

// designation
const designationCategoryField = z.enum(['CREATOR', 'CONSUMER'])

/** Lowercase words joined by single underscores or dashes, e.g. tech_creator. */
const slugField = z
  .string()
  .trim()
  .min(2, 'slug must be at least 2 characters')
  .max(64, 'slug cannot exceed 64 characters')
  .regex(
    /^[a-z0-9]+(?:[_-][a-z0-9]+)*$/,
    'slug must be lowercase words joined by single underscores or dashes'
  )

const groupField = z
  .string()
  .trim()
  .min(2, 'group must be at least 2 characters')
  .max(64, 'group cannot exceed 64 characters')

export const designationQuerySchema = z.object({
  category: designationCategoryField.optional(),
  group: groupField.optional()
})

export const createDesignationSchema = z.object({
  slug: slugField,
  label: z
    .string()
    .trim()
    .min(2, 'label must be at least 2 characters')
    .max(120, 'label cannot exceed 120 characters'),
  category: designationCategoryField,
  topic: z
    .string()
    .trim()
    .min(2, 'topic must be at least 2 characters')
    .max(64, 'topic cannot exceed 64 characters')
    .optional(),
  group: groupField
})

// admin
export const roleSchema = z.object({
  role: z.enum(['USER', 'ADMIN'])
})

export const activeSchema = z.object({
  is_active: z.boolean()
})

export const statsQuerySchema = z.object({
  limit: z.coerce
    .number()
    .min(1, 'limit must be at least 1')
    .max(STATS_MAX_LIMIT, `limit cannot exceed ${STATS_MAX_LIMIT}`)
    .optional()
})
