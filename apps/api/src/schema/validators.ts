import { z } from 'zod'

// auth
export const deviceCodeSchema = z.object({
  device_code: z.string().optional()
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
  username: z
    .string()
    .min(3)
    .max(39)
    .regex(/^[a-zA-Z0-9-]+$/, 'invalid username')
    .optional()
})

export const replyIdSchema = z.object({
  replyId: z.uuid('invalid reply id')
})
