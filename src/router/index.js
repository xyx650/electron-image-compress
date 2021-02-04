import { createRouter, createWebHashHistory } from 'vue-router'
import ImageCompress from '../views/ImageCompress'

const routes = [
  {
    path: '/',
    name: 'ImageCompress',
    component: ImageCompress
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
