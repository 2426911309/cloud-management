import request from '../utils/request'

export const authApi = {
    login(data) {
        return request.post('/auth/login', data)
    },

    register(data) {
        return request.post('/auth/register', data)
    },

    getUserInfo() {
        return request.get('/auth/user')
    },

    getUserList(params) {
        return request.get('/auth/users', { params })
    },

    updateUserPermission(userId, data) {
        return request.put(`/auth/users/${userId}/permission`, data)
    },

    deleteUser(userId) {
        return request.delete(`/auth/users/${userId}`)
    },

    getCompanies() {
        return request.get('/auth/companies')
    }
}