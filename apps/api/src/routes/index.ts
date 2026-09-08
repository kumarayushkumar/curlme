import admin from './admin.js'
import curlme from './curlme.js'
import user from './user.js'

const ROUTER = [
  {
    path: '/',
    router: curlme
  },
  // Mounted before the general /api router so the admin guard is reached first.
  {
    path: '/api/admin',
    router: admin
  },
  {
    path: '/api',
    router: user
  }
]

export default ROUTER
