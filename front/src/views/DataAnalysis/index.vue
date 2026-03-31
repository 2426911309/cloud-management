<template>
    <div class="analysis-container">
        <h2 class="page-title">数据分析</h2>

        <!-- 统计卡片 -->
        <div class="stats-grid">
        <div class="stat-card card">
            <div class="stat-icon" style="background: rgba(37, 99, 235, 0.1); color: #2563eb;">
                <el-icon size="32"><VideoCamera /></el-icon>
            </div>
            <div class="stat-info">
                <span class="stat-label">监控设备</span>
                <span class="stat-value">{{ stats.totalDevices }}</span>
            </div>
        </div>

        <div class="stat-card card">
            <div class="stat-icon" style="background: rgba(16, 185, 129, 0.1); color: #10b981;">
                <el-icon size="32"><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
                <span class="stat-label">在线率</span>
                <span class="stat-value">{{ stats.onlineRate }}%</span>
            </div>
        </div>

        <div class="stat-card card">
            <div class="stat-icon" style="background: rgba(245, 158, 11, 0.1); color: #f59e0b;">
                <el-icon size="32"><Aim /></el-icon>
            </div>
            <div class="stat-info">
                <span class="stat-label">今日识别</span>
                <span class="stat-value">{{ stats.todayRecognition }}</span>
            </div>
        </div>

        <div class="stat-card card">
            <div class="stat-icon" style="background: rgba(239, 68, 68, 0.1); color: #ef4444;">
                <el-icon size="32"><Warning /></el-icon>
            </div>
            <div class="stat-info">
                <span class="stat-label">异常告警</span>
                <span class="stat-value">{{ stats.anomalies }}</span>
            </div>
        </div>
        </div>

        <!-- 图表区域 -->
        <div class="charts-grid">
            <!-- 表计读数趋势 -->
            <div class="chart-card card">
                <div class="chart-header">
                    <div>
                        <h4>表计读数趋势</h4>
                        <p class="chart-subtitle">
                            {{ selectedDevice ? selectedDevice.name : '请选择设备' }} 读数变化曲线
                        </p>
                    </div>
                    <div style="display: flex; gap: 12px;">
                        <el-select
                                v-model="selectedDeviceId"
                                placeholder="选择设备"
                                size="small"
                                style="width: 180px"
                        >
                            <el-option
                                    v-for="device in deviceList"
                                    :key="device.id"
                                    :label="device.name"
                                    :value="device.id"
                            />
                        </el-select>
                        <el-radio-group v-model="timeRange" size="small">
                            <el-radio-button label="12h">12小时</el-radio-button>
                            <el-radio-button label="24h">24小时</el-radio-button>
                            <el-radio-button label="7d">7天</el-radio-button>
                        </el-radio-group>
                    </div>
                </div>
                <div class="chart-container">
                    <v-chart class="chart" :option="lineChartOption" autoresize />
                </div>
            </div>

            <!-- 设备对比 -->
            <div class="chart-card card">
                <div class="chart-header">
                    <div>
                        <h4>设备能耗对比</h4>
                        <p class="chart-subtitle">各设备房本月累计用电量</p>
                    </div>
                    <el-select v-model="compareMetric" size="small" style="width: 120px">
                        <el-option label="用电量" value="electric" />
                        <el-option label="用水量" value="water" />
                    </el-select>
                </div>
                <div class="chart-container">
                    <v-chart class="chart" :option="barChartOption" autoresize />
                </div>
            </div>
        </div>

        <!-- AI识别准确率 -->
        <div class="chart-card card full-width">
            <div class="chart-header">
                <div>
                    <h4>AI识别准确率统计</h4>
                    <p class="chart-subtitle">YOLOv8 模型识别效果分析（最近7天）</p>
                </div>
                <el-tag type="success" effect="dark">平均准确率: {{ accuracy.avgConfidence.toFixed(1) }}%</el-tag>
            </div>
            <div class="accuracy-stats">
                <div class="accuracy-item">
                    <el-progress type="dashboard" :percentage="accuracy.electric" color="#10b981">
                        <template #default="{ percentage }">
                            <span class="progress-label">电表识别</span>
                            <span class="progress-value">{{ Math.round(percentage) }}%</span>
                        </template>
                    </el-progress>
                </div>
                <div class="accuracy-item">
                    <el-progress type="dashboard" :percentage="accuracy.water" color="#3b82f6">
                        <template #default="{ percentage }">
                            <span class="progress-label">水表识别</span>
                            <span class="progress-value">{{ Math.round(percentage) }}%</span>
                        </template>
                    </el-progress>
                </div>
                <div class="accuracy-item">
                    <el-progress type="dashboard" :percentage="accuracy.gas" color="#f59e0b">
                        <template #default="{ percentage }">
                            <span class="progress-label">燃气表</span>
                            <span class="progress-value">{{ Math.round(percentage) }}%</span>
                        </template>
                    </el-progress>
                </div>
                <div class="accuracy-info">
                    <h5>识别详情</h5>
                        <div class="info-list">
                            <div class="info-row">
                                <span>总识别次数</span>
                                <span class="highlight">{{ accuracy.total }}</span>
                            </div>
                            <div class="info-row">
                                <span>成功识别</span>
                                <span class="highlight success">{{ accuracy.success }}</span>
                            </div>
                            <div class="info-row">
                                <span>识别失败</span>
                                <span class="highlight danger">{{ accuracy.failed }}</span>
                            </div>
                            <div class="info-row">
                                <span>平均置信度</span>
                                <span class="highlight">{{ accuracy.avgConfidence.toFixed(1) }}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 数据表格 -->
        <div class="table-card card">
            <div class="table-header">
                <h4>识别记录明细</h4>
                <div class="table-actions">
                    <el-input
                            v-model="searchKeyword"
                            placeholder="搜索设备名称"
                            style="width: 200px"
                            clearable
                    >
                        <template #prefix>
                            <el-icon><Search /></el-icon>
                        </template>
                    </el-input>
                    <el-button type="primary">
                        <el-icon><Download /></el-icon>
                        导出数据
                    </el-button>
                </div>
            </div>

            <el-table :data="tableData" v-loading="loading" stripe style="width: 100%">
                <el-table-column prop="time" label="时间" width="180" />
                <el-table-column prop="deviceName" label="设备名称" width="180" />
                <el-table-column prop="meterType" label="表计类型">
                    <template #default="{ row }">
                        <el-tag :type="row.meterType === '电表' ? 'primary' : 'success'" size="small">
                            {{ row.meterType }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="reading" label="读数" width="120">
                    <template #default="{ row }">
                        <span style="font-weight: 600; color: #2563eb;">{{ row.reading }}</span>
                    </template>
                </el-table-column>
                <el-table-column prop="change" label="较上小时">
                    <template #default="{ row }">
            <span :style="{ color: row.change > 0 ? '#ef4444' : '#10b981' }">
              {{ row.change > 0 ? '+' : '' }}{{ row.change }} {{ row.unit }}
            </span>
                    </template>
                </el-table-column>
                <el-table-column prop="confidence" label="置信度" width="100">
                    <template #default="{ row }">
                        <el-progress
                                :percentage="row.confidence"
                                :color="getConfidenceColor(row.confidence)"
                                :show-text="false"
                                style="width: 60px"
                        />
                        <span style="font-size: 12px; margin-left: 8px;">{{ row.confidence }}%</span>
                    </template>
                </el-table-column>
                <el-table-column prop="status" label="状态" width="100">
                    <template #default="{ row }">
            <span class="status-tag" :class="row.status === '正常' ? 'online' : 'warning'">
              {{ row.status }}
            </span>
                    </template>
                </el-table-column>
            </el-table>

            <div class="pagination-wrapper">
                <el-pagination
                        v-model:current-page="currentPage"
                        v-model:page-size="pageSize"
                        :page-sizes="[10, 20, 50, 100]"
                        :total="total"
                        layout="total, sizes, prev, pager, next"
                        background
                />
            </div>
        </div>
</template>

<script setup>
    import { ref, computed, onMounted, watch } from 'vue'
    import { use } from 'echarts/core'
    import { CanvasRenderer } from 'echarts/renderers'
    import { LineChart, BarChart } from 'echarts/charts'
    import { GridComponent, TooltipComponent, LegendComponent, TitleComponent } from 'echarts/components'
    import VChart from 'vue-echarts'
    import { VideoCamera, CircleCheck, Aim, Warning, Search, Download } from '@element-plus/icons-vue'
    import { monitorApi } from '@/api/monitor'
    import request from '@/utils/request'

    use([CanvasRenderer, LineChart, BarChart, GridComponent, TooltipComponent, LegendComponent, TitleComponent])

    const deviceList = ref([])
    const selectedDeviceId = ref(null)
    const selectedDevice = computed(() => deviceList.value.find(d => d.id === selectedDeviceId.value))
    const chartData = ref([])
    const timeRange = ref('12h')
    const compareMetric = ref('electric')
    const searchKeyword = ref('')
    const tableData = ref([])
    const currentPage = ref(1)
    const pageSize = ref(10)
    const total = ref(0)
    const loading = ref(false)

    // 折线图配置
    const lineChartOption = computed(() => ({
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderColor: '#e2e8f0',
            textStyle: { color: '#1e293b' }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: chartData.value.map(item => item.time),
            axisLine: { lineStyle: { color: '#cbd5e1' } },
            axisLabel: { color: '#64748b' }
        },
        yAxis: {
            type: 'value',
            name: '读数 (kWh)',
            axisLine: { show: false },
            axisTick: { show: false },
            splitLine: { lineStyle: { color: '#f1f5f9' } },
            axisLabel: { color: '#64748b' }
        },
        series: [{
            name: '表计读数',
            type: 'line',
            smooth: true,
            symbol: 'circle',
            symbolSize: 8,
            sampling: 'average',
            itemStyle: { color: '#2563eb' },
            lineStyle: { width: 3, shadowColor: 'rgba(37, 99, 235, 0.3)', shadowBlur: 10 },
            areaStyle: {
                color: {
                    type: 'linear',
                    x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                        { offset: 0, color: 'rgba(37, 99, 235, 0.3)' },
                        { offset: 1, color: 'rgba(37, 99, 235, 0.05)' }
                    ]
                }
            },
            data: chartData.value.map(item => item.value)
        }]
    }))

    // 柱状图配置
    const barChartOption = ref({
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: [],
            axisLine: { lineStyle: { color: '#cbd5e1' } },
            axisLabel: { color: '#64748b', rotate: 0, interval: 0 }
        },
        yAxis: {
            type: 'value',
            name: '用电量 (kWh)',
            splitLine: { lineStyle: { color: '#f1f5f9' } },
            axisLabel: { color: '#64748b' }
        },
        series: [{
            name: '本月累计',
            type: 'bar',
            barWidth: '40%',
            itemStyle: {
                color: {
                    type: 'linear',
                    x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                        { offset: 0, color: '#3b82f6' },
                        { offset: 1, color: '#2563eb' }
                    ]
                },
                borderRadius: [6, 6, 0, 0]
            },
            data: []
        }]
    })

    const fetchDevices = async () => {
        try {
            const res = await request.get('/device')
            if (res.success) {
                deviceList.value = res.data
                if (deviceList.value.length > 0 && !selectedDeviceId.value) {
                    selectedDeviceId.value = deviceList.value[0].id
                    // 自动加载第一个设备的历史数据
                    fetchHistory()
                }
            }
        } catch (error) {
            console.error('获取设备列表失败:', error)
        }
    }

    const fetchHistory = async () => {
        try {
            // 根据时间范围参数获取数据
            let start = null, end = null
            if (timeRange.value === '12h') {
                start = new Date(Date.now() - 12 * 60 * 60 * 1000)
            } else if (timeRange.value === '24h') {
                start = new Date(Date.now() - 24 * 60 * 60 * 1000)
            } else if (timeRange.value === '7d') {
                start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
            const res = await monitorApi.getMeterHistory(1, { start, end }) // 假设设备ID为1
            if (res && res.length) {
                chartData.value = res
            } else {
                chartData.value = [] // 清空
            }
        } catch (error) {
            console.error('获取历史数据失败:', error)
            chartData.value = []
        }
    }

    const fetchCompareData = async () => {
        try {
            const res = await monitorApi.getDeviceCompare({ metric: compareMetric.value })
            if (res && res.length) {
                barChartOption.value.xAxis.data = res.map(item => item.name)
                barChartOption.value.series[0].data = res.map(item => item.value)
                barChartOption.value.yAxis.name = compareMetric.value === 'electric' ? '用电量 (kWh)' : '用水量 (m³)'
            }
        } catch (error) {
            console.error('获取设备对比失败:', error)
        }
    }

    const fetchAccuracy = async () => {
        try {
            const res = await monitorApi.getAccuracyStats({ days: 7 })
            if (res && res.length) {
                // 更新准确率展示（你可以自己设计展示方式）
                console.log('准确率统计:', res)
            }
        } catch (error) {
            console.error('获取准确率统计失败:', error)
        }
    }

    const fetchRecords = async () => {
        loading.value = true
        try {
            const params = {
                page: currentPage.value,
                pageSize: pageSize.value,
                keyword: searchKeyword.value
            }
            const res = await monitorApi.getRecognitionRecords(params)
            if (res.success) {
                tableData.value = res.data
                total.value = res.total
            }
        } catch (error) {
            console.error('获取识别记录失败:', error)
        } finally {
            loading.value = false
        }
    }

    const fetchRecognitionLogs = async () => {
        loading.value = true
        try {
            const params = {
                page: currentPage.value,
                pageSize: pageSize.value,
                keyword: searchKeyword.value
            }
            const res = await monitorApi.getRecognitionRecords(params)
            if (res.success) {
                tableData.value = res.data
                total.value = res.total
            }
        } catch (error) {
            console.error('获取识别记录失败:', error)
        } finally {
            loading.value = false
        }
    }

    // 统计卡片数据
    const stats = ref({
        totalDevices: 0,
        onlineRate: 0,
        todayRecognition: 0,
        anomalies: 0
    })

    // 准确率统计数据
    const accuracy = ref({
        electric: 0,
        water: 0,
        gas: 0,
        total: 0,
        success: 0,
        failed: 0,
        avgConfidence: 0
    })

    const fetchStatistics = async () => {
        try {
            const res = await monitorApi.getStatistics()
            if (res.success) {
                stats.value = res.data
            }
        } catch (error) {
            console.error('获取统计数据失败:', error)
        }
    }

    const fetchAccuracyStats = async () => {
        try {
            const res = await monitorApi.getAccuracyStats()
            if (res.success) {
                accuracy.value = res.data
            }
        } catch (error) {
            console.error('获取准确率统计失败:', error)
        }
    }

    const filteredTableData = computed(() => {
        if (!searchKeyword.value) return tableData.value
        return tableData.value.filter(item =>
            item.deviceName.includes(searchKeyword.value)
        )
    })

    const getConfidenceColor = (val) => {
        if (val >= 95) return '#10b981'
        if (val >= 85) return '#f59e0b'
        return '#ef4444'
    }

    // 监听时间范围变化
    watch(timeRange, () => {
        fetchHistory()
    })

    // 监听对比指标变化
    watch(compareMetric, () => {
        fetchCompareData()
    })

    // 监听设备变化，重新获取历史数据
    watch(selectedDeviceId, () => {
        if (selectedDeviceId.value) fetchHistory()
    })

    //监听分页和搜索变化
    watch(currentPage, () => fetchRecords())
    watch(pageSize, () => fetchRecords())
    watch(searchKeyword, () => {
        currentPage.value = 1
        fetchRecords()
    })

    onMounted(() => {
        fetchDevices()
        fetchHistory()
        fetchCompareData()
        fetchAccuracy()
        fetchStatistics()
        fetchAccuracyStats()
        fetchRecords()
    })
</script>

<style lang="scss" scoped>
    .analysis-container {
        max-width: 1400px;
        margin: 0 auto;
    }

    .stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 20px;
        margin-bottom: 24px;
    }

    .stat-card {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 24px;

        .stat-icon {
            width: 64px;
            height: 64px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .stat-info {
            display: flex;
            flex-direction: column;
            gap: 4px;

            .stat-label {
                font-size: 14px;
                color: $text-secondary;
            }

            .stat-value {
                font-size: 28px;
                font-weight: 700;
                color: $text-primary;
            }
        }
    }

    .charts-grid {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 20px;
        margin-bottom: 24px;
    }

    .chart-card {
        padding: 24px;

        &.full-width {
            grid-column: 1 / -1;
        }

        .chart-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;

            h4 {
                font-size: 18px;
                font-weight: 600;
                margin-bottom: 4px;
            }

            .chart-subtitle {
                font-size: 13px;
                color: $text-secondary;
            }
        }

        .chart-container {
            height: 300px;
        }

        .chart {
            width: 100%;
            height: 100%;
        }
    }

    .accuracy-stats {
        display: flex;
        justify-content: space-around;
        align-items: center;
        padding: 20px;

        .accuracy-item {
            text-align: center;

            .progress-label {
                display: block;
                font-size: 14px;
                color: $text-secondary;
                margin-bottom: 8px;
            }

            .progress-value {
                display: block;
                font-size: 24px;
                font-weight: 700;
                color: $text-primary;
            }
        }

        .accuracy-info {
            width: 280px;
            padding: 20px;
            background: $bg-color;
            border-radius: 12px;

            h5 {
                font-size: 16px;
                font-weight: 600;
                margin-bottom: 16px;
                color: $text-primary;
            }

            .info-list {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .info-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 14px;

                span:first-child {
                    color: $text-secondary;
                }

                .highlight {
                    font-weight: 600;
                    color: $text-primary;

                    &.success { color: $success-color; }
                    &.danger { color: $danger-color; }
                }
            }
        }
    }

    .table-card {
        padding: 24px;

        .table-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;

            h4 {
                font-size: 18px;
                font-weight: 600;
            }

            .table-actions {
                display: flex;
                gap: 12px;
            }
        }
    }

    .pagination-wrapper {
        margin-top: 20px;
        display: flex;
        justify-content: flex-end;
    }

    @media (max-width: 1200px) {
        .stats-grid {
            grid-template-columns: repeat(2, 1fr);
        }

        .charts-grid {
            grid-template-columns: 1fr;
        }

        .accuracy-stats {
            flex-direction: column;
            gap: 24px;

            .accuracy-info {
                width: 100%;
            }
        }
    }

    @media (max-width: 768px) {
        .stats-grid {
            grid-template-columns: 1fr;
        }

        .table-header {
            flex-direction: column;
            gap: 12px;
            align-items: stretch !important;

            .table-actions {
                flex-direction: column;
            }
        }
    }
</style>