<template>
  <!-- uni-app 会自动根据 pages.json 路由到对应页面 -->
  <!-- H5 模式下手动路由 -->
  <!-- #ifdef H5 -->
  <view id="app">
    <IndexPage v-if="currentPage === 'index'" />
    <MapPage v-else-if="currentPage === 'map'" />
    <PatrolPage v-else-if="currentPage === 'patrol'" />
    <ReportPage v-else-if="currentPage === 'report'" />
  </view>
  <!-- #endif -->
  
  <!-- 非 H5 模式，uni-app 自动路由，需要一个根元素 -->
  <!-- #ifndef H5 -->
  <view id="app"></view>
  <!-- #endif -->
</template>

<script setup>
// H5 模式下的路由处理
// #ifdef H5
import { ref, onMounted, onUnmounted } from 'vue'
import IndexPage from './pages/index/index.vue'
import MapPage from './pages/map/map.vue'
import PatrolPage from './pages/patrol/patrol.vue'
import ReportPage from './pages/report/report.vue'

const currentPage = ref('index')

const updateCurrentPage = () => {
  const hash = window.location.hash
  console.log('Current hash:', hash)
  
  if (hash.includes('/pages/map/map') || hash.includes('/map')) {
    currentPage.value = 'map'
  } else if (hash.includes('/pages/patrol/patrol') || hash.includes('/patrol')) {
    currentPage.value = 'patrol'
  } else if (hash.includes('/pages/report/report') || hash.includes('/report')) {
    currentPage.value = 'report'
  } else {
    currentPage.value = 'index'
  }
  
  console.log('Current page:', currentPage.value)
}

onMounted(() => {
  // 初始化路由
  if (!window.location.hash) {
    window.location.hash = '#/pages/index/index'
  }
  updateCurrentPage()
  
  // 监听 hash 变化
  window.addEventListener('hashchange', updateCurrentPage)
  console.log('App.vue mounted, current page:', currentPage.value)
})

onUnmounted(() => {
  window.removeEventListener('hashchange', updateCurrentPage)
})
// #endif

// 非 H5 模式下的生命周期（uni-app 会自动处理，这里可以添加初始化逻辑）
// #ifndef H5
// uni-app 会自动调用 onLaunch, onShow, onHide 等生命周期
// 如果需要，可以使用 uni-app 的 API
// #endif
</script>

<style>
/* 全局样式在 style.css 中 */
#app {
  width: 100%;
  height: 100vh;
  /* #ifdef H5 */
  max-width: 480px;
  margin: 0 auto;
  /* #endif */
  position: relative;
  overflow-x: hidden;
  overflow-y: auto;
}
</style>

