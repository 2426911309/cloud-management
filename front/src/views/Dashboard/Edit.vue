<template>
    <div class="edit-profile-container">
        <h2 class="page-title">编辑资料</h2>

        <div class="edit-content">
            <div class="edit-card card">
                <el-form
                        ref="formRef"
                        :model="form"
                        :rules="rules"
                        label-position="top"
                        class="edit-form"
                >
                    <div class="form-section">
                        <h4 class="section-title">基本信息</h4>

                        <div class="form-row">
                            <el-form-item label="用户姓名" prop="username" class="form-col">
                                <el-input v-model="form.username" placeholder="请输入姓名" />
                            </el-form-item>

                            <el-form-item label="年龄" prop="age" class="form-col">
                                <el-input-number v-model="form.age" :min="18" :max="100" style="width: 100%" />
                            </el-form-item>
                        </div>

                        <div class="form-row">
                            <el-form-item label="联系电话" prop="phone" class="form-col">
                                <el-input v-model="form.phone" placeholder="请输入手机号" />
                            </el-form-item>

                            <el-form-item label="电子邮箱" prop="email" class="form-col">
                                <el-input v-model="form.email" placeholder="请输入邮箱" />
                            </el-form-item>
                        </div>

                        <el-form-item label="所属部门" prop="department">
                            <el-select v-model="form.department" placeholder="请选择部门" style="width: 100%">
                                <el-option label="物业管理部" value="物业管理部" />
                                <el-option label="工程技术部" value="工程技术部" />
                                <el-option label="安全保卫部" value="安全保卫部" />
                                <el-option label="行政人事部" value="行政人事部" />
                            </el-select>
                        </el-form-item>
                    </div>

                    <div class="form-section">
                        <h4 class="section-title">头像设置</h4>

                        <div class="avatar-upload">
                            <el-avatar :size="100" :src="form.avatar" :icon="UserFilled" class="preview-avatar" />
                            <div class="upload-actions">
                                <el-upload
                                        action="#"
                                        :auto-upload="false"
                                        :show-file-list="false"
                                        :on-change="handleAvatarChange"
                                        accept="image/*"
                                >
                                    <el-button type="primary">
                                        <el-icon><Upload /></el-icon>
                                        上传新头像
                                    </el-button>
                                </el-upload>
                                <span class="upload-tip">支持 JPG、PNG 格式，文件小于 2MB</span>
                            </div>
                        </div>
                    </div>

                    <div class="form-actions">
                        <el-button @click="goBack">取消</el-button>
                        <el-button type="primary" :loading="loading" @click="handleSubmit">
                            保存修改
                        </el-button>
                    </div>
                </el-form>
            </div>

            <!-- 修改密码侧边栏 -->
            <div class="password-card card">
                <h4 class="section-title">修改密码</h4>

                <el-form :model="pwdForm" label-position="top">
                    <el-form-item label="当前密码">
                        <el-input v-model="pwdForm.oldPassword" type="password" show-password placeholder="请输入当前密码" />
                    </el-form-item>

                    <el-form-item label="新密码">
                        <el-input v-model="pwdForm.newPassword" type="password" show-password placeholder="请输入新密码（6-20位）" />
                    </el-form-item>

                    <el-form-item label="确认新密码">
                        <el-input v-model="pwdForm.confirmPassword" type="password" show-password placeholder="请再次输入新密码" />
                    </el-form-item>

                    <el-button type="primary" style="width: 100%" @click="handleChangePassword">
                        更新密码
                    </el-button>
                </el-form>
            </div>
        </div>
    </div>
</template>

<script setup>
    import { ref, reactive, onMounted } from 'vue'
    import { useRouter } from 'vue-router'
    import { ElMessage } from 'element-plus'
    import { UserFilled, Upload } from '@element-plus/icons-vue'
    import { useUserStore } from '@/stores/user'
    import { userApi } from '@/api/user'

    const router = useRouter()
    const userStore = useUserStore()
    const formRef = ref()
    const loading = ref(false)

    const form = reactive({
        username: '',
        age: 28,
        phone: '',
        email: '',
        department: '',
        avatar: ''
    })

    const pwdForm = reactive({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    })

    const rules = {
        username: [
            { required: true, message: '请输入姓名', trigger: 'blur' },
            { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
        ],
        phone: [
            { required: true, message: '请输入手机号', trigger: 'blur' },
            { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
        ],
        email: [
            { required: true, message: '请输入邮箱', trigger: 'blur' },
            { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
        ]
    }

    onMounted(() => {
        // 加载当前用户信息
        const userInfo = userStore.userInfo
        Object.assign(form, userInfo)
    })

    const handleAvatarChange = (file) => {
        const reader = new FileReader()
        reader.onload = (e) => {
            form.avatar = e.target.result
        }
        reader.readAsDataURL(file.raw)
    }

    const handleSubmit = async () => {
        if (!formRef.value) return

        await formRef.value.validate(async (valid) => {
            if (valid) {
                loading.value = true
                try {
                    await userApi.updateUserInfo(form)
                    userStore.updateUserInfo(form)
                    ElMessage.success('保存成功')
                    goBack()
                } catch (error) {
                    ElMessage.error('保存失败')
                } finally {
                    loading.value = false
                }
            }
        })
    }

    const handleChangePassword = async () => {
        if (!pwdForm.oldPassword || !pwdForm.newPassword || !pwdForm.confirmPassword) {
            ElMessage.warning('请填写完整密码信息')
            return
        }
        if (pwdForm.newPassword !== pwdForm.confirmPassword) {
            ElMessage.error('两次输入的新密码不一致')
            return
        }

        try {
            await userApi.changePassword(pwdForm)
            ElMessage.success('密码修改成功，请重新登录')
            userStore.logout()
            router.push('/login')
        } catch (error) {
            ElMessage.error('密码修改失败')
        }
    }

    const goBack = () => {
        router.push('/dashboard')
    }
</script>

<style lang="scss" scoped>
    .edit-profile-container {
        max-width: 1000px;
        margin: 0 auto;
    }

    .edit-content {
        display: grid;
        grid-template-columns: 1fr 320px;
        gap: 24px;
    }

    .edit-card {
        padding: 32px;
    }

    .form-section {
        margin-bottom: 32px;

        &:not(:last-child) {
            padding-bottom: 32px;
            border-bottom: 1px solid $border-color;
        }
    }

    .section-title {
        font-size: 18px;
        font-weight: 600;
        color: $text-primary;
        margin-bottom: 20px;
        display: flex;
        align-items: center;
        gap: 8px;

        &::before {
            content: '';
            width: 4px;
            height: 18px;
            background: $primary-color;
            border-radius: 2px;
        }
    }

    .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
    }

    .avatar-upload {
        display: flex;
        align-items: center;
        gap: 24px;

        .preview-avatar {
            background: $primary-color;
            font-size: 40px;
        }

        .upload-actions {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .upload-tip {
            font-size: 12px;
            color: $text-light;
        }
    }

    .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 32px;
        padding-top: 24px;
        border-top: 1px solid $border-color;
    }

    .password-card {
        padding: 24px;
        height: fit-content;
        position: sticky;
        top: 24px;
    }

    @media (max-width: 768px) {
        .edit-content {
            grid-template-columns: 1fr;
        }

        .form-row {
            grid-template-columns: 1fr;
        }

        .password-card {
            position: static;
        }
    }
</style>