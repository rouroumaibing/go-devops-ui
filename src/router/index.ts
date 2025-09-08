import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import MainLayout from '@/components/layout/MainLayout.vue'
const routes: Array<RouteRecordRaw> = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: () => import('@/views/login/LoginDashboard.vue'), meta: { title: '登录' }},
  { path: '/login/register', component: () => import('@/views/login/auths/RegisterWithPWD.vue'), meta: { title: '注册' }},
  { path: '/', component: MainLayout, children: [
    { path: 'dashboard', component: () => import('@/views/dashboard/Dashboard.vue'), meta: { title: '控制台', icon: 'HomeFilled' }},
    { path: 'serviceTree', component: () => import('@/views/servicetree/ServiceTreeManage.vue'), meta: { title: '服务树管理', icon: 'HomeFilled' }},
    { 
      path: 'user', 
      component: () => import('@/views/user/UserDashboard.vue'), 
      meta: { title: '用户管理', icon: 'UserFilled' },
      children: [
        { path: 'list', component: () => import('@/views/user/UserManage.vue'), meta: { title: '用户列表' }},
        { path: 'group', component: () => import('@/views/user/UserGroupManage.vue'), meta: { title: '用户组管理' }},
        { path: 'permission', component: () => import('@/views/user/PermissionManage.vue'), meta: { title: '权限管理' }}]
    },
    { path: 'userGroup', component: () => import('@/views/user/UserGroupManage.vue'), meta: { title: '用户组管理', icon: 'UserFilled' }},
    { path: 'permission', component: () => import('@/views/user/PermissionManage.vue'), meta: { title: '权限管理', icon: 'UserFilled' }},
    { path: 'service', component: () => import('@/views/service/ServiceDashboard.vue'), meta: { title: '服务管理', icon: 'Setting' },
      children: [
        { path: 'component', component: () => import('@/views/service/component/ComponentManage.vue'), meta: { title: '组件管理' }},
        { path: 'list', component: () => import('@/views/service/pipeline/PipelineManage.vue'), meta: { title: '流水线列表' }},
        { path: 'environment', component: () => import('@/views/service/environment/EnvironmentManage.vue'), meta: { title: '环境管理' }},
        { path: 'change', component: () => import('@/views/service/change/ChangeManage.vue'), meta: { title: '变更' }},
        { path: 'build', component: () => import('@/views/service/build/BuildManage.vue'), meta: { title: '构建' }},
        { path: 'product', component: () => import('@/views/service/product/ProductManage.vue'), meta: { title: '产物管理' }}]
    },
    { path: 'apimanager', component: () => import('@/views/apimanager/apimanager.vue'), meta: { title: 'API管理', icon: 'Document' }},
    { path: 'logmanager', component: () => import('@/views/logmanager/logmanager.vue'), meta: { title: '日志管理', icon: 'Bell' }}
  ]}
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router