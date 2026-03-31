<template>
    <div class="layout">
        <Sidebar />
        <div class="main-content">
            <Header />
            <div class="page-content">
                <router-view />
            </div>
        </div>
    </div>
</template>

<script setup>
    import Sidebar from './Sidebar.vue'
    import Header from './Header.vue'
</script>

<style lang="scss" scoped>
    .layout {
        display: flex;
        min-height: 100vh;
        background: $bg-color;
    }

    .main-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        margin-left: 240px;
        transition: margin-left 0.3s;
    }

    .page-content {
        flex: 1;
        padding: 24px;
        overflow-y: auto;
    }
</style>