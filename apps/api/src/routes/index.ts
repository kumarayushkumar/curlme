import curlme from './curlme.js'
import user from './user.js'

const ROUTER = [
  {
    path: '/curlme',
    router: curlme
  },
  {
    path: '/',
    router: user
  }
]

export default ROUTER
