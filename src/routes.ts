
import user from './routes/user.js'
import curlme from './routes/curlme.js'

const ROUTER = [
   {
    path: '/curlme',
    router: curlme,
  },
  {
    path: '/',
    router: user,
  }
]

export default ROUTER
