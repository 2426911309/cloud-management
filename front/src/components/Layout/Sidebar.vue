<template>
    <aside class="sidebar">
        <div class="logo">
            <el-icon size="32" color="#fff"><Monitor /></el-icon>
            <span class="logo-text">云巡检平台</span>
            <el-tag v-if="isEmergency" type="danger" size="small" effect="dark" class="emergency-tag">
                紧急
            </el-tag>
        </div>

        <el-menu
                :default-active="activeMenu"
                class="sidebar-menu"
                background-color="transparent"
                text-color="#94a3b8"
                active-text-color="#fff"
                router
        >
            <template v-for="item in visibleMenuItems" :key="item.path">
                <el-menu-item :index="item.path">
                    <el-icon>
                        <component :is="item.icon" />
                    </el-icon>
                    <span>{{ item.title }}</span>
                </el-menu-item>
            </template>
        </el-menu>

        <div class="sidebar-footer">
            <div class="user-info">
                <el-avatar :size="32" :icon="UserFilled" />
                <div class="user-meta">
                    <span class="username">{{ username }}</span>
                    <span class="role">{{ userRole }}</span>
                </div>
            </div>
            <el-button type="danger" text @click="handleLogout">
                <el-icon><SwitchButton /></el-icon>
            </el-button>
        </div>
    </aside>
</template>

<script setup>
    import { computed } from 'vue'
    import { useRoute, useRouter } from 'vue-router'
    import { ElMessageBox, ElMessage } from 'element-plus'
    import { UserFilled, SwitchButton, Monitor } from '@element-plus/icons-vue'

    const route = useRoute()
    const router = useRouter()

    const activeMenu = computed(() => route.path)

    // 从 localStorage 获取用户信息
    const userInfo = computed(() => {
        try {
            const str = localStorage.getItem('userInfo')
            if (!str || str === 'undefined') return {}
            return JSON.parse(str)
        } catch (e) {
            return {}
        }
    })

    const username = computed(() => userInfo.value.username || '')
    const userRole = computed(() => userInfo.value.role || '')
    const permissionLevel = computed(() => userInfo.value.permissionLevel || 4)
    const isEmergency = computed(() => userInfo.value.isEmergency || false)

    // 权限等级常量
    const PERMISSIONS = {
        SUPER_ADMIN: 1,    // 超级管理员（厂商）- 最高权限
        COMPANY_ADMIN: 2,  // 小区管理员
        OPERATOR: 3,       // 值班员
        REGISTERED: 4      // 注册人员
    }

    // 所有菜单项及所需权限
    const allMenuItems = [
        {
            path: '/dashboard',
            title: '个人中心',
            icon: 'User',
            minPermission: PERMISSIONS.OPERATOR  // 3级及以上可见
        },
        {
            path: '/monitor',
            title: '设备监控',
            icon: 'VideoCamera',
            minPermission: PERMISSIONS.OPERATOR  // 3级及以上可见
        },
        {
            path: '/analysis',
            title: '数据分析',
            icon: 'TrendCharts',
            minPermission: PERMISSIONS.OPERATOR  // 3级及以上可见
        },
        {
            path: '/users',
            title: '用户管理',
            icon: 'UserFilled',
            minPermission: PERMISSIONS.COMPANY_ADMIN  // 2级及以上可见（超级管理员+小区管理员）
        }
    ]

    // 根据权限过滤菜单
    // 规则：用户权限等级数字越小，权限越高
    // 例如：超级管理员=1，可以访问所有 minPermission >= 1 的菜单
    const visibleMenuItems = computed(() => {
        console.log('当前用户:', username.value, '权限等级:', permissionLevel.value, '角色:', userRole.value)

        return allMenuItems.filter(item => {
            // 紧急模式限制：只能看基础功能，不能看用户管理
            if (isEmergency.value && item.path === '/users') {
                return false
            }

            // 正常权限判断：用户等级 <= 菜单要求等级
            // 例如：用户等级1（超级管理员）<= 菜单要求2（用户管理）→ true，可以访问
            const canAccess = permissionLevel.value <= item.minPermission

            console.log('菜单:', item.title, '需要等级:', item.minPermission, '当前等级:', permissionLevel.value, '能否访问:', canAccess)

            return canAccess
        })
    })

    const handleLogout = () => {
        ElMessageBox.confirm('确定要退出登录吗？', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        }).then(() => {
            localStorage.removeItem('token')
            localStorage.removeItem('userInfo')
            localStorage.removeItem('emergencyMode')
            localStorage.removeItem('emergencyToken')

            window.location.href = '/login'
            ElMessage.success('已退出登录')
        })
    }
</script>

<style lang="scss" scoped>
    .sidebar {
        width: 240px;
        height: 100vh;
        background: #1e293b;
        position: fixed;
        left: 0;
        top: 0;
        display: flex;
        flex-direction: column;
        z-index: 100;
    }

    .logo {
        height: 64px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        position: relative;

        .logo-text {
            color: #fff;
            font-size: 18px;
            font-weight: 600;
            letter-spacing: 1px;
        }

        .emergency-tag {
            position: absolute;
            right: 12px;
            animation: pulse 2s infinite;
        }
    }

    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.6; }
    }

    .sidebar-menu {
        flex: 1;
        border-right: none;
        padding: 16px 0;
    }

    .sidebar-menu ::v-deep .el-menu-item {
        height: 50px;
        margin: 4px 16px;
        border-radius: 8px;
        transition: all 0.3s;

        &:hover, &.is-active {
            background: #2563eb !important;
        }

        .el-icon {
            font-size: 18px;
        }
    }

    .sidebar-footer {
        padding: 16px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: space-between;

        .user-info {
            display: flex;
            align-items: center;
            gap: 10px;

            .user-meta {
                display: flex;
                flex-direction: column;
                gap: 2px;

                .username {
                    color: #fff;
                    font-size: 14px;
                    font-weight: 500;
                }

                .role {
                    color: #94a3b8;
                    font-size: 12px;
                }
            }
        }
    }
</style>