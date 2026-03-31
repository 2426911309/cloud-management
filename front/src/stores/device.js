import { defineStore } from 'pinia'
import { ref } from 'vue'
import { deviceApi } from '../api/device'

export const useDeviceStore = defineStore('device', () => {
    // State
    const devices = ref([])
    const currentDevice = ref(null)
    const loading = ref(false)

    // Actions
    const fetchDevices = async (params = {}) => {
        loading.value = true
        try {
            const res = await deviceApi.getDeviceList(params)
            if (res.success) {
                devices.value = res.data
            }
            return res
        } finally {
            loading.value = false
        }
    }

    const addDevice = async (deviceData) => {
        const res = await deviceApi.addDevice(deviceData)
        if (res.success) {
            await fetchDevices()
        }
        return res
    }

    const updateDevice = async (id, data) => {
        const res = await deviceApi.updateDevice(id, data)
        if (res.success) {
            await fetchDevices()
        }
        return res
    }

    const deleteDevice = async (id) => {
        const res = await deviceApi.deleteDevice(id)
        if (res.success) {
            await fetchDevices()
        }
        return res
    }

    const setCurrentDevice = (device) => {
        currentDevice.value = device
    }

    return {
        devices,
        currentDevice,
        loading,
        fetchDevices,
        addDevice,
        updateDevice,
        deleteDevice,
        setCurrentDevice
    }
})