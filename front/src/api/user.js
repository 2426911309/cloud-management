import request from '../utils/request'

export const userApi = {
    updateUserInfo(data) {
        return request.put('/user/info', data)
    },

    changePassword(data) {
        return request.put('/user/password', data)
    },

    resetPassword(userId, data) {
        return request.put(`/user/reset-password/${userId}`, data)
    },
    // 获取个人中心统计数据
    getDashboardStats() {
        return request.get('/user/dashboard-stats')
    }
}