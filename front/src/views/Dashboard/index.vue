<template>
    <div class="dashboard-container">
        <h2 class="page-title">个人中心</h2>

        <div class="profile-grid">
            <!-- 左侧：个人信息卡片 -->
            <div class="profile-card card">
                <div class="profile-header">
                    <el-avatar :size="100" :icon="UserFilled" class="profile-avatar" />
                    <h3 class="profile-name">{{ userStore.userInfo.username }}</h3>
                    <span class="profile-role">{{ userStore.userInfo.role || '管理员' }}</span>
                </div>

                <div class="profile-stats">
                    <div class="stat-item">
                        <span class="stat-value">{{ dashboardStats.totalDevices }}</span>
                        <span class="stat-label">管理设备</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">{{ dashboardStats.onlineRate }}%</span>
                        <span class="stat-label">设备在线率</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">{{ dashboardStats.monthlyInspections }}</span>
                        <span class="stat-label">本月巡检</span>
                    </div>
                </div>

                <el-button type="primary" class="edit-btn" @click="goToEdit">
                    <el-icon><Edit /></el-icon>
                    编辑资料
                </el-button>
            </div>

            <!-- 右侧：详细信息 -->
            <div class="info-section">
                <div class="info-card card">
                    <div class="card-header">
                        <h4>基本信息</h4>
                        <el-tag type="success" effect="dark">在职</el-tag>
                    </div>

                    <div class="info-list">
                        <div class="info-item">
              <span class="info-label">
                <el-icon><User /></el-icon>
                用户姓名
              </span>
                            <span class="info-value">{{ userStore.userInfo.username }}</span>
                        </div>

                        <div class="info-item">
              <span class="info-label">
                <el-icon><Calendar /></el-icon>
                年龄
              </span>
                            <span class="info-value">{{ userStore.userInfo.age || 28 }} 岁</span>
                        </div>

                        <div class="info-item">
              <span class="info-label">
                <el-icon><Phone /></el-icon>
                联系电话
              </span>
                            <span class="info-value">{{ userStore.userInfo.phone || '13800138000' }}</span>
                        </div>

                        <div class="info-item">
              <span class="info-label">
                <el-icon><Message /></el-icon>
                电子邮箱
              </span>
                            <span class="info-value">{{ userStore.userInfo.email || 'admin@example.com' }}</span>
                        </div>

                        <div class="info-item">
              <span class="info-label">
                <el-icon><OfficeBuilding /></el-icon>
                所属部门
              </span>
                            <span class="info-value">{{ userStore.userInfo.department || '物业管理部' }}</span>
                        </div>

                        <div class="info-item">
              <span class="info-label">
                <el-icon><Timer /></el-icon>
                入职时间
              </span>
                            <span class="info-value">2023-06-15</span>
                        </div>
                    </div>
                </div>

                <div class="info-card card">
                    <div class="card-header">
                        <h4>账号安全</h4>
                    </div>

                    <div class="security-list">
                        <div class="security-item">
                            <div class="security-info">
                                <el-icon color="#10b981" size="20"><CircleCheck /></el-icon>
                                <div>
                                    <span class="security-title">登录密码</span>
                                    <span class="security-desc">已设置，建议定期更换</span>
                                </div>
                            </div>
                            <el-button type="primary" text>修改</el-button>
                        </div>

                        <div class="security-item">
                            <div class="security-info">
                                <el-icon color="#10b981" size="20"><CircleCheck /></el-icon>
                                <div>
                                    <span class="security-title">手机绑定</span>
                                    <span class="security-desc">已绑定手机 138****8000</span>
                                </div>
                            </div>
                            <el-button type="primary" text>更换</el-button>
                        </div>

                        <div class="security-item">
                            <div class="security-info">
                                <el-icon color="#f59e0b" size="20"><Warning /></el-icon>
                                <div>
                                    <span class="security-title">邮箱验证</span>
                                    <span class="security-desc">未验证，建议验证邮箱</span>
                                </div>
                            </div>
                            <el-button type="warning" text>去验证</el-button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
    import { useRouter } from 'vue-router'
    import { useUserStore } from '@/stores/user'
    import { userApi } from '@/api/user'
    import { ref, onMounted } from 'vue'
    import { UserFilled, Edit, User, Calendar, Phone, Message, OfficeBuilding, Timer, CircleCheck, Warning } from '@element-plus/icons-vue'

    const router = useRouter()
    const userStore = useUserStore()

    const dashboardStats = ref({
        totalDevices: 0,
        onlineRate: 0,
        monthlyInspections: 0
    })

    const fetchDashboardStats = async () => {
        try {
            const res = await userApi.getDashboardStats()
            if (res.success) {
                dashboardStats.value = res.data
            }
        } catch (error) {
            console.error('获取统计数据失败:', error)
        }
    }

    const goToEdit = () => {
        router.push('/dashboard/edit')
    }

    onMounted(() => {
        fetchDashboardStats()
    })
</script>

<style lang="scss" scoped>
    .dashboard-container {
        max-width: 1200px;
        margin: 0 auto;
    }

    .profile-grid {
        display: grid;
        grid-template-columns: 320px 1fr;
        gap: 24px;
        margin-bottom: 24px;
    }

    .profile-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 32px 24px;
        height: fit-content;
    }

    .profile-header {
        text-align: center;
        margin-bottom: 24px;

        .profile-avatar {
            background: $primary-color;
            font-size: 40px;
            margin-bottom: 16px;
        }

        .profile-name {
            font-size: 24px;
            font-weight: 600;
            color: $text-primary;
            margin-bottom: 8px;
        }

        .profile-role {
            color: $primary-color;
            background: rgba($primary-color, 0.1);
            padding: 4px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
        }
    }

    .profile-stats {
        display: flex;
        width: 100%;
        justify-content: space-around;
        margin-bottom: 24px;
        padding: 20px 0;
        border-top: 1px solid $border-color;
        border-bottom: 1px solid $border-color;

        .stat-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;

            .stat-value {
                font-size: 24px;
                font-weight: 700;
                color: $primary-color;
            }

            .stat-label {
                font-size: 12px;
                color: $text-secondary;
            }
        }
    }

    .edit-btn {
        width: 100%;
        height: 44px;
        font-size: 16px;
        border-radius: 8px;
    }

    .info-section {
        display: flex;
        flex-direction: column;
        gap: 24px;
    }

    .info-card {
        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 16px;
            border-bottom: 1px solid $border-color;

            h4 {
                font-size: 18px;
                font-weight: 600;
                color: $text-primary;
            }
        }
    }

    .info-list {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
    }

    .info-item {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .info-label {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            color: $text-secondary;

            .el-icon {
                font-size: 16px;
            }
        }

        .info-value {
            font-size: 16px;
            font-weight: 500;
            color: $text-primary;
            padding-left: 24px;
        }
    }

    .security-list {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    .security-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        background: $bg-color;
        border-radius: 8px;

        .security-info {
            display: flex;
            align-items: center;
            gap: 16px;

            div {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
        }

        .security-title {
            font-weight: 500;
            color: $text-primary;
        }

        .security-desc {
            font-size: 13px;
            color: $text-secondary;
        }
    }

    .activity-card {
        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;

            h4 {
                font-size: 18px;
                font-weight: 600;
            }
        }
    }

    @media (max-width: 968px) {
        .profile-grid {
            grid-template-columns: 1fr;
        }

        .info-list {
            grid-template-columns: 1fr;
        }
    }
</style>