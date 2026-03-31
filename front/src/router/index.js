import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'

const PERMISSIONS = {
    SUPER_ADMIN: 1,
    COMPANY_ADMIN: 2,
    OPERATOR: 3,
    REGISTERED: 4
}

const routes = [
    {
        path: '/login',
        name: 'Login',
        component: () => import('@/views/Login/index.vue'),
        meta: { public: true }
    },
    {
        path: '/',
        component: () => import('@/components/Layout/index.vue'),
        redirect: '/dashboard',
        children: [
            {
                path: 'dashboard',
                name: 'Dashboard',
                component: () => import('@/views/Dashboard/index.vue'),
                meta: {
                    title: '个人中心',
                    icon: 'User',
                    permission: PERMISSIONS.OPERATOR
                }
            },
            {
                path: 'dashboard/edit',
                name: 'EditProfile',
                component: () => import('@/views/Dashboard/Edit.vue'),
                meta: {
                    title: '编辑资料',
                    hidden: true,
                    permission: PERMISSIONS.OPERATOR
                }
            },
            {
                path: 'monitor',
                name: 'Monitor',
                component: () => import('@/views/Monitor/index.vue'),
                meta: {
                    title: '设备监控',
                    icon: 'VideoCamera',
                    permission: PERMISSIONS.OPERATOR
                }
            },
            {
                path: 'analysis',
                name: 'Analysis',
                component: () => import('@/views/DataAnalysis/index.vue'),
                meta: {
                    title: '数据分析',
                    icon: 'TrendCharts',
                    permission: PERMISSIONS.OPERATOR
                }
            },
            {
                path: 'users',
                name: 'UserManagement',
                component: () => import('@/views/UserManagement/index.vue'),
                meta: {
                    title: '用户管理',
                    icon: 'UserFilled',
                    permission: PERMISSIONS.COMPANY_ADMIN
                }
            },
            {
                path: 'emergency',
                name: 'Emergency',
                component: () => import('@/views/Emergency/index.vue'),
                meta: {
                    title: '紧急模式',
                    icon: 'Warning',
                    public: true,
                    hidden: true
                }
            }
        ]
    },
    {
        path: '/:pathMatch(.*)*',
        redirect: '/'
    }
]

const router = createRouter({
    history: createWebHistory(process.env.BASE_URL),
    routes
})

// 安全解析 localStorage
const getUserInfo = () => {
    try {
        const str = localStorage.getItem('userInfo')
        if (!str || str === 'undefined') return null
        return JSON.parse(str)
    } catch (e) {
        console.error('解析 userInfo 失败:', e)
        localStorage.removeItem('userInfo')
        return null
    }
}

router.beforeEach((to, from, next) => {
    const userInfo = getUserInfo()
    const token = localStorage.getItem('token')

    // 公开页面直接放行
    if (to.meta.public) {
        next()
        return
    }

    // 检查登录状态
    if (!token) {
        next('/login')
        return
    }

    // 检查权限
    if (to.meta.permission && userInfo) {
        if (userInfo.permissionLevel > to.meta.permission) {
            ElMessage.error('权限不足，无法访问该页面')
            next('/dashboard')
            return
        }
    }

    next()
})

export default router