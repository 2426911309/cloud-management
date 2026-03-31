import request from '../utils/request'

export const deviceApi = {
    getDeviceList(params) {
        return request.get('/device', { params })
    },

    addDevice(data) {
        return request.post('/device', data)
    },

    updateDevice(id, data) {
        return request.put(`/device/${id}`, data)
    },

    deleteDevice(id) {
        return request.delete(`/device/${id}`)
    },

    assignPermission(deviceId, data) {
        return request.post(`/device/${deviceId}/permissions`, data)
    }
}