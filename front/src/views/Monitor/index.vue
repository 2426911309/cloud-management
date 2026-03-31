<template>
    <div class="monitor-container">
        <h2 class="page-title">设备监控</h2>

        <!-- 工具栏 -->
        <div class="toolbar">
            <div class="device-tabs">
                <el-radio-group v-model="currentDeviceId" size="large" @change="switchDevice">
                    <el-radio-button
                            v-for="device in deviceList"
                            :key="device.id"
                            :label="device.id"
                    >
                        <el-icon v-if="device.status === 'online'" color="#10b981" class="status-dot">
                            <CircleCheck />
                        </el-icon>
                        <el-icon v-else color="#ef4444" class="status-dot">
                            <CircleClose />
                        </el-icon>
                        <el-icon v-if="device.source_type === 'local'" color="#3b82f6" class="status-dot">
                            <Monitor />
                        </el-icon>
                        {{ device.name }}
                    </el-radio-button>
                </el-radio-group>
            </div>

            <div class="toolbar-actions">
                <el-button type="primary" @click="handleAddDevice">
                    <el-icon><Plus /></el-icon>
                    添加设备
                </el-button>
                <el-button @click="fetchDevices">
                    <el-icon><Refresh /></el-icon>
                    刷新
                </el-button>
                <el-upload
                        action="#"
                        :auto-upload="false"
                        :show-file-list="false"
                        :on-change="handleTestImageUpload"
                        accept="image/*"
                >
                    <el-button type="info">
                        <el-icon><Upload /></el-icon>上传图片测试
                    </el-button>
                </el-upload>
            </div>
        </div>

        <!-- 监控区域 -->
        <div class="monitor-layout">
            <div class="main-monitor card">
                <div class="monitor-header">
                    <div class="device-info">
                        <h3>{{ currentDevice?.name }}</h3>
                        <div class="device-meta">
                            <el-tag
                                    size="small"
                                    :type="currentDevice?.status === 'online' ? 'success' : 'danger'"
                            >
                                {{ currentDevice?.status === 'online' ? '在线' : '离线' }}
                            </el-tag>
                            <el-tag v-if="currentDevice?.source_type === 'local'" size="small" type="primary">
                                本地设备
                            </el-tag>
                            <span class="location">
                <el-icon><Location /></el-icon>
                {{ currentDevice?.location }}
              </span>
                        </div>
                    </div>

                    <div class="monitor-controls">
                        <el-button-group>
                            <el-button
                                    v-if="currentDevice?.source_type === 'local'"
                                    type="success"
                                    @click="initLocalCamera"
                            >
                                <el-icon><VideoCamera /></el-icon>
                                启动摄像头
                            </el-button>
                            <el-button :type="isRecognizing ? 'danger' : 'primary'" @click="toggleRecognition">
                                <el-icon><Aim /></el-icon>
                                {{ isRecognizing ? '停止识别' : 'AI识别' }}
                            </el-button>
                            <el-button @click="captureFrame">
                                <el-icon><Camera /></el-icon>
                                截图
                            </el-button>
                        </el-button-group>
                    </div>
                </div>

                <!-- 视频区域 -->
                <div class="video-container" ref="videoContainer">
                    <video
                            v-if="currentDevice?.source_type === 'local'"
                            ref="localVideo"
                            class="video-player"
                            autoplay
                            playsinline
                            @loadedmetadata="handleVideoResize"
                    ></video>

                    <video
                            v-else-if="currentDevice?.status ==='online'"
                            ref="videoPlayer"
                            class="video-player"
                            autoplay
                            muted
                            loop
                            playsinline
                            :src="currentDevice?.url"
                            @loadedmetadata="handleVideoResize"
                    ></video>

                    <div v-else class="offline-placeholder">
                        <el-icon size="64" color="#cbd5e1"><VideoPause /></el-icon>
                        <p>设备离线或未选择</p>
                        <p v-if="currentDevice?.source_type === 'local'" class="hint">
                            请点击"启动摄像头"按钮获取权限
                        </p>
                    </div>

                    <!-- AI识别框叠加层 -->
                    <canvas
                            v-show="isRecognizing"
                            ref="detectCanvas"
                            class="detect-overlay"
                    ></canvas>

                    <!-- 识别结果浮窗 -->
                    <div v-if="recognitionResult && isRecognizing" class="recognition-panel">
                        <div class="rec-header">
                            <el-icon><Aim /></el-icon>
                            <span>AI识别结果</span>
                            <el-tag size="small" type="success" effect="dark">YOLOv8</el-tag>
                        </div>
                        <div class="rec-content">
                            <div class="meter-value">
                                <span class="value">{{ recognitionResult.count || 0 }}</span>
                                <span class="unit">个表计</span>
                            </div>
                            <div class="rec-info">
                                <span>平均置信度: {{ (recognitionResult.confidence * 100).toFixed(1) }}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 底部信息 -->
                <div class="monitor-footer" v-if="currentDevice">
                    <div class="stream-info">
                        <span>设备ID: {{ currentDevice.id }}</span>
                        <span>类型: {{ currentDevice.type }}</span>
                        <span>来源: {{ currentDevice.source_type === 'local' ? '本地摄像头' : '网络设备' }}</span>
                    </div>
                    <div class="last-update">
                        最后更新: {{ new Date().toLocaleTimeString() }}
                    </div>
                </div>
            </div>

            <!-- 侧边栏 -->
            <div class="sidebar-panel">
                <div class="panel-card card">
                    <div class="panel-header">
                        <h4>设备列表</h4>
                        <el-tag size="small" type="info">{{ deviceList.length }} 个设备</el-tag>
                    </div>
                    <div class="device-list">
                        <div
                                v-for="device in deviceList"
                                :key="device.id"
                                class="device-item"
                                :class="{ active: device.id === currentDeviceId, local: device.source_type === 'local' }"
                                @click="switchDevice(device.id)"
                        >
                            <div class="device-icon" :class="device.source_type">
                                <el-icon size="24">
                                    <VideoCamera v-if="device.source_type === 'network'" />
                                    <Monitor v-else-if="device.source_type === 'local'" />
                                    <Document v-else />
                                </el-icon>
                            </div>
                            <div class="device-detail">
                                <span class="device-name">{{ device.name }}</span>
                                <span class="device-loc">{{ device.location }}</span>
                            </div>
                            <div class="device-status">
                                <el-icon v-if="device.status === 'online'" color="#10b981"><CircleCheck /></el-icon>
                                <el-icon v-else color="#ef4444"><CircleClose /></el-icon>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 设备信息 -->
                <div class="panel-card card" v-if="currentDevice">
                    <div class="panel-header">
                        <h4>设备信息</h4>
                    </div>
                    <div class="device-info-list">
                        <div class="info-row">
                            <span class="label">设备名称</span>
                            <span class="value">{{ currentDevice.name }}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">安装位置</span>
                            <span class="value">{{ currentDevice.location }}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">设备类型</span>
                            <span class="value">{{ currentDevice.type }}</span>
                        </div>
                        <div class="info-row" v-if="currentDevice.meter_type">
                            <span class="label">表计类型</span>
                            <span class="value">{{ currentDevice.meter_type }}</span>
                        </div>
                        <div class="info-row" v-if="currentDevice.source_type === 'local'">
                            <span class="label">特殊说明</span>
                            <span class="value text-primary">本地摄像头设备</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <DeviceModal
                v-model:modelValue="showAddModal"
                :device="editingDevice"
                @save="handleSaveDevice"
        />
    </div>
</template>

<script setup>
    import  { ref, computed, onMounted, onUnmounted } from 'vue'
    import axios from 'axios'

    import { ElMessage } from 'element-plus'
    import {
        Plus, Refresh, CircleCheck, CircleClose, Location,
        Aim, Camera, VideoCamera, VideoPause, Monitor, Document
    } from '@element-plus/icons-vue'
    import request from '@/utils/request'
    import DeviceModal from './DeviceModal.vue'

    // 状态
    const deviceList = ref([])
    const currentDeviceId = ref(null)
    const showAddModal = ref(false)
    const editingDevice = ref(null)
    const isRecognizing = ref(false)
    const recognitionResult = ref(null)
    const videoPlayer = ref(null)
    const localVideo = ref(null)
    const localStream = ref(null)
    const loading = ref(false)
    const detections = ref([])          // 当前帧的检测框
    const recognitionInterval = ref(null) // 定时器句柄
    const detectCanvas = ref(null)

    const handleTestImageUpload = async (file) => {
        if (!file.raw) return

        const reader = new FileReader()
        reader.onload = async (e) => {
            const base64Image = e.target.result

            try {
                console.log('发送图片识别请求，图片base64长度:', base64Image.length)
                const response = await axios.post('/ai/detect', { image: base64Image })
                console.log('原始响应:', response)
                const result = response.data

                if (result.success && result.detections.length > 0) {
                    ElMessage.success(`识别到 ${result.detections.length} 个表计，平均置信度 ${(result.detections.reduce((acc,d)=>acc+d.confidence,0)/result.detections.length*100).toFixed(1)}%`)
                    if (result.visualization) {
                        const win = window.open()
                        win.document.write(`<img src="${result.visualization}" style="max-width:100%">`)
                    }
                } else {
                    ElMessage.warning('未检测到表计')
                }
            } catch (error) {
                console.error('测试识别请求失败:', error)
                if (error.response) {
                    // 服务器返回了错误状态码
                    console.error('错误响应:', error.response.data)
                    ElMessage.error(`服务器错误: ${error.response.status} - ${error.response.data?.detail || error.response.statusText}`)
                } else if (error.request) {
                    // 请求发出但没有收到响应
                    console.error('无响应:', error.request)
                    ElMessage.error('无法连接到后端服务，请检查后端是否启动')
                } else {
                    ElMessage.error(error.message)
                }
            }
        }
        reader.readAsDataURL(file.raw)
    }

    // 绘制检测框
    const drawDetections = () => {
        const canvas = detectCanvas.value
        if (!canvas || !currentDevice.value) return

        const video = currentDevice.value.source_type === 'local' ? localVideo.value : videoPlayer.value
        if (!video || !video.videoWidth) return

        // 设置canvas尺寸与视频一致
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        const ctx = canvas.getContext('2d')
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        detections.value.forEach(det => {
            const [x1, y1, x2, y2] = det.bbox
            const conf = det.confidence
            const cls = det.class

            // 绘制红色框
            ctx.strokeStyle = '#ff0000'
            ctx.lineWidth = 3
            ctx.strokeRect(x1, y1, x2 - x1, y2 - y1)

            // 绘制标签背景
            ctx.font = '16px Arial'
            const label = `${cls} ${(conf * 100).toFixed(1)}%`
            const textWidth = ctx.measureText(label).width
            ctx.fillStyle = '#ff0000'
            ctx.fillRect(x1, y1 - 25, textWidth + 10, 25)

            // 绘制文字
            ctx.fillStyle = '#ffffff'
            ctx.font = '14px Arial'
            ctx.fillText(label, x1 + 5, y1 - 7)
        })
    }

    // 捕获一帧并识别
    const captureAndRecognize = async () => {
        if (!isRecognizing.value || !currentDevice.value) return

        const video = currentDevice.value.source_type === 'local' ? localVideo.value : videoPlayer.value
        // 检查视频是否已加载元数据且有有效尺寸
        if (!video || video.readyState < 2 || video.videoWidth === 0) {
            console.warn('视频未就绪，跳过识别', video?.readyState, video?.videoWidth)
            return
        }

        console.log('捕获帧尺寸:', video.videoWidth, video.videoHeight)

        // 创建canvas捕获帧
        const captureCanvas = document.createElement('canvas')
        captureCanvas.width = video.videoWidth
        captureCanvas.height = video.videoHeight
        const ctx = captureCanvas.getContext('2d')
        ctx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height)

        const imageData = captureCanvas.toDataURL('image/jpeg', 0.8)
        console.log('base64长度:', imageData.length)

        try {
            const response = await axios.post('/ai/detect', { image: imageData })
            const result = response.data
            console.log('识别结果:', result)

            if (result.success) {
                detections.value = result.detections || []
                console.log('检测到目标数：', detections.value.length)
                if (result.detections && result.detections.length > 0) {
                    const avgConf = result.detections.reduce((acc, d) => acc + d.confidence, 0) / result.detections.length
                    recognitionResult.value = {
                        count: result.detections.length,
                        confidence: avgConf
                    }
                } else {
                    recognitionResult.value = null
                }
                drawDetections()
            }
        } catch (error) {
            console.error('识别请求失败:', error)
        }
    }

    // 启动识别
    const startRecognition = () => {
        if (!currentDevice.value) {
            ElMessage.warning('请先选择设备')
            return
        }

        isRecognizing.value = true
        // 每2秒识别一次
        recognitionInterval.value = setInterval(captureAndRecognize, 1000)

        // 模拟识别，实际应调用后端API
        const interval = setInterval(async () => {
            if (!isRecognizing.value) {
                clearInterval(interval)
                return
            }

            try {
                // 如果是本地摄像头，截图发送到后端识别
                if (currentDevice.value.source_type === 'local' && localVideo.value) {
                    const imageData = captureFrameForAI()
                    // TODO: 发送到后端识别
                    // const res = await request.post('/monitor/recognition', {
                    //   deviceId: currentDevice.value.id,
                    //   image: imageData
                    // })
                }

                // 模拟结果
                recognitionResult.value = {
                    value: (1200 + Math.random() * 100).toFixed(1),
                    confidence: 0.85 + Math.random() * 0.14
                }
            } catch (error) {
                console.error('识别错误:', error)
            }
        }, 2000)
    }

    const stopRecognition = () => {
        isRecognizing.value = false
        if (recognitionInterval.value) {
            clearInterval(recognitionInterval.value)
            recognitionInterval.value = null
        }
        // 清空画布
        if (detectCanvas.value) {
            const ctx = detectCanvas.value.getContext('2d')
            ctx.clearRect(0, 0, detectCanvas.value.width, detectCanvas.value.height)
        }
        detections.value = []
        recognitionResult.value = null
    }

    // 计算属性
    const currentDevice = computed(() => {
        return deviceList.value.find(d => d.id === currentDeviceId.value)
    })

    const isLocalCameraActive = computed(() => {
        return currentDevice.value?.source_type === 'local' && localStream.value
    })

    // 获取设备列表
    const fetchDevices = async () => {
        loading.value = true
        try {
            const res = await request.get('/device')
            if (res.success) {
                deviceList.value = res.data

                // 如果有本地摄像头，默认选中
                const localCam = res.data.find(d => d.source_type === 'local')
                if (localCam && !currentDeviceId.value) {
                    currentDeviceId.value = localCam.id
                    // 自动启动本地摄像头
                    if (localCam.source_type === 'local') {
                        setTimeout(() => initLocalCamera(), 500)
                    }
                }
            }
        } catch (error) {
            ElMessage.error('获取设备列表失败')
        } finally {
            loading.value = false
        }
    }

    // 切换设备
    const switchDevice = async (deviceId) => {
        // 停止当前本地摄像头
        if (localStream.value) {
            localStream.value.getTracks().forEach(track => track.stop())
            localStream.value = null
        }

        stopRecognition()
        currentDeviceId.value = deviceId

        const device = deviceList.value.find(d => d.id === deviceId)

        // 如果是本地摄像头，自动启动
        if (device?.source_type === 'local') {
            setTimeout(() => initLocalCamera(), 300)
        }
    }

    // 初始化本地摄像头
    const initLocalCamera = async () => {
        if (!currentDevice.value || currentDevice.value.source_type !== 'local') {
            return
        }

        try {
            // 停止之前的流
            if (localStream.value) {
                localStream.value.getTracks().forEach(track => track.stop())
            }

            // 获取摄像头权限
            localStream.value = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'  // 前置摄像头
                },
                audio: false
            })

            // 绑定到视频元素
            if (localVideo.value) {
                localVideo.value.srcObject = localStream.value
            }

            ElMessage.success('本地摄像头已启动')
        } catch (error) {
            console.error('摄像头错误:', error)
            let msg = '无法访问摄像头'
            if (error.name === 'NotAllowedError') {
                msg = '请允许摄像头权限'
            } else if (error.name === 'NotFoundError') {
                msg = '未找到摄像头设备'
            }
            ElMessage.error(msg)
        }
    }

    // AI识别
    const toggleRecognition = () => {
        if (isRecognizing.value) {
            stopRecognition()
        } else {
            startRecognition()
        }
    }

    // 截图（保存用）
    const captureFrame = () => {
        const video = currentDevice.value?.source_type === 'local'
            ? localVideo.value
            : videoPlayer.value

        if (!video || !video.videoWidth) {
            ElMessage.warning('视频未就绪')
            return
        }

        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        const link = document.createElement('a')
        link.download = `snapshot_${currentDevice.value.name}_${Date.now()}.jpg`
        link.href = canvas.toDataURL('image/jpeg', 0.95)
        link.click()

        ElMessage.success('截图已保存')
    }

    // 截图（用于AI识别）
    const captureFrameForAI = () => {
        const video = localVideo.value
        if (!video || !video.videoWidth) return null

        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        return canvas.toDataURL('image/jpeg', 0.8)
    }

    // 添加设备
    const handleAddDevice = () => {
        editingDevice.value = null
        showAddModal.value = true
    }

    // 保存设备
    const handleSaveDevice = async (deviceData) => {
        try {
            if (deviceData.id) {
                // 更新
                const res = await request.put(`/device/${deviceData.id}`, deviceData)
                if (res.success) {
                    ElMessage.success('设备更新成功')
                    fetchDevices()
                }
            } else {
                // 新增
                const res = await request.post('/device', deviceData)
                if (res.success) {
                    ElMessage.success('设备添加成功')
                    fetchDevices()
                }
            }
            showAddModal.value = false
        } catch (error) {
            ElMessage.error('保存失败')
        }
    }

    // 组件挂载
    onMounted(() => {
        fetchDevices()
    })

    // 组件卸载
    onUnmounted(() => {
        if (localStream.value) {
            localStream.value.getTracks().forEach(track => track.stop())
        }
        stopRecognition()
    })

    const handleVideoResize = () => {
        if (detectCanvas.value && currentDevice.value) {
            drawDetections()
        }
    }

</script>

<style lang="scss" scoped>
    .monitor-container {
        max-width: 1600px;
        margin: 0 auto;
    }

    .toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        flex-wrap: wrap;
        gap: 12px;
    }

    .device-tabs {
        .status-dot {
            margin-right: 6px;
            font-size: 12px;
        }
    }

    .toolbar-actions {
        display: flex;
        gap: 12px;
    }

    .monitor-layout {
        display: grid;
        grid-template-columns: 1fr 320px;
        gap: 20px;
    }

    .main-monitor {
        padding: 0;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        background: #fff;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .monitor-header {
        padding: 16px 20px;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 12px;

        .device-info {
            h3 {
                font-size: 18px;
                font-weight: 600;
                margin-bottom: 6px;
            }

            .device-meta {
                display: flex;
                align-items: center;
                gap: 12px;
                flex-wrap: wrap;

                .location {
                    color: #64748b;
                    font-size: 13px;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
            }
        }
    }

    .video-container {
        position: relative;
        flex: 1;
        background: #000;
        min-height: 500px;
        display: flex;
        align-items: center;
        justify-content: center;

        .hint {
            color: #94a3b8;
            margin-top: 8px;
            font-size: 14px;
        }
    }

    .video-player {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }

    .offline-placeholder {
        text-align: center;
        color: #94a3b8;

        p {
            margin: 8px 0;
            font-size: 16px;
        }
    }

    .detect-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
    }

    .recognition-panel {
        position: absolute;
        top: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.85);
        border-radius: 8px;
        padding: 16px;
        color: #fff;
        min-width: 200px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);

        .rec-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
            padding-bottom: 12px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);

            span {
                font-weight: 600;
            }
        }

        .meter-value {
            margin-bottom: 8px;

            .value {
                font-size: 32px;
                font-weight: 700;
                color: #10b981;
            }

            .unit {
                font-size: 14px;
                color: #94a3b8;
                margin-left: 4px;
            }
        }

        .rec-info {
            font-size: 12px;
            color: #94a3b8;
        }
    }

    .monitor-footer {
        padding: 12px 20px;
        background: #f8fafc;
        border-top: 1px solid #e2e8f0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 13px;
        color: #64748b;

        .stream-info {
            display: flex;
            gap: 20px;
        }
    }

    .sidebar-panel {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    .panel-card {
        padding: 16px;
        background: #fff;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

        .panel-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;

            h4 {
                font-size: 16px;
                font-weight: 600;
            }
        }
    }

    .device-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .device-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s;

        &:hover, &.active {
            background: #f1f5f9;
        }

        &.active {
            border-left: 3px solid #2563eb;
        }

        &.local {
            background: rgba(59, 130, 246, 0.05);

            &.active {
                border-left-color: #3b82f6;
                background: rgba(59, 130, 246, 0.1);
            }
        }

        .device-icon {
            width: 40px;
            height: 40px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;

            &.network {
                background: rgba(37, 99, 235, 0.1);
                color: #2563eb;
            }

            &.local {
                background: rgba(59, 130, 246, 0.1);
                color: #3b82f6;
            }
        }

        .device-detail {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 4px;

            .device-name {
                font-weight: 500;
                font-size: 14px;
            }

            .device-loc {
                font-size: 12px;
                color: #64748b;
            }
        }
    }

    .device-info-list {
        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #f1f5f9;

            &:last-child {
                border-bottom: none;
            }

            .label {
                color: #64748b;
                font-size: 14px;
            }

            .value {
                font-weight: 500;
                color: #1e293b;

                &.text-primary {
                    color: #2563eb;
                }
            }
        }
    }

    @media (max-width: 1200px) {
        .monitor-layout {
            grid-template-columns: 1fr;
        }
    }
</style>