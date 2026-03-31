<template>
    <el-dialog
            v-model="visible"
            :title="isEdit ? '编辑设备' : '添加设备'"
            width="500px"
            destroy-on-close
    >
        <el-form
                ref="formRef"
                :model="form"
                :rules="rules"
                label-width="100px"
                class="device-form"
        >
            <el-form-item label="设备名称" prop="name">
                <el-input v-model="form.name" placeholder="请输入设备名称" />
            </el-form-item>

            <el-form-item label="安装位置" prop="location">
                <el-input v-model="form.location" placeholder="请输入安装位置" />
            </el-form-item>

            <el-form-item label="设备类型" prop="type">
                <el-select v-model="form.type" placeholder="请选择设备类型" style="width: 100%">
                    <el-option label="网络摄像头" value="camera" />
                    <el-option label="智能表计" value="meter" />
                    <el-option label="传感器" value="sensor" />
                </el-select>
            </el-form-item>

            <el-form-item label="视频流地址" prop="url">
                <el-input
                        v-model="form.url"
                        placeholder="请输入RTSP/HTTP视频流地址"
                        type="textarea"
                        :rows="2"
                />
            </el-form-item>

            <el-form-item label="表计类型" prop="meterType">
                <el-radio-group v-model="form.meterType">
                    <el-radio label="electric">电表</el-radio>
                    <el-radio label="water">水表</el-radio>
                    <el-radio label="gas">燃气表</el-radio>
                </el-radio-group>
            </el-form-item>

            <el-form-item label="单位" prop="unit">
                <el-input v-model="form.unit" placeholder="如：kWh、m³" style="width: 120px" />
            </el-form-item>

            <el-form-item label="备注">
                <el-input
                        v-model="form.remark"
                        type="textarea"
                        :rows="2"
                        placeholder="请输入备注信息"
                />
            </el-form-item>
        </el-form>

        <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          确定
        </el-button>
      </span>
        </template>
    </el-dialog>
</template>

<script setup>
    import { ref, reactive, watch, computed } from 'vue'
    import { ElMessage } from 'element-plus'

    const props = defineProps({
        modelValue: Boolean,
        device: Object
    })

    const emit = defineEmits(['update:modelValue', 'save'])

    const visible = computed({
        get: () => props.modelValue,
        set: (val) => emit('update:modelValue', val)
    })

    const isEdit = computed(() => !!props.device?.id)

    const formRef = ref()
    const loading = ref(false)

    const form = reactive({
        name: '',
        location: '',
        type: 'camera',
        url: '',
        meterType: 'electric',
        unit: 'kWh',
        remark: ''
    })

    const rules = {
        name: [
            { required: true, message: '请输入设备名称', trigger: 'blur' },
            { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
        ],
        location: [
            { required: true, message: '请输入安装位置', trigger: 'blur' }
        ],
        type: [
            { required: true, message: '请选择设备类型', trigger: 'change' }
        ]
    }

    // 重置表单
    const resetForm = () => {
        if (formRef.value) {
            formRef.value.resetFields()
        }
        Object.assign(form, {
            name: '',
            location: '',
            type: 'camera',
            url: '',
            meterType: 'electric',
            unit: 'kWh',
            remark: ''
        })
    }

    // 监听编辑数据
    watch(() => props.device, (newVal) => {
        if (newVal) {
            Object.assign(form, {
                name: newVal.name || '',
                location: newVal.location || '',
                type: newVal.type || 'camera',
                url: newVal.url || '',
                meterType: newVal.meterType || 'electric',
                unit: newVal.unit || 'kWh',
                remark: newVal.remark || ''
            })
        } else {
            resetForm()
        }
    }, { immediate: true })

    // 监听对话框关闭
    watch(visible, (val) => {
        if (!val) {
            resetForm()
        }
    })

    const handleCancel = () => {
        visible.value = false
        resetForm()
    }

    const handleSubmit = async () => {
        if (!formRef.value) return

        await formRef.value.validate((valid) => {
            if (valid) {
                loading.value = true
                setTimeout(() => {
                    emit('save', { ...form, id: props.device?.id })
                    loading.value = false
                    visible.value = false
                    resetForm()
                }, 500)
            }
        })
    }
</script>

<style lang="scss" scoped>
    .device-form {
        .el-form-item {
            margin-bottom: 20px;
        }
    }
</style>