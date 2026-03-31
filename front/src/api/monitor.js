import request from '../utils/request'

export const monitorApi = {
    // 获取设备历史读数（折线图）
    getMeterHistory(deviceId, params) {
        return request.get(`/analysis/history/${deviceId}`, { params })
    },
    // 获取设备能耗对比（柱状图）
    getDeviceCompare(params) {
        return request.get('/analysis/devices/compare', { params })
    },
    // 获取准确率统计（按表计类型分组）
    getAccuracyStats() {
        return request.get('/analysis/accuracy-stats')
    },
    // 获取统计卡片数据
    getStatistics() {
        return request.get('/analysis/statistics')
    },
    // 获取识别记录明细
    getRecognitionRecords(params) {
        return request.get('/analysis/recognition-logs', { params })
    }
}