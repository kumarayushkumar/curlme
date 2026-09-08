/**
 * Seeds the designation catalogue and bootstraps admin accounts.
 *
 * These rows are starting *data*, not a fixed list: `Designation` is a table, and
 * admins add to it at runtime through `POST /api/admin/designations`. Nothing in
 * the API or the CLI depends on the slugs below.
 *
 * Run with: npm run db:seed
 */

import { PrismaClient, type DesignationCategory } from '@prisma/client'

const prisma = new PrismaClient()

type DesignationSeed = {
  slug: string
  label: string
  category: DesignationCategory
  /** What a creator publishes about. Left off for consumers. */
  topic?: string
  /** Coarse bucket the picker groups on. Required for every row. */
  group: string
}

const DESIGNATIONS: DesignationSeed[] = [
  // People who publish. A creator is described by the subject they cover,
  // so `topic` is set and the group mirrors it.
  {
    slug: 'tech_creator',
    label: 'Tech Creator',
    category: 'CREATOR',
    topic: 'tech',
    group: 'tech'
  },
  {
    slug: 'health_creator',
    label: 'Health Creator',
    category: 'CREATOR',
    topic: 'health',
    group: 'health'
  },
  {
    slug: 'philosophy_creator',
    label: 'Philosophy Creator',
    category: 'CREATOR',
    topic: 'philosophy',
    group: 'philosophy'
  },
  {
    slug: 'spiritual_creator',
    label: 'Spiritual Creator',
    category: 'CREATOR',
    topic: 'spiritual',
    group: 'spiritual'
  },
  {
    slug: 'entertainment_creator',
    label: 'Entertainment Creator',
    category: 'CREATOR',
    topic: 'entertainment',
    group: 'entertainment'
  },

  // People who mostly read, described by occupation. `topic` stays null and
  // `group` is the bucket the picker renders them under.
  {
    slug: 'frontend_engineer',
    label: 'Frontend Engineer',
    category: 'CONSUMER',
    group: 'engineering'
  },
  {
    slug: 'backend_engineer',
    label: 'Backend Engineer',
    category: 'CONSUMER',
    group: 'engineering'
  },
  {
    slug: 'fullstack_engineer',
    label: 'Full-Stack Engineer',
    category: 'CONSUMER',
    group: 'engineering'
  },
  {
    slug: 'devops_sre',
    label: 'DevOps / SRE',
    category: 'CONSUMER',
    group: 'engineering'
  },
  {
    slug: 'mobile_engineer',
    label: 'Mobile Engineer',
    category: 'CONSUMER',
    group: 'engineering'
  },
  {
    slug: 'qa_engineer',
    label: 'QA Engineer',
    category: 'CONSUMER',
    group: 'engineering'
  },
  {
    slug: 'security_engineer',
    label: 'Security Engineer',
    category: 'CONSUMER',
    group: 'engineering'
  },
  {
    slug: 'data_engineer',
    label: 'Data Engineer',
    category: 'CONSUMER',
    group: 'engineering'
  },
  {
    slug: 'ml_engineer',
    label: 'ML Engineer',
    category: 'CONSUMER',
    group: 'engineering'
  },

  // Creative trades.
  {
    slug: 'video_editor',
    label: 'Video Editor',
    category: 'CONSUMER',
    group: 'creative'
  },
  {
    slug: 'graphic_designer',
    label: 'Graphic Designer',
    category: 'CONSUMER',
    group: 'creative'
  },
  {
    slug: 'ux_designer',
    label: 'UX Designer',
    category: 'CONSUMER',
    group: 'creative'
  },
  {
    slug: 'writer',
    label: 'Writer',
    category: 'CONSUMER',
    group: 'creative'
  },
  {
    slug: 'photographer',
    label: 'Photographer',
    category: 'CONSUMER',
    group: 'creative'
  },
  {
    slug: 'musician',
    label: 'Musician',
    category: 'CONSUMER',
    group: 'creative'
  },

  // Business and leadership.
  {
    slug: 'product_manager',
    label: 'Product Manager',
    category: 'CONSUMER',
    group: 'business'
  },
  {
    slug: 'engineering_manager',
    label: 'Engineering Manager',
    category: 'CONSUMER',
    group: 'business'
  },
  {
    slug: 'marketing_manager',
    label: 'Marketing Manager',
    category: 'CONSUMER',
    group: 'business'
  },
  {
    slug: 'sales_rep',
    label: 'Sales Rep',
    category: 'CONSUMER',
    group: 'business'
  },
  {
    slug: 'hr_specialist',
    label: 'HR Specialist',
    category: 'CONSUMER',
    group: 'business'
  },
  {
    slug: 'finance_analyst',
    label: 'Finance Analyst',
    category: 'CONSUMER',
    group: 'business'
  },
  {
    slug: 'founder',
    label: 'Founder',
    category: 'CONSUMER',
    group: 'business'
  },

  // Occupations outside tech.
  {
    slug: 'doctor',
    label: 'Doctor',
    category: 'CONSUMER',
    group: 'outside_tech'
  },
  {
    slug: 'nurse',
    label: 'Nurse',
    category: 'CONSUMER',
    group: 'outside_tech'
  },
  {
    slug: 'teacher',
    label: 'Teacher',
    category: 'CONSUMER',
    group: 'outside_tech'
  },
  {
    slug: 'lawyer',
    label: 'Lawyer',
    category: 'CONSUMER',
    group: 'outside_tech'
  },
  {
    slug: 'accountant',
    label: 'Accountant',
    category: 'CONSUMER',
    group: 'outside_tech'
  },
  {
    slug: 'civil_engineer',
    label: 'Civil Engineer',
    category: 'CONSUMER',
    group: 'outside_tech'
  },
  {
    slug: 'chef',
    label: 'Chef',
    category: 'CONSUMER',
    group: 'outside_tech'
  },

  // No settled occupation right now.
  {
    slug: 'student',
    label: 'Student',
    category: 'CONSUMER',
    group: 'unsettled'
  },
  {
    slug: 'freelancer',
    label: 'Freelancer',
    category: 'CONSUMER',
    group: 'unsettled'
  },
  {
    slug: 'career_switcher',
    label: 'Career Switcher',
    category: 'CONSUMER',
    group: 'unsettled'
  },
  {
    slug: 'between_jobs',
    label: 'Between Jobs',
    category: 'CONSUMER',
    group: 'unsettled'
  }
]

/**
 * Reads the usernames to promote to ADMIN from the environment.
 *
 * Read directly rather than through `utils/constants.ts`, which also demands the
 * JWT, GitHub and Redis variables that seeding has no use for.
 *
 * @returns {string[]} - Usernames listed in ADMIN_USERNAMES
 */
const getAdminUsernames = (): string[] => {
  return (process.env.ADMIN_USERNAMES ?? '')
    .split(',')
    .map(username => username.trim())
    .filter(username => username.length > 0)
}

/**
 * Inserts or refreshes every seeded designation
 *
 * @returns {Promise<void>}
 */
const seedDesignations = async (): Promise<void> => {
  for (const designation of DESIGNATIONS) {
    const data = {
      label: designation.label,
      category: designation.category,
      topic: designation.topic ?? null,
      group: designation.group,
      active: true
    }

    await prisma.designation.upsert({
      where: { slug: designation.slug },
      update: data,
      create: { slug: designation.slug, ...data }
    })
  }

  console.log(`seeded ${DESIGNATIONS.length} designations`)
}

/**
 * Promotes the accounts named in ADMIN_USERNAMES
 *
 * @returns {Promise<void>}
 */
const seedAdmins = async (): Promise<void> => {
  const usernames = getAdminUsernames()

  if (usernames.length === 0) {
    console.log('ADMIN_USERNAMES is empty, no admin promoted')
    return
  }

  const promoted = await prisma.user.updateMany({
    where: { username: { in: usernames } },
    data: { role: 'ADMIN' }
  })

  console.log(
    `promoted ${promoted.count} of ${usernames.length} account(s) to ADMIN`
  )

  if (promoted.count < usernames.length) {
    const existing = await prisma.user.findMany({
      where: { username: { in: usernames } },
      select: { username: true }
    })
    const found = new Set(existing.map(user => user.username))
    const missing = usernames.filter(username => !found.has(username))

    console.log(
      `not registered yet, re-run the seed after they sign up: ${missing.join(', ')}`
    )
  }
}

const main = async (): Promise<void> => {
  await seedDesignations()
  await seedAdmins()
}

main()
  .catch(error => {
    console.error('seed failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
