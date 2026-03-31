<template>
    <div class="emergency-container">
        <div class="emergency-box">
            <el-icon size="64" color="#ef4444"><Warning /></el-icon>
            <h1>系统紧急模式</h1>
            <p class="subtitle">网络异常或服务器故障时使用</p>

            <el-alert
                    title="警告：此模式仅在紧急情况下使用"
                    type="warning"
                    description="使用紧急密码可临时访问系统，但部分功能可能受限。请尽快恢复网络连接。"
                    show-icon
                    :closable="false"
                    style="margin-bottom: 24px"
            />

            <el-form :model="form" @submit.prevent="handleSubmit">
                <el-form-item>
                    <el-input
                            v-model="form.emergencyKey"
                            type="password"
                            placeholder="请输入紧急访问密码"
                            size="large"
                            show-password
                    >
                        <template #prefix>
                            <el-icon><Key /></el-icon>
                        </template>
                    </el-input>
                </el-form-item>

                <el-button
                        type="danger"
                        size="large"
                        style="width: 100%"
                        :loading="loading"
                        @click="handleSubmit"
                >
                    进入紧急模式
                </el-button>
            </el-form>

            <div class="emergency-info">
                <h4>紧急模式说明：</h4>
                <ul>
                    <li>可查看所有公司基础数据</li>
                    <li>可查看设备最后已知状态</li>
                    <li>无法接收实时视频流</li>
                    <li>无法修改任何数据</li>
                    <li>操作将被记录审计</li>
                </ul>
            </div>

            <el-button link @click="goBack" style="margin-top: 20px">
                <el-icon><ArrowLeft /></el-icon>
                返回登录页
            </el-button>
        </div>
    </div>
</template>

<script setup>
    import { reactive, ref } from 'vue'
    import { useRouter } from 'vue-router'
    import { ElMessage } from 'element-plus'

    const router = useRouter()
    const loading = ref(false)

    const form = reactive({
        emergencyKey: ''
    })

    const PERMISSIONS = {
        SUPER_ADMIN: 1,
        COMPANY_ADMIN: 2,
        OPERATOR: 3,
        REGISTERED: 4
    }

    const handleSubmit = async () => {
        if (!form.emergencyKey) {
            ElMessage.warning('请输入紧急密码')
            return
        }

        loading.value = true

        try {
            const response = await fetch('http://localhost:3001/api/auth/emergency', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emergencyKey: form.emergencyKey })
            })

            const data = await response.json()

            if (data.success) {
                localStorage.setItem('emergencyMode', 'true')
                localStorage.setItem('emergencyToken', data.token)
                localStorage.setItem('token', data.token)
                localStorage.setItem('userInfo', JSON.stringify({
                    username: '紧急访问',
                    role: '紧急模式',
                    permissionLevel: PERMISSIONS.SUPER_ADMIN,
                    isEmergency: true
                }))

                ElMessage.success('已进入紧急模式')
                router.push('/dashboard')
            } else {
                ElMessage.error(data.message || '密码错误')
            }
        } catch (error) {
            ElMessage.error('连接失败，请检查网络')
        } finally {
            loading.value = false
        }
    }

    const goBack = () => {
        router.push('/login')
    }
</script>

<style lang="scss" scoped>
    .emergency-container {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        padding: 20px;
    }

    .emergency-box {
        width: 100%;
        max-width: 480px;
        background: rgba(255, 255, 255, 0.95);
        border-radius: 16px;
        padding: 40px;
        text-align: center;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);

        h1 {
            font-size: 28px;
            font-weight: 700;
            color: #ef4444;
            margin: 16px 0 8px;
        }

        .subtitle {
            color: #64748b;
            margin-bottom: 24px;
        }
    }

    .emergency-info {
        margin-top: 32px;
        padding: 20px;
        background: #f8fafc;
        border-radius: 8px;
        text-align: left;

        h4 {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 12px;
            color: #1e293b;
        }

        ul {
            list-style: none;
            padding: 0;

            li {
                padding: 6px 0;
                color: #64748b;
                font-size: 14px;
                position: relative;
                padding-left: 20px;

                &::before {
                    content: '•';
                    color: #ef4444;
                    position: absolute;
                    left: 0;
                    font-weight: bold;
                }
            }
        }
    }
</style>