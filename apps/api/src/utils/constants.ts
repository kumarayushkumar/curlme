/**
 * Application constants and environment variable exports
 */

export const JWT_SECRET = process.env.JWT_SECRET as string
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined')
}

export const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID as string
if (!GITHUB_CLIENT_ID) {
  throw new Error('GITHUB_CLIENT_ID is not defined')
}

export const REDIS_HOST = process.env.REDIS_HOST as string
if (!REDIS_HOST) {
  throw new Error('REDIS_HOST is not defined')
}

export const REDIS_PORT = process.env.REDIS_PORT as string
if (!REDIS_PORT) {
  throw new Error('REDIS_PORT is not defined')
}

/**
 * Comma separated usernames promoted to ADMIN by `prisma/seed.ts`. Optional:
 * an empty list simply means no admin is bootstrapped from the environment.
 */
export const ADMIN_USERNAMES = (process.env.ADMIN_USERNAMES ?? '')
  .split(',')
  .map(username => username.trim())
  .filter(username => username.length > 0)

export const HTTP_STATUS_CODE = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  FOUND: 302,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  CONTENT_TOO_LARGE: 413,
  TOO_MANY_REQUESTS: 429,
  GONE: 410,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
} as const

export const JWT_EXPIRE = '30d'

export const POST_LIMIT = 50 // Maximum number of posts to cache

export const FEED_LIMIT = 5

export const CACHE_TTL = 1 * 60 * 60

/** Bcrypt cost factor. Each increment doubles the time taken to hash. */
export const BCRYPT_ROUNDS = 12

export const PASSWORD_MIN_LENGTH = 8

/**
 * Bcrypt silently ignores every byte past the 72nd, so a longer password would
 * give a false sense of strength. Reject those instead of truncating them.
 */
export const PASSWORD_MAX_BYTES = 72

/** Maximum length of a profile bio. */
export const BIO_MAX_LENGTH = 280

/** Page size for the follower / following listings. */
export const FOLLOW_LIST_LIMIT = 20

/** Default and maximum number of rows returned by an admin statistics table. */
export const STATS_LIMIT = 10
export const STATS_MAX_LIMIT = 100
