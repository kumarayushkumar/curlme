import type { Post } from '@prisma/client'

export type CachedPost = Post & {
  user: {
    username: string
  }
}
