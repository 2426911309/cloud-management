<template>
    <header class="header">
        <div class="breadcrumb">
            <el-icon size="20" color="#64748b"><ArrowRight /></el-icon>
            <span class="current-page">{{ currentPageTitle }}</span>
        </div>
    </header>
</template>

<script setup>
    import { computed } from 'vue'
    import { useRoute } from 'vue-router'

    const route = useRoute()

    const currentPageTitle = computed(() => route.meta.title || '云巡检平台')
</script>

<style lang="scss" scoped>
    .header {
        height: 64px;
        background: #fff;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 24px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .breadcrumb {
        display: flex;
        align-items: center;
        gap: 12px;

        .current-page {
            font-size: 18px;
            font-weight: 600;
            color: #1e293b;
        }
    }

    .header-actions {
        display: flex;
        align-items: center;
        gap: 20px;

        .action-icon {
            color: #64748b;
            cursor: pointer;
            transition: color 0.3s;

            &:hover {
                color: #2563eb;
            }
        }
    }

    .message-badge ::v-deep .el-badge__content {
        background-color: #ef4444;
    }
</style>