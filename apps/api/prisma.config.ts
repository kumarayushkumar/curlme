import 'dotenv/config'

import { defineConfig } from 'prisma/config'

/**
 * Prisma CLI configuration.
 *
 * Replaces the `prisma` key in package.json, which Prisma 6 deprecates and
 * Prisma 7 removes.
 *
 * The `dotenv/config` import above is load-bearing: once this file exists the
 * CLI stops reading `.env` on its own ("Prisma config detected, skipping
 * environment variable loading"), so `env("DATABASE_URL")` in the schema
 * resolves to nothing and every command fails with P1012.
 */
export default defineConfig({
  schema: './prisma/schema.prisma',
  migrations: {
    seed: 'tsx prisma/seed.ts'
  }
})
