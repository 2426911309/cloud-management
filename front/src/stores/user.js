import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '../api/auth'

// 权限等级常量
export const PERMISSIONS = {
    SUPER_ADMIN: 1,    // 超级管理员（厂商）
    COMPANY_ADMIN: 2,  // 小区管理员
    OPERATOR: 3,       // 值班员
    REGISTERED: 4      // 注册人员（未授权）
}

export const useUserStore = defineStore('user', () => {
    // State
    const token = ref(localStorage.getItem('token') || '')
    const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'))

    // Getters
    const isLoggedIn = computed(() => !!token.value)
    const username = computed(() => userInfo.value.username || '')
    const permissionLevel = computed(() => userInfo.value.permissionLevel || PERMISSIONS.REGISTERED)
    const companyId = computed(() => userInfo.value.companyId || null)

    // 权限检查
    const isSuperAdmin = computed(() => permissionLevel.value === PERMISSIONS.SUPER_ADMIN)
    const isCompanyAdmin = computed(() => permissionLevel.value === PERMISSIONS.COMPANY_ADMIN)
    const isOperator = computed(() => permissionLevel.value === PERMISSIONS.OPERATOR)
    const canManageUsers = computed(() => permissionLevel.value <= PERMISSIONS.COMPANY_ADMIN)
    const canManageDevices = computed(() => permissionLevel.value <= PERMISSIONS.COMPANY_ADMIN)
    const canViewData = computed(() => permissionLevel.value <= PERMISSIONS.OPERATOR)

    // Actions
    const setToken = (newToken) => {
        token.value = newToken
        localStorage.setItem('token', newToken)
    }

    const setUserInfo = (info) => {
        userInfo.value = info
        localStorage.setItem('userInfo', JSON.stringify(info))
    }

    const updateUserInfo = (data) => {
        userInfo.value = { ...userInfo.value, ...data }
        localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
    }

    const logout = () => {
        token.value = ''
        userInfo.value = {}
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
        // 强制刷新页面清除所有状态
        window.location.href = '/login'
    }

    // 检查是否有特定权限等级
    const hasPermission = (level) => {
        return permissionLevel.value <= level
    }

    return {
        token,
        userInfo,
        isLoggedIn,
        username,
        permissionLevel,
        companyId,
        isSuperAdmin,
        isCompanyAdmin,
        isOperator,
        canManageUsers,
        canManageDevices,
        canViewData,
        setToken,
        setUserInfo,
        updateUserInfo,
        logout,
        hasPermission,
        PERMISSIONS
    }
})