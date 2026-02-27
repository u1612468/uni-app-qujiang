<template>
  <view class="app-container home-bg">
    <AppHeader 
      :title="'衢江生态保护红线巡查系统'" 
      :date="currentDate"
    />

    <view class="main-content">
      <!-- 主要功能网格 -->
      <view class="function-card">
        <view class="section-header">
          <text class="section-title"><i class="fas fa-th-large"></i> 核心功能</text>
        </view>
        <view class="function-grid">
          <view class="function-card-inner" @click="navigateTo('/map')">
            <view class="icon-box">
              <i class="fas fa-map"></i>
            </view>
            <text class="card-title">地图浏览</text>
            <text class="card-desc">查看生态红线分布与位置信息</text>
            <view class="card-footer">
              <text class="hint">点击进入</text>
            </view>
          </view>

          <view class="function-card-inner" @click="navigateTo('/patrol')">
            <view class="icon-box">
              <i class="fas fa-walking"></i>
            </view>
            <text class="card-title">开始巡查</text>
            <text class="card-desc">记录巡查轨迹与工作日志</text>
            <view class="card-footer">
              <text class="hint">点击开始</text>
            </view>
          </view>

          <view class="function-card-inner" @click="navigateTo('/report')">
            <view class="icon-box">
              <i class="fas fa-flag"></i>
            </view>
            <text class="card-title">问题上报</text>
            <text class="card-desc">上报违规问题并上传现场证据</text>
            <view class="card-footer">
              <text class="hint">点击上报</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 今日统计 -->
      <view class="stats-card function-card">
        <view class="stats-header">
          <text class="section-title"><i class="fas fa-chart-bar"></i> 今日巡查统计</text>
          <view class="refresh-btn" @click="loadTodayStats" :class="{ refreshing: isRefreshing }">
            <i class="fas fa-redo-alt"></i>
          </view>
        </view>
        <view class="stats-grid">
          <view class="stat-item">
            <view class="stat-icon">
              <i class="fas fa-road"></i>
            </view>
            <view class="stat-content">
              <view class="stat-value">
                <text class="value-text">{{ todayStats.distance || '3' }}</text>
                <text class="unit">km</text>
              </view>
              <text class="stat-label">巡查里程</text>
            </view>
          </view>
          <view class="stat-item">
            <view class="stat-icon">
              <i class="fas fa-exclamation-triangle"></i>
            </view>
            <view class="stat-content">
              <view class="stat-value">
                <text class="value-text">{{ todayStats.reports || 8 }}</text>
                <text class="unit">个</text>
              </view>
              <text class="stat-label">上报问题</text>
            </view>
          </view>
          <view class="stat-item">
            <view class="stat-icon">
              <i class="fas fa-clock"></i>
            </view>
            <view class="stat-content">
              <view class="stat-value">
                <text class="value-text">{{ todayStats.duration || '45' }}</text>
                <text class="unit">min</text>
              </view>
              <text class="stat-label">巡查时长</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 快捷操作 -->
      <view class="quick-actions function-card">
        <text class="section-title"><i class="fas fa-bolt"></i> 快捷操作</text>
        <view class="actions-grid">
          <view class="action-item" @click="showLocation">
            <i class="fas fa-location" style="color: #4CAF50;"></i>
            <text>定位</text>
          </view>
          <view class="action-item" @click="showRecentPatrol">
            <i class="fas fa-history" style="color: #4CAF50;"></i>
            <text>最近记录</text>
          </view>
          <view class="action-item" @click="showEmergencyContact">
            <i class="fas fa-phone" style="color: #4CAF50;"></i>
            <text>紧急联系人</text>
          </view>
          <view class="action-item" @click="showHelp">
            <i class="fas fa-question-circle" style="color: #4CAF50;"></i>
            <text>使用帮助</text>
          </view>
        </view>
      </view>
    </view>
    <BottomNav />
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import BottomNav from '@/components/common/BottomNav.vue'
import AppHeader from '@/components/common/AppHeader.vue'

const currentDate = ref('')
const todayStats = ref({
  distance: 0,
  reports: 0,
  duration: 0
})
const isRefreshing = ref(false)

let dateInterval = null

const updateCurrentDate = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  const weekday = weekdays[now.getDay()]
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  
  currentDate.value = `${year}-${month}-${day} 周${weekday} ${hours}:${minutes}`
}

const loadTodayStats = () => {
  isRefreshing.value = true
  const today = new Date().toDateString()
  
  try {
    const todayDataStr = uni.getStorageSync(`patrolData_${today}`)
    if (todayDataStr) {
      todayStats.value = JSON.parse(todayDataStr)
    } else {
      todayStats.value = {
        distance: (Math.random() * 15 + 5).toFixed(1),
        reports: Math.floor(Math.random() * 5),
        duration: Math.floor(Math.random() * 120 + 30)
      }
    }
  } catch (e) {
    console.error('加载统计数据失败:', e)
  }
  
  setTimeout(() => {
    isRefreshing.value = false
  }, 500)
}

const navigateTo = (path) => {
  // 将路径转换为 uni-app 页面路径
  const pageMap = {
    '/map': '/pages/map/map',
    '/patrol': '/pages/patrol/patrol',
    '/report': '/pages/report/report'
  }
  const uniPath = pageMap[path] || path
  
  // 使用 reLaunch 进行页面跳转（类似 tabBar 的效果）
  uni.reLaunch({
    url: uniPath,
    fail: (err) => {
      console.error('导航失败:', err)
    }
  })
}

const showLocation = () => {
  uni.showModal({
    title: '定位功能',
    content: '正在获取您的位置信息...',
    showCancel: false
  })
}

const showRecentPatrol = () => {
  uni.showModal({
    title: '最近巡查记录',
    content: '显示最近7天的巡查记录。',
    showCancel: false
  })
}

const showEmergencyContact = () => {
  uni.showModal({
    title: '紧急联系人',
    content: '值班室：0570-12345678\n负责人：张主任 13800138000',
    showCancel: false
  })
}

const showHelp = () => {
  uni.showModal({
    title: '使用帮助',
    content: '1. 地图浏览：查看生态红线分布\n2. 开始巡查：记录巡查轨迹\n3. 问题上报：上传现场照片和问题描述',
    showCancel: false
  })
}

onMounted(() => {
  console.log('IndexPage component mounted')
  updateCurrentDate()
  loadTodayStats()
  dateInterval = setInterval(updateCurrentDate, 60000)
  console.log('IndexPage initialization complete')
})

onUnmounted(() => {
  if (dateInterval) {
    clearInterval(dateInterval)
  }
})
</script>

<style scoped>
.app-container {
  max-width: 480px;
  margin: 0 auto;
  background: white;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

.main-content {
  flex: 1;
  overflow: auto;
  padding: 20px;
  padding-bottom: 80px;
}

.function-card {
  border-radius: 16px;
  padding: 18px;
  margin-bottom: 15px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 17px;
  color: #1f2937;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.function-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.function-card-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 20px 12px;
  border-radius: 12px;
  background: #f9fafb;
  transition: all 0.2s;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.function-card-inner:active {
  background: #f3f4f6;
  transform: translateY(-2px);
}

.icon-box {
  width: 60px;
  height: 60px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  font-size: 24px;
  color: #4CAF50;
  background: rgba(76, 175, 80, 0.1);
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 6px;
}

.card-desc {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.4;
  margin-bottom: 12px;
}

.card-footer {
  margin-top: auto;
}

.hint {
  font-size: 12px;
  color: #9ca3af;
  font-weight: 500;
}

.stats-card {
  margin-bottom: 8px;
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.refresh-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  color: #4b5563;
  transition: all 0.3s;
}

.refresh-btn.refreshing {
  transform: rotate(180deg);
}

.stats-grid {
  display: flex;
  gap: 12px;
  justify-content: space-between;
  flex-wrap: nowrap;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(16,24,40,0.04);
  border: 1px solid rgba(0,0,0,0.03);
  flex: 1 1 0;
  min-width: 0;
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(76, 175, 80, 0.12);
  color: #4CAF50;
  font-size: 18px;
}

.stat-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #111827;
  line-height: 1;
}

.unit {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  margin-left: 6px;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
}

.quick-actions {
  margin-bottom: 16px;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-top: 16px;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px 8px;
  background: #f9fafb;
  border-radius: 12px;
  transition: all 0.2s;
}

.action-item:active {
  background: #f3f4f6;
  transform: translateY(-2px);
}

.action-item i {
  font-size: 22px;
  color: #4b5563;
  margin-bottom: 8px;
}

.action-item text {
  font-size: 13px;
  color: #4b5563;
  text-align: center;
}

@media (max-width: 480px) {
  .function-grid {
    gap: 12px;
  }
  
  .function-card-inner {
    padding: 16px 10px;
  }
  
  .icon-box {
    width: 52px;
    height: 52px;
    font-size: 22px;
  }
}
</style>