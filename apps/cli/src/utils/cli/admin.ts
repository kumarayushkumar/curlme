/**
 * Handlers for the admin monitoring CLI commands
 */

import { apiClient } from '../api.js'
import { formatDate, orDash, truncate } from '../format.js'
import { colorize, error, heading, success } from '../output.js'
import { printKeyValues, printTable, type Column } from '../table.js'

type TopFollowed = {
  rank: number
  username: string
  name: string
  designation: string | null
  role: string
  follower_count: number
  following_count: number
  post_count: number
  total_likes_received: number
}

type TopPost = {
  rank: number
  id: string
  username: string
  content: string
  likes_count: number
  replies_count: number
  created_at: string
}

type TopEngaged = {
  rank: number
  username: string
  designation: string | null
  posts_count: number
  replies_count: number
  contributions: number
  total_likes_received: number
  follower_count: number
}

type FollowEdge = {
  follower: string
  follower_designation: string | null
  following: string
  following_designation: string | null
  mutual: boolean
  followed_at: string
}

type DesignationStat = {
  label: string
  slug: string
  category: 'CREATOR' | 'CONSUMER'
  topic: string | null
  group: string
  active: boolean
  users_count: number
  followers_total: number
}

const TOP_FOLLOWED_COLUMNS: Column<TopFollowed>[] = [
  { header: '#', value: row => String(row.rank), align: 'right' },
  { header: 'username', value: row => `@${row.username}` },
  { header: 'name', value: row => truncate(row.name, 24) },
  { header: 'designation', value: row => orDash(row.designation) },
  { header: 'role', value: row => row.role.toLowerCase() },
  {
    header: 'followers',
    value: row => String(row.follower_count),
    align: 'right'
  },
  {
    header: 'following',
    value: row => String(row.following_count),
    align: 'right'
  },
  { header: 'posts', value: row => String(row.post_count), align: 'right' },
  {
    header: 'likes recvd',
    value: row => String(row.total_likes_received),
    align: 'right'
  }
]

const TOP_POSTS_COLUMNS: Column<TopPost>[] = [
  { header: '#', value: row => String(row.rank), align: 'right' },
  { header: 'author', value: row => `@${row.username}` },
  { header: 'content', value: row => truncate(row.content, 48) },
  { header: 'likes', value: row => String(row.likes_count), align: 'right' },
  {
    header: 'replies',
    value: row => String(row.replies_count),
    align: 'right'
  },
  { header: 'posted', value: row => formatDate(row.created_at) },
  { header: 'post id', value: row => colorize(row.id, 'grey') }
]

const TOP_ENGAGED_COLUMNS: Column<TopEngaged>[] = [
  { header: '#', value: row => String(row.rank), align: 'right' },
  { header: 'username', value: row => `@${row.username}` },
  { header: 'designation', value: row => orDash(row.designation) },
  { header: 'posts', value: row => String(row.posts_count), align: 'right' },
  {
    header: 'replies',
    value: row => String(row.replies_count),
    align: 'right'
  },
  {
    header: 'total',
    value: row => String(row.contributions),
    align: 'right'
  },
  {
    header: 'likes recvd',
    value: row => String(row.total_likes_received),
    align: 'right'
  },
  {
    header: 'followers',
    value: row => String(row.follower_count),
    align: 'right'
  }
]

const FOLLOW_GRAPH_COLUMNS: Column<FollowEdge>[] = [
  { header: 'follower', value: row => `@${row.follower}` },
  { header: 'follower is', value: row => orDash(row.follower_designation) },
  { header: '→ follows', value: row => `@${row.following}` },
  { header: 'who is', value: row => orDash(row.following_designation) },
  {
    header: 'mutual',
    value: row => (row.mutual ? 'yes' : 'no'),
    align: 'center'
  },
  { header: 'since', value: row => formatDate(row.followed_at) }
]

const DESIGNATION_STAT_COLUMNS: Column<DesignationStat>[] = [
  { header: 'designation', value: row => row.label },
  { header: 'slug', value: row => colorize(row.slug, 'grey') },
  { header: 'category', value: row => row.category.toLowerCase() },
  { header: 'topic', value: row => orDash(row.topic) },
  { header: 'group', value: row => row.group },
  { header: 'users', value: row => String(row.users_count), align: 'right' },
  {
    header: 'followers',
    value: row => String(row.followers_total),
    align: 'right'
  },
  {
    header: 'active',
    value: row => (row.active ? 'yes' : 'no'),
    align: 'center'
  }
]

/**
 * Appends `?limit=` when the user asked for a specific row count
 *
 * @param {string} [limit] - Raw limit argument
 * @returns {string} - A query string fragment, empty when no limit was given
 */
const limitQuery = (limit?: string): string => {
  const parsed = limit ? Number.parseInt(limit, 10) : NaN

  return Number.isNaN(parsed) ? '' : `?limit=${parsed}`
}

type Section<T> = {
  /** Endpoint under /api/admin that serves this section on its own. */
  path: string
  /** Key the rows sit under, identical in the single and combined responses. */
  key: string
  title: string
  columns: Column<T>[]
  empty: string
}

const SECTIONS = {
  topFollowed: {
    path: 'top-followed',
    key: 'top_followed',
    title: 'Most followed users',
    columns: TOP_FOLLOWED_COLUMNS,
    empty: 'nobody has any followers yet'
  } satisfies Section<TopFollowed>,
  topEngaged: {
    path: 'top-engaged',
    key: 'top_engaged',
    title: 'Most active users',
    columns: TOP_ENGAGED_COLUMNS,
    empty: 'nobody has posted or replied yet'
  } satisfies Section<TopEngaged>,
  topPosts: {
    path: 'top-posts',
    key: 'top_posts',
    title: 'Most liked posts',
    columns: TOP_POSTS_COLUMNS,
    empty: 'there are no posts yet'
  } satisfies Section<TopPost>,
  followGraph: {
    path: 'follow-graph',
    key: 'follow_graph',
    title: 'Who follows whom',
    columns: FOLLOW_GRAPH_COLUMNS,
    empty: 'no follow relationships yet'
  } satisfies Section<FollowEdge>,
  designations: {
    path: 'designations',
    key: 'designations',
    title: 'Accounts by designation',
    columns: DESIGNATION_STAT_COLUMNS,
    empty: 'no designations configured'
  } satisfies Section<DesignationStat>
}

/**
 * Renders one section from an already fetched payload
 *
 * @param {Section<T>} section - Section descriptor
 * @param {Record<string, unknown>} payload - Response `data` holding the rows
 */
const renderSection = <T>(
  section: Section<T>,
  payload: Record<string, unknown>
): void => {
  printTable(
    section.title,
    (payload[section.key] ?? []) as T[],
    section.columns,
    section.empty
  )
}

/**
 * Builds a handler that fetches one section on its own and prints it
 *
 * @param {Section<T>} section - Section descriptor
 * @returns {(limit?: string) => Promise<void>} - The command handler
 */
const sectionHandler = <T>(section: Section<T>) => {
  return async (limit?: string): Promise<void> => {
    const response = await apiClient.get(
      `/api/admin/${section.path}${limitQuery(limit)}`,
      true
    )

    if (!response) return

    renderSection(section, response.data)
  }
}

const handleTopFollowed = sectionHandler(SECTIONS.topFollowed)
const handleTopEngaged = sectionHandler(SECTIONS.topEngaged)
const handleTopPosts = sectionHandler(SECTIONS.topPosts)
const handleFollowGraph = sectionHandler(SECTIONS.followGraph)
const handleDesignationStats = sectionHandler(SECTIONS.designations)

type Overview = {
  users: Record<string, number>
  content: Record<string, number>
  graph: Record<string, number>
}

/**
 * Renders the platform counters from an already fetched overview
 *
 * @param {Overview} overview - The counters returned by the API
 */
const renderOverview = (overview: Overview): void => {
  const { users, content, graph } = overview

  printKeyValues('Users', [
    ['total', users.total!],
    ['active', users.active!],
    ['inactive', users.inactive!],
    ['admins', users.admins!],
    ['creators', users.creators!],
    ['consumers', users.consumers!],
    ['no designation', users.unclassified!],
    ['password accounts', users.password_accounts!],
    ['github accounts', users.github_accounts!],
    ['joined in last 24h', users.joined_last_24h!]
  ])

  printKeyValues('Content', [
    ['posts', content.posts!],
    ['replies', content.replies!],
    ['likes', content.likes!],
    ['likes received across accounts', content.total_likes_received_all!],
    ['posts in last 24h', content.posts_last_24h!],
    ['replies in last 24h', content.replies_last_24h!]
  ])

  printKeyValues('Follow graph', [
    ['follow relationships', graph.follows!],
    ['new follows in last 24h', graph.follows_last_24h!],
    ['users following someone', graph.users_following_someone!],
    ['users with followers', graph.users_with_followers!]
  ])
}

/**
 * Prints the platform wide counters
 *
 * @returns {Promise<void>}
 */
const handleOverview = async (): Promise<void> => {
  const response = await apiClient.get('/api/admin/overview', true)
  if (!response) return

  renderOverview(response.data.overview as Overview)
}

/**
 * Runs the full dashboard from a single request
 *
 * One call rather than six keeps a dashboard refresh well inside the API rate
 * limit, and means every table describes the same moment.
 *
 * @param {string} [limit] - Optional row limit for the ranked tables
 * @returns {Promise<void>}
 */
const handleDashboard = async (limit?: string): Promise<void> => {
  const response = await apiClient.get(
    `/api/admin/dashboard${limitQuery(limit)}`,
    true
  )

  if (!response) return

  heading('curlme admin dashboard')

  renderOverview(response.data.overview as Overview)
  renderSection(SECTIONS.topFollowed, response.data)
  renderSection(SECTIONS.topEngaged, response.data)
  renderSection(SECTIONS.topPosts, response.data)
  renderSection(SECTIONS.followGraph, response.data)
  renderSection(SECTIONS.designations, response.data)
}

/**
 * Builds a handler that sets an account's role
 *
 * @param {'ADMIN' | 'USER'} role - The role to apply
 * @param {string} usage - Usage line shown when the username is missing
 * @returns {(username?: string) => Promise<void>} - The command handler
 */
const setRoleHandler = (role: 'ADMIN' | 'USER', usage: string) => {
  return async (username?: string): Promise<void> => {
    if (!username) {
      error('Username is required')
      console.log(usage)
      return
    }

    const response = await apiClient.patch(
      `/api/admin/users/${username}/role`,
      { role },
      true
    )

    if (!response) return

    success(response.message)
  }
}

const handlePromote = setRoleHandler(
  'ADMIN',
  'Usage: curlme admin promote <username>'
)

const handleDemote = setRoleHandler(
  'USER',
  'Usage: curlme admin demote <username>'
)

/**
 * Builds a handler that soft deletes or restores an account
 *
 * Deactivating keeps the username reserved and the content in place, so the
 * change is reversible with the matching activate command.
 *
 * @param {boolean} isActive - The active flag to apply
 * @param {string} usage - Usage line shown when the username is missing
 * @returns {(username?: string) => Promise<void>} - The command handler
 */
const setActiveHandler = (isActive: boolean, usage: string) => {
  return async (username?: string): Promise<void> => {
    if (!username) {
      error('Username is required')
      console.log(usage)
      return
    }

    const response = await apiClient.patch(
      `/api/admin/users/${username}/active`,
      { is_active: isActive },
      true
    )

    if (!response) return

    success(response.message)
  }
}

const handleDeactivate = setActiveHandler(
  false,
  'Usage: curlme admin deactivate <username>'
)

const handleActivate = setActiveHandler(
  true,
  'Usage: curlme admin activate <username>'
)

/**
 * Adds a designation to the catalogue
 *
 * @param {string[]} args - slug, label, kind and an optional field
 * @returns {Promise<void>}
 */
const handleAddDesignation = async (args: string[]): Promise<void> => {
  const [slug, label, kind, field] = args

  if (!slug || !label || !kind) {
    error('slug, label and kind are required')
    console.log(
      'Usage: curlme admin add-designation <slug> "<label>" <creator|consumer> [field]'
    )
    return
  }

  const response = await apiClient.post(
    '/api/admin/designations',
    {
      slug,
      label,
      kind: kind.toUpperCase(),
      ...(field ? { field } : {})
    },
    true
  )

  if (!response) return

  success(response.message)
}

/**
 * Prints the admin subcommand list
 *
 * @returns {void}
 */
const showAdminHelp = (): void => {
  console.log(`
${colorize('curlme admin', 'highlight')} - platform monitoring

${colorize('Usage:', 'bold')}
  curlme admin <subcommand> [options]

${colorize('Monitoring:', 'yellow')}
  dashboard [limit]        Everything below, in one pass (default)
  overview                 Platform wide counters
  top-followed [limit]     Users ranked by follower count
  top-posts [limit]        Posts ranked by likes
  top-engaged [limit]      Users ranked by posts plus replies
  follow-graph [limit]     Who follows whom, newest first
  designations             Accounts and followers per designation

${colorize('Administration:', 'yellow')}
  promote <username>       Grant the admin role
  demote <username>        Revoke the admin role
  deactivate <username>    Soft delete an account, keeping its content
  activate <username>      Restore a deactivated account
  add-designation <slug> "<label>" <creator|consumer> [field]
`)
}

/** Subcommand table, so dispatch stays a lookup rather than a switch. */
const ADMIN_COMMANDS: Record<string, (args: string[]) => Promise<void> | void> =
  {
    dashboard: args => handleDashboard(args[0]),
    overview: () => handleOverview(),
    'top-followed': args => handleTopFollowed(args[0]),
    'top-posts': args => handleTopPosts(args[0]),
    'top-engaged': args => handleTopEngaged(args[0]),
    'follow-graph': args => handleFollowGraph(args[0]),
    designations: () => handleDesignationStats(),
    promote: args => handlePromote(args[0]),
    demote: args => handleDemote(args[0]),
    deactivate: args => handleDeactivate(args[0]),
    activate: args => handleActivate(args[0]),
    'add-designation': args => handleAddDesignation(args),
    help: () => showAdminHelp()
  }

/**
 * Routes an admin subcommand to its handler
 *
 * @param {string[]} args - Subcommand followed by its arguments
 * @returns {Promise<void>}
 */
export async function handleAdmin(args: string[]): Promise<void> {
  const [subcommand = 'dashboard', ...rest] = args

  // Own-property check so inherited members like `constructor` are not
  // mistaken for subcommands.
  const command = Object.hasOwn(ADMIN_COMMANDS, subcommand)
    ? ADMIN_COMMANDS[subcommand]
    : undefined

  if (!command) {
    error(`Unknown admin subcommand '${subcommand}'`)
    showAdminHelp()
    return
  }

  await command(rest)
}
