import curlme from './curlme.js'
import user from './user.js'

const ROUTER = [
  {
    path: '/',
    router: curlme
  },
  {
    path: '/api',
    router: user
  }
]

export default ROUTER
