import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
    // 使用相对路径，让代理生效
    baseURL: '/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
})

// 请求拦截器
request.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// 响应拦截器
request.interceptors.response.use(
    (response) => {
        // 如果后端返回的是标准格式 { success: true, data: ... }
        if (response.data && typeof response.data === 'object') {
            return response.data
        }
        return response
    },
    (error) => {
        console.error('请求错误:', error)

        let msg = '网络错误'
        if (error.response) {
            // 服务器返回了错误状态码
            msg = error.response.data?.message || `服务器错误: ${error.response.status}`

            if (error.response.status === 401) {
                localStorage.removeItem('token')
                localStorage.removeItem('userInfo')
                window.location.href = '/login'
            }
        } else if (error.request) {
            // 请求发出但没有收到响应
            msg = '无法连接到服务器，请检查后端是否启动'
        } else {
            msg = error.message
        }

        ElMessage.error(msg)
        return Promise.reject(error)
    }
)

request.interceptors.request.use(
    (config) => {
        console.log('发送请求:', config.method, config.url, config.data)  // 添加
        const token = localStorage.getItem('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

export default request