/**
 * Controller composing every admin statistic into one payload
 */

import getDesignationStatsController, {
  type DesignationStat
} from './get-designation-stats.controller.js'
import getFollowGraphController, {
  type FollowEdge
} from './get-follow-graph.controller.js'
import getOverviewController, {
  type AdminOverview
} from './get-overview.controller.js'
import getTopEngagedController, {
  type TopEngagedUser
} from './get-top-engaged.controller.js'
import getTopFollowedController, {
  type TopFollowedUser
} from './get-top-followed.controller.js'
import getTopPostsController, {
  type TopPost
} from './get-top-posts.controller.js'

export type AdminDashboard = {
  overview: AdminOverview
  top_followed: TopFollowedUser[]
  top_engaged: TopEngagedUser[]
  top_posts: TopPost[]
  follow_graph: FollowEdge[]
  designations: DesignationStat[]
}

/**
 * Gathers every statistic in one round trip
 *
 * Exists so the CLI dashboard is a single request. Fetching the six tables
 * separately spends most of the per client rate limit on one screen.
 *
 * @param {number} limit - Row limit applied to each ranked table
 * @returns {Promise<AdminDashboard>} - Every section of the dashboard
 */
const getDashboardController = async (
  limit: number
): Promise<AdminDashboard> => {
  const [
    overview,
    topFollowed,
    topEngaged,
    topPosts,
    followGraph,
    designations
  ] = await Promise.all([
    getOverviewController(),
    getTopFollowedController(limit),
    getTopEngagedController(limit),
    getTopPostsController(limit),
    getFollowGraphController(limit),
    getDesignationStatsController()
  ])

  return {
    overview,
    top_followed: topFollowed,
    top_engaged: topEngaged,
    top_posts: topPosts,
    follow_graph: followGraph,
    designations
  }
}

export default getDashboardController
