<template>
    <div class="login-container">
        <div class="login-box">
            <div class="login-header">
                <el-icon size="48" color="#2563eb"><Monitor /></el-icon>
                <h1 class="title">云巡检管理平台</h1>
                <p class="subtitle">智能设备监控 · 实时数据分析 · AI图像识别</p>
            </div>

            <el-tabs v-model="activeTab" class="login-tabs" stretch>
                <el-tab-pane label="账号登录" name="login">
                    <el-form
                            ref="loginFormRef"
                            :model="loginForm"
                            :rules="loginRules"
                            class="login-form"
                    >
                        <el-form-item prop="username">
                            <el-input
                                    v-model="loginForm.username"
                                    placeholder="请输入用户名"
                                    size="large"
                                    :prefix-icon="User"
                            />
                        </el-form-item>

                        <el-form-item prop="password">
                            <el-input
                                    v-model="loginForm.password"
                                    type="password"
                                    placeholder="请输入密码"
                                    size="large"
                                    :prefix-icon="Lock"
                                    show-password
                                    @keyup.enter="handleLogin"
                            />
                        </el-form-item>

                        <div class="form-options">
                            <el-checkbox v-model="rememberMe">记住我</el-checkbox>
                            <el-link type="primary" :underline="'never'">忘记密码？</el-link>
                        </div>

                        <el-button
                                type="primary"
                                size="large"
                                class="submit-btn"
                                :loading="loading"
                                @click="handleLogin"
                        >
                            登录
                        </el-button>
                    </el-form>
                </el-tab-pane>

                <el-tab-pane label="注册账号" name="register">
                    <el-form
                            ref="registerFormRef"
                            :model="registerForm"
                            :rules="registerRules"
                            class="login-form"
                    >
                        <el-form-item prop="username">
                            <el-input
                                    v-model="registerForm.username"
                                    placeholder="请输入用户名"
                                    size="large"
                                    :prefix-icon="User"
                            />
                        </el-form-item>

                        <el-form-item prop="password">
                            <el-input
                                    v-model="registerForm.password"
                                    type="password"
                                    placeholder="请输入密码（6-20位）"
                                    size="large"
                                    :prefix-icon="Lock"
                                    show-password
                            />
                        </el-form-item>

                        <el-form-item prop="confirmPassword">
                            <el-input
                                    v-model="registerForm.confirmPassword"
                                    type="password"
                                    placeholder="请确认密码"
                                    size="large"
                                    :prefix-icon="Lock"
                                    show-password
                            />
                        </el-form-item>

                        <el-form-item prop="phone">
                            <el-input
                                    v-model="registerForm.phone"
                                    placeholder="请输入手机号"
                                    size="large"
                                    :prefix-icon="Iphone"
                            />
                        </el-form-item>

                        <el-button
                                type="primary"
                                size="large"
                                class="submit-btn"
                                :loading="loading"
                                @click="handleRegister"
                        >
                            注册
                        </el-button>
                    </el-form>
                </el-tab-pane>
            </el-tabs>

            <div class="login-footer">
                <p>© 2026 云巡检管理平台 版权所有</p>
                <el-button link type="danger" @click="goEmergency" size="small">
                    <el-icon><Warning /></el-icon>
                    紧急模式
                </el-button>
            </div>
        </div>

        <div class="login-bg">
            <div class="bg-circle circle-1"></div>
            <div class="bg-circle circle-2"></div>
            <div class="bg-circle circle-3"></div>
        </div>
    </div>
</template>

<script setup>
    import { ref, reactive } from 'vue'
    import { useRouter } from 'vue-router'
    import { ElMessage } from 'element-plus'
    import { User, Lock, Iphone, Warning } from '@element-plus/icons-vue'
    import { authApi } from '@/api/auth'

    const router = useRouter()
    const activeTab = ref('login')
    const loading = ref(false)
    const rememberMe = ref(false)

    const loginFormRef = ref()
    const loginForm = reactive({
        username: '',
        password: ''
    })

    const registerFormRef = ref()
    const registerForm = reactive({
        username: '',
        password: '',
        confirmPassword: '',
        phone: ''
    })

    const validatePass2 = (rule, value, callback) => {
        if (value !== registerForm.password) {
            callback(new Error('两次输入密码不一致'))
        } else {
            callback()
        }
    }

    const loginRules = {
        username: [
            { required: true, message: '请输入用户名', trigger: 'blur' },
            { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
        ],
        password: [
            { required: true, message: '请输入密码', trigger: 'blur' },
            { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
        ]
    }

    const registerRules = {
        username: [
            { required: true, message: '请输入用户名', trigger: 'blur' },
            { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
        ],
        password: [
            { required: true, message: '请输入密码', trigger: 'blur' },
            { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
        ],
        confirmPassword: [
            { required: true, message: '请确认密码', trigger: 'blur' },
            { validator: validatePass2, trigger: 'blur' }
        ],
        phone: [
            { required: true, message: '请输入手机号', trigger: 'blur' },
            { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
        ]
    }

    const handleLogin = async () => {
        if (!loginFormRef.value) return

        await loginFormRef.value.validate(async (valid) => {
            if (valid) {
                loading.value = true
                try {
                    console.log('正在登录:', loginForm.username)  // 调试日志

                    const res = await authApi.login({
                        username: loginForm.username,
                        password: loginForm.password
                    })

                    console.log('登录响应:', res)  // 调试日志

                    if (res.success && res.token) {
                        localStorage.setItem('token', res.token)
                        localStorage.setItem('userInfo', JSON.stringify(res.userInfo))
                        ElMessage.success('登录成功')
                        router.push('/')
                    } else {
                        ElMessage.error(res.message || '登录失败')
                    }
                } catch (error) {
                    console.error('登录异常:', error)
                    ElMessage.error('登录失败，请检查网络连接')
                } finally {
                    loading.value = false
                }
            }
        })
    }

    const handleRegister = async () => {
        if (!registerFormRef.value) return

        await registerFormRef.value.validate(async (valid) => {
            if (valid) {
                loading.value = true
                try {
                    const res = await authApi.register(registerForm)
                    if (res.success) {
                        ElMessage.success('注册成功，请等待管理员审核')
                        activeTab.value = 'login'
                        Object.keys(registerForm).forEach(key => {
                            registerForm[key] = ''
                        })
                    } else {
                        ElMessage.error(res.message || '注册失败')
                    }
                } catch (error) {
                    ElMessage.error('注册失败，请检查网络连接')
                } finally {
                    loading.value = false
                }
            }
        })
    }

    const goEmergency = () => {
        router.push('/emergency')
    }
</script>

<style lang="scss" scoped>
    .login-container {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        position: relative;
        overflow: hidden;
    }

    .login-box {
        width: 420px;
        padding: 40px;
        background: rgba(255, 255, 255, 0.95);
        border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(10px);
        z-index: 10;
        position: relative;
    }

    .login-header {
        text-align: center;
        margin-bottom: 32px;

        .title {
            font-size: 28px;
            font-weight: 700;
            color: #1e293b;
            margin: 16px 0 8px;
        }

        .subtitle {
            font-size: 14px;
            color: #64748b;
            letter-spacing: 1px;
        }
    }

    /* 深度选择器修复 */
    .login-tabs ::v-deep .el-tabs__header {
        margin-bottom: 24px;
    }

    .login-tabs ::v-deep .el-tabs__item {
        font-size: 16px;
        font-weight: 500;
    }

    .login-form {
        .el-input ::v-deep .el-input__wrapper {
            box-shadow: 0 0 0 1px #e2e8f0 inset;
            padding: 4px 11px;

            &.is-focus {
                box-shadow: 0 0 0 1px #2563eb inset;
            }
        }

        .form-options {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
        }

        .submit-btn {
            width: 100%;
            height: 44px;
            font-size: 16px;
            font-weight: 500;
            border-radius: 8px;
            background: #2563eb;
            border: none;

            &:hover {
                background: #1d4ed8;
            }
        }
    }

    .login-footer {
        margin-top: 24px;
        text-align: center;
        color: #94a3b8;
        font-size: 12px;

        p {
            margin-bottom: 8px;
        }
    }

    .login-bg {
        position: absolute;
        width: 100%;
        height: 100%;
        overflow: hidden;
    }

    .bg-circle {
        position: absolute;
        border-radius: 50%;
        background: rgba(37, 99, 235, 0.1);
        animation: float 20s infinite ease-in-out;
    }

    .circle-1 {
        width: 600px;
        height: 600px;
        top: -200px;
        right: -200px;
        animation-delay: 0s;
    }

    .circle-2 {
        width: 400px;
        height: 400px;
        bottom: -100px;
        left: -100px;
        background: rgba(59, 130, 246, 0.1);
        animation-delay: -5s;
    }

    .circle-3 {
        width: 300px;
        height: 300px;
        top: 50%;
        left: 50%;
        background: rgba(16, 185, 129, 0.05);
        animation-delay: -10s;
    }

    @keyframes float {
        0%, 100% {
            transform: translate(0, 0) scale(1);
        }
        33% {
            transform: translate(30px, -30px) scale(1.1);
        }
        66% {
            transform: translate(-20px, 20px) scale(0.9);
        }
    }
</style>