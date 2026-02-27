<template>
  <view class="bottom-nav">
    <view 
      class="nav-item" 
      :class="{ active: currentPath === '/' }"
      @click="navigateTo('/')"
    >
      <i class="fas fa-home"></i>
      <text>首页</text>
    </view>
    <view 
      class="nav-item" 
      :class="{ active: currentPath === '/map' }"
      @click="navigateTo('/map')"
    >
      <i class="fas fa-map"></i>
      <text>地图</text>
    </view>
    <view 
      class="nav-item" 
      :class="{ active: currentPath === '/patrol' }"
      @click="navigateTo('/patrol')"
    >
      <i class="fas fa-walking"></i>
      <text>巡查</text>
    </view>
    <view 
      class="nav-item" 
      :class="{ active: currentPath === '/report' }"
      @click="navigateTo('/report')"
    >
      <i class="fas fa-camera"></i>
      <text>上报</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const currentPath = ref('/')

// 获取当前页面路径
const updateCurrentPath = () => {
  // #ifdef H5
  // H5 模式下使用 window.location
  const path = window.location.hash.replace('#/', '') || 'index'
  if (path.includes('index') || path === '') {
    currentPath.value = '/'
  } else if (path.includes('map')) {
    currentPath.value = '/map'
  } else if (path.includes('patrol')) {
    currentPath.value = '/patrol'
  } else if (path.includes('report')) {
    currentPath.value = '/report'
  }
  // #endif
  
  // #ifndef H5
  // 小程序/App 模式下使用 getCurrentPages
  const pages = getCurrentPages()
  if (pages.length > 0) {
    const currentPage = pages[pages.length - 1]
    const route = currentPage.route || ''
    if (route.includes('index')) {
      currentPath.value = '/'
    } else if (route.includes('map')) {
      currentPath.value = '/map'
    } else if (route.includes('patrol')) {
      currentPath.value = '/patrol'
    } else if (route.includes('report')) {
      currentPath.value = '/report'
    }
  }
  // #endif
}

onMounted(() => {
  updateCurrentPath()
  // #ifdef H5
  // H5 模式下监听 hashchange
  window.addEventListener('hashchange', updateCurrentPath)
  // #endif
})

const navigateTo = (path) => {
  // 将路径转换为 uni-app 页面路径
  const pageMap = {
    '/': '/pages/index/index',
    '/map': '/pages/map/map',
    '/patrol': '/pages/patrol/patrol',
    '/report': '/pages/report/report'
  }
  const uniPath = pageMap[path] || path
  
  // 使用 reLaunch 进行页面跳转（类似 tabBar 的效果，但使用自定义导航）
  uni.reLaunch({
    url: uniPath,
    success: () => {
      currentPath.value = path
    },
    fail: (err) => {
      console.error('导航失败:', err)
    }
  })
}
</script>

<style scoped>
.bottom-nav {
  background: white;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: space-around;
  padding: 8px 0;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
  z-index: 1000;
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  max-width: 480px;
  width: 100%;
  box-sizing: border-box;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: #666;
  font-size: 10px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-weight: 400;
  transition: all 0.3s ease;
  padding: 5px;
  border-radius: 8px;
  min-width: 50px;
  cursor: pointer;
}

.nav-item i {
  font-size: 20px;
  margin-bottom: 2px;
}

.nav-item.active {
  color: #4CAF50;
  background: rgba(76, 175, 80, 0.1);
  font-weight: 500;
}

.nav-item text {
  font-size: 12px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-weight: 400;
  letter-spacing: 0.5px;
}
</style>