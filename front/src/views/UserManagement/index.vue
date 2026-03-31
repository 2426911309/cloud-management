<template>
    <div class="user-management">
        <h2 class="page-title">用户管理</h2>

        <div class="stats-row">
            <el-card class="stat-card" v-for="stat in statistics" :key="stat.label">
                <div class="stat-value" :style="{ color: stat.color }">{{ stat.value }}</div>
                <div class="stat-label">{{ stat.label }}</div>
            </el-card>
        </div>

        <div class="toolbar">
            <el-input
                    v-model="searchKeyword"
                    placeholder="搜索用户名/手机号"
                    style="width: 250px"
                    clearable
                    @keyup.enter="handleSearch"
            >
                <template #prefix>
                    <el-icon><Search /></el-icon>
                </template>
            </el-input>

            <el-select
                    v-model="filterLevel"
                    placeholder="权限筛选"
                    clearable
                    style="width: 150px"
            >
                <el-option
                        v-for="item in permissionOptions"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                />
            </el-select>

            <el-select
                    v-if="isSuperAdmin"
                    v-model="filterCompany"
                    placeholder="公司筛选"
                    clearable
                    style="width: 180px"
            >
                <el-option
                        v-for="item in companyList"
                        :key="item.id"
                        :label="item.name"
                        :value="item.id"
                />
            </el-select>

            <el-button type="primary" @click="handleSearch">
                <el-icon><Search /></el-icon>
                查询
            </el-button>
            <el-button @click="resetFilter">重置</el-button>
        </div>

        <el-card>
            <el-table :data="userList" v-loading="loading" stripe>
                <el-table-column prop="id" label="ID" width="80" />
                <el-table-column prop="username" label="用户名" width="120" />
                <el-table-column prop="role" label="角色" width="120">
                    <template #default="{ row }">
                        <el-tag :type="getPermissionType(row.permission_level)" effect="dark">
                            {{ getPermissionLabel(row.permission_level) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="company_name" label="所属公司" min-width="150" />
                <el-table-column prop="phone" label="联系电话" width="130" />
                <el-table-column prop="email" label="邮箱" min-width="180" show-overflow-tooltip />
                <el-table-column prop="created_at" label="注册时间" width="180">
                    <template #default="{ row }">
                        {{ formatDate(row.created_at) }}
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="250" fixed="right">
                    <template #default="{ row }">
                        <el-button
                                v-if="canEdit(row)"
                                type="primary"
                                link
                                @click="handleEdit(row)"
                        >
                            编辑权限
                        </el-button>
                        <el-button
                                v-if="canResetPassword(row)"
                                type="warning"
                                link
                                @click="handleResetPassword(row)"
                        >
                            重置密码
                        </el-button>
                        <el-button
                                v-if="canDelete(row)"
                                type="danger"
                                link
                                @click="handleDelete(row)"
                        >
                            删除
                        </el-button>
                    </template>
                </el-table-column>
            </el-table>

            <div class="pagination">
                <el-pagination
                        v-model:current-page="currentPage"
                        v-model:page-size="pageSize"
                        :page-sizes="[10, 20, 50]"
                        :total="total"
                        layout="total, sizes, prev, pager, next"
                        @size-change="handleSizeChange"
                        @current-change="handleCurrentChange"
                />
            </div>
        </el-card>

        <el-dialog v-model="editDialogVisible" title="修改用户权限" width="500px">
            <el-form :model="editForm" label-width="100px">
                <el-form-item label="当前用户">
                    <span>{{ editForm.username }}</span>
                </el-form-item>
                <el-form-item label="当前权限">
                    <el-tag :type="getPermissionType(editForm.currentLevel)">
                        {{ getPermissionLabel(editForm.currentLevel) }}
                    </el-tag>
                </el-form-item>
                <el-form-item label="新权限">
                    <el-select v-model="editForm.newLevel" style="width: 100%">
                        <el-option
                                v-for="item in availablePermissions"
                                :key="item.value"
                                :label="item.label"
                                :value="item.value"
                                :disabled="item.value <= currentUserLevel"
                        />
                    </el-select>
                </el-form-item>
                <el-form-item label="所属公司" v-if="isSuperAdmin">
                    <el-select v-model="editForm.companyId" style="width: 100%">
                        <el-option
                                v-for="item in companyList"
                                :key="item.id"
                                :label="item.name"
                                :value="item.id"
                        />
                    </el-select>
                </el-form-item>
            </el-form>

            <template #footer>
                <el-button @click="editDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="confirmEdit" :loading="submitting">
                    确认修改
                </el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
    import { ref, computed, onMounted } from 'vue'
    import { ElMessage, ElMessageBox } from 'element-plus'
    import { authApi } from '@/api/auth'
    import { userApi } from '@/api/user'

    const PERMISSIONS = {
        SUPER_ADMIN: 1,
        COMPANY_ADMIN: 2,
        OPERATOR: 3,
        REGISTERED: 4
    }

    const currentUser = computed(() => {
        const str = localStorage.getItem('userInfo')
        return str ? JSON.parse(str) : {}
    })

    const currentUserLevel = computed(() => currentUser.value.permissionLevel || 4)
    const isSuperAdmin = computed(() => currentUserLevel.value === PERMISSIONS.SUPER_ADMIN)
    const currentCompanyId = computed(() => currentUser.value.companyId)

    const loading = ref(false)
    const submitting = ref(false)
    const userList = ref([])
    const companyList = ref([])
    const total = ref(0)
    const currentPage = ref(1)
    const pageSize = ref(10)
    const searchKeyword = ref('')
    const filterLevel = ref('')
    const filterCompany = ref('')

    const editDialogVisible = ref(false)
    const editForm = ref({
        userId: null,
        username: '',
        currentLevel: 4,
        newLevel: 4,
        companyId: null
    })

    const permissionOptions = [
        { label: '超级管理员', value: PERMISSIONS.SUPER_ADMIN },
        { label: '小区管理员', value: PERMISSIONS.COMPANY_ADMIN },
        { label: '值班员', value: PERMISSIONS.OPERATOR },
        { label: '注册人员', value: PERMISSIONS.REGISTERED }
    ]

    const statistics = computed(() => [
        { label: '总人数', value: total.value, color: '#2563eb' },
        { label: '管理员', value: userList.value.filter(u => u.permission_level <= 2).length, color: '#10b981' },
        { label: '值班员', value: userList.value.filter(u => u.permission_level === 3).length, color: '#f59e0b' },
        { label: '待审核', value: userList.value.filter(u => u.permission_level === 4).length, color: '#ef4444' }
    ])

    const availablePermissions = computed(() => {
        if (currentUserLevel.value === PERMISSIONS.COMPANY_ADMIN) {
            return permissionOptions.filter(p => p.value > PERMISSIONS.COMPANY_ADMIN)
        }
        return permissionOptions
    })

    const fetchData = async () => {
        loading.value = true
        try {
            const params = {
                page: currentPage.value,
                pageSize: pageSize.value,
                keyword: searchKeyword.value,
                permissionLevel: filterLevel.value,
                companyId: isSuperAdmin.value ? filterCompany.value : currentCompanyId.value
            }
            const res = await authApi.getUserList(params)
            if (res.success) {
                userList.value = res.data
                total.value = res.data.length
            }
        } finally {
            loading.value = false
        }
    }

    const fetchCompanies = async () => {
        if (!isSuperAdmin.value) return
        const res = await authApi.getCompanies()
        if (res.success) {
            companyList.value = res.data
        }
    }

    const handleSearch = () => {
        currentPage.value = 1
        fetchData()
    }

    const resetFilter = () => {
        searchKeyword.value = ''
        filterLevel.value = ''
        filterCompany.value = ''
        handleSearch()
    }

    const handleSizeChange = (val) => {
        pageSize.value = val
        fetchData()
    }

    const handleCurrentChange = (val) => {
        currentPage.value = val
        fetchData()
    }

    const canEdit = (row) => {
        if (row.id === currentUser.value.id) return false
        return row.permission_level > currentUserLevel.value
    }

    const canResetPassword = (row) => {
        return canEdit(row) && currentUserLevel.value <= PERMISSIONS.COMPANY_ADMIN
    }

    const canDelete = (row) => {
        return canEdit(row) && isSuperAdmin.value
    }

    const handleEdit = (row) => {
        editForm.value = {
            userId: row.id,
            username: row.username,
            currentLevel: row.permission_level,
            newLevel: row.permission_level,
            companyId: row.company_id
        }
        editDialogVisible.value = true
    }

    const confirmEdit = async () => {
        if (editForm.value.newLevel === editForm.value.currentLevel) {
            ElMessage.warning('未做任何修改')
            return
        }

        submitting.value = true
        try {
            const res = await authApi.updateUserPermission(editForm.value.userId, {
                newPermissionLevel: editForm.value.newLevel,
                newCompanyId: editForm.value.companyId
            })
            if (res.success) {
                ElMessage.success('权限修改成功')
                editDialogVisible.value = false
                fetchData()
            }
        } finally {
            submitting.value = false
        }
    }

    const handleResetPassword = async (row) => {
        try {
            await ElMessageBox.confirm(
                `确定要重置用户 "${row.username}" 的密码吗？重置后密码为：123456`,
                '确认重置',
                {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                }
            )

            const res = await userApi.resetPassword(row.id, { newPassword: '123456' })
            if (res.success) {
                ElMessage.success('密码已重置为：123456')
            }
        } catch (error) {
            // 取消
        }
    }

    const handleDelete = async (row) => {
        try {
            await ElMessageBox.confirm(
                `确定要删除用户 "${row.username}" 吗？此操作不可恢复！`,
                '确认删除',
                {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'danger'
                }
            )

            const res = await authApi.deleteUser(row.id)
            if (res.success) {
                ElMessage.success('删除成功')
                fetchData()
            }
        } catch (error) {
            // 取消
        }
    }

    const getPermissionLabel = (level) => {
        const map = {
            [PERMISSIONS.SUPER_ADMIN]: '超级管理员',
            [PERMISSIONS.COMPANY_ADMIN]: '小区管理员',
            [PERMISSIONS.OPERATOR]: '值班员',
            [PERMISSIONS.REGISTERED]: '注册人员'
        }
        return map[level] || '未知'
    }

    const getPermissionType = (level) => {
        const map = {
            [PERMISSIONS.SUPER_ADMIN]: 'danger',
            [PERMISSIONS.COMPANY_ADMIN]: 'warning',
            [PERMISSIONS.OPERATOR]: 'success',
            [PERMISSIONS.REGISTERED]: 'info'
        }
        return map[level] || 'info'
    }

    const formatDate = (dateStr) => {
        if (!dateStr) return '-'
        const date = new Date(dateStr)
        return date.toLocaleString('zh-CN')
    }

    onMounted(() => {
        fetchData()
        fetchCompanies()
    })
</script>

<style lang="scss" scoped>
    .user-management {
        max-width: 1400px;
        margin: 0 auto;
    }

    .stats-row {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 20px;
        margin-bottom: 24px;
    }

    .stat-card {
        text-align: center;
        padding: 20px;

        .stat-value {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 8px;
        }

        .stat-label {
            color: #64748b;
            font-size: 14px;
        }
    }

    .toolbar {
        display: flex;
        gap: 12px;
        margin-bottom: 20px;
        flex-wrap: wrap;
    }

    .pagination {
        margin-top: 20px;
        display: flex;
        justify-content: flex-end;
    }

    @media (max-width: 768px) {
        .stats-row {
            grid-template-columns: repeat(2, 1fr);
        }
    }
</style>