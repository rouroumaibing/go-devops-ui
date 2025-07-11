import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import MainLayout from '@/components/layout/MainLayout.vue'
const routes: Array<RouteRecordRaw> = [
  { path: '/', redirect: '/dashboard' },
  { path: '/', component: MainLayout, children: [
    { path: 'dashboard', component: () => import('@/views/dashboard/Dashboard.vue'), meta: { title: '控制台', icon: 'HomeFilled' }},
    { path: 'serviceTree', component: () => import('@/views/servicetree/ServiceTreeManage.vue'), meta: { title: '服务树管理', icon: 'HomeFilled' }},
    { path: 'user', component: () => import('@/views/user/UserManage.vue'), meta: { title: '用户管理', icon: 'UserFilled' }},
    { path: 'userGroup', component: () => import('@/views/user/UserGroupManage.vue'), meta: { title: '用户组管理', icon: 'UserFilled' }},
    { path: 'permission', component: () => import('@/views/user/PermissionManage.vue'), meta: { title: '权限管理', icon: 'UserFilled' }},
    { path: 'service', component: () => import('@/views/service/ServiceDashboard.vue'), meta: { title: '服务管理', icon: 'Setting' },
      children: [
        { path: 'component', component: () => import('@/views/service/ComponentManage.vue'), meta: { title: '组件管理' }},
        { path: 'list', component: () => import('@/views/service/PipelineManage.vue'), meta: { title: '流水线列表' }},
        { path: 'environment', component: () => import('@/views/service/EnvironmentManage.vue'), meta: { title: '环境管理' }},
        { path: 'change', component: () => import('@/views/service/ChangeManage.vue'), meta: { title: '变更' }},
        { path: 'build', component: () => import('@/views/service/BuildManage.vue'), meta: { title: '构建' }},
        { path: 'product', component: () => import('@/views/service/ProductManage.vue'), meta: { title: '产物管理' }}
      ]
    }
  ]}
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router