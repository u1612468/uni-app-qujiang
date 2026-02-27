<template>
  <view class="app-container">
    <AppHeader :title="'问题上报'">
      <template #left>
        <view class="back-btn" @click="goBack">
          <i class="fas fa-arrow-left"></i>
        </view>
        <text class="header-title">问题上报</text>
      </template>
      <template #right>
        <view class="location-btn" @click="getCurrentLocation">
          <i class="fas fa-location-crosshairs"></i>
        </view>
      </template>
    </AppHeader>

    <view class="main-content">
      <view class="report-container">
        <view class="report-form function-card">
          <text class="card-title"><i class="fas fa-edit"></i> 问题上报表单</text>
          
          <view class="form-group">
            <text class="form-label">问题类型 *</text>
            <view class="picker-wrapper">
              <view class="picker-view" @click="showTypePicker = !showTypePicker">
                <text>{{ reportTypes[typeIndex]?.label || '请选择问题类型' }}</text>
                <i class="fas fa-chevron-down" :class="{ 'fa-chevron-up': showTypePicker }"></i>
              </view>
              <!-- 下拉选择器 - 在点击框下方展示 -->
              <view v-if="showTypePicker" class="picker-dropdown">
                <view 
                  v-for="(type, index) in reportTypes" 
                  :key="index"
                  class="picker-dropdown-option"
                  :class="{ 'picker-dropdown-option-selected': typeIndex === index }"
                  @click="selectType(index)"
                >
                  <text>{{ type.label }}</text>
                  <i v-if="typeIndex === index" class="fas fa-check"></i>
                </view>
              </view>
            </view>
            <text v-if="typeDescription" class="type-description">
              {{ typeDescription }}
            </text>
          </view>
          
          <view class="form-group">
            <text class="form-label">位置信息</text>
            <view class="location-info">
              <text>坐标：<text class="location-coords">{{ currentLocationText }}</text></text>
              <text class="location-accuracy">{{ locationAccuracy }}</text>
              <view class="refresh-btn" @click="getCurrentLocation">
                <i class="fas fa-sync-alt"></i>
                <text>重新获取位置</text>
              </view>
            </view>
          </view>
          
          <view class="form-group">
            <text class="form-label">问题描述 *</text>
            <textarea 
              v-model="reportData.description"
              placeholder="请详细描述发现的问题，包括时间、具体位置、现状等"
              class="textarea"
            ></textarea>
          </view>
          
          <view class="form-group">
            <text class="form-label">现场照片</text>
            <view class="photo-upload-single">
              <view 
                class="photo-box"
                :class="{ 'photo-taken': photos[0] }"
                @click="takePhoto(0)"
              >
                <image v-if="photos[0]" :src="photos[0]" mode="aspectFill" class="photo-image"></image>
                <view v-else class="photo-placeholder">
                  <i class="fas fa-add"></i>
                  <text class="photo-text">点击添加照片</text>
                </view>
                <view 
                  v-if="photos[0]"
                  class="delete-photo"
                  @click.stop="deletePhoto(0)"
                >
                  <i class="fas fa-times"></i>
                </view>
              </view>
            </view>
          </view>
          
          <view class="form-group">
            <text class="form-label">紧急程度</text>
            <view class="picker-wrapper">
              <view class="picker-view" @click="showUrgencyPicker = !showUrgencyPicker">
                <text>{{ urgencyOptions[urgencyIndex]?.label || '一般' }}</text>
                <i class="fas fa-chevron-down" :class="{ 'fa-chevron-up': showUrgencyPicker }"></i>
              </view>
              <!-- 下拉选择器 - 在点击框下方展示 -->
              <view v-if="showUrgencyPicker" class="picker-dropdown">
                <view 
                  v-for="(option, index) in urgencyOptions" 
                  :key="index"
                  class="picker-dropdown-option"
                  :class="{ 'picker-dropdown-option-selected': urgencyIndex === index }"
                  @click="selectUrgency(index)"
                >
                  <text>{{ option.label }}</text>
                  <i v-if="urgencyIndex === index" class="fas fa-check"></i>
                </view>
              </view>
            </view>
          </view>
          
          <view class="form-group">
            <text class="form-label">联系方式（可选）</text>
            <input 
              type="text" 
              v-model="reportData.contact"
              placeholder="手机号或姓名"
              class="input"
            />
          </view>
          
          <view class="submit-buttons">
            <view class="submit-btn submit-save" @click="saveDraft">
              <i class="fas fa-save"></i>
              <text>保存草稿</text>
            </view>
            <view class="submit-btn submit-send" @click="submitReport">
              <i class="fas fa-paper-plane"></i>
              <text>立即上报</text>
            </view>
          </view>
        </view>
        
        <view class="recent-reports function-card">
          <text class="card-title"><i class="fas fa-history"></i> 最近上报记录</text>
          <!-- #ifdef H5 -->
          <view class="report-list">
            <view 
              v-for="report in recentReports" 
              :key="report.id"
              class="report-item"
              @click="showReportDetail(report)"
            >
              <view class="report-left">
                <text class="report-type" :class="`type-${report.type}`">
                  {{ report.typeText }}
                </text>
                <text class="report-time">{{ formatTime(report.submittedAt || report.createdAt) }}</text>
              </view>
              <view class="report-right">
                <text class="report-status" :class="`status-${report.status}`">
                  {{ getStatusText(report.status) }}
                </text>
              </view>
            </view>
            <view v-if="recentReports.length === 0" class="report-item">
              <text>暂无上报记录</text>
            </view>
          </view>
          <!-- #endif -->
          <!-- #ifndef H5 -->
          <scroll-view class="report-list" scroll-y>
            <view 
              v-for="report in recentReports" 
              :key="report.id"
              class="report-item"
              @click="showReportDetail(report)"
            >
              <view class="report-left">
                <text class="report-type" :class="`type-${report.type}`">
                  {{ report.typeText }}
                </text>
                <text class="report-time">{{ formatTime(report.submittedAt || report.createdAt) }}</text>
              </view>
              <view class="report-right">
                <text class="report-status" :class="`status-${report.status}`">
                  {{ getStatusText(report.status) }}
                </text>
              </view>
            </view>
            <view v-if="recentReports.length === 0" class="report-item">
              <text>暂无上报记录</text>
            </view>
          </scroll-view>
          <!-- #endif -->
        </view>
      </view>
    </view>
    
    <BottomNav />
  </view>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import BottomNav from '@/components/common/BottomNav.vue'
import AppHeader from '@/components/common/AppHeader.vue'

const currentLocation = ref(null)
const photos = ref([null]) // 只保留一个照片框
const reportData = ref({
  type: '',
  description: '',
  urgency: 'low',
  contact: ''
})
const typeDescription = ref('')
const recentReports = ref([])

const reportTypes = [
  { value: '', label: '请选择问题类型' },
  { value: 'boundary-violation', label: '边界侵占' },
  { value: 'construction', label: '违法建设' },
  { value: 'pollution', label: '环境污染' },
  { value: 'checkpoint-damage', label: '界桩损坏' },
  { value: 'signboard-damage', label: '标识牌损坏' },
  { value: 'vegetation-damage', label: '植被破坏' },
  { value: 'other', label: '其他问题' }
]

const urgencyOptions = [
  { value: 'low', label: '一般' },
  { value: 'medium', label: '紧急' },
  { value: 'high', label: '非常紧急' }
]

const typeIndex = ref(0)
const urgencyIndex = ref(0)
const showTypePicker = ref(false)
const showUrgencyPicker = ref(false)

const currentLocationText = computed(() => {
  if (!currentLocation.value) return '正在获取位置...'
  // 显示顺序：经度, 纬度
  return `${currentLocation.value.lng.toFixed(6)}, ${currentLocation.value.lat.toFixed(6)}`
})

const locationAccuracy = computed(() => {
  if (!currentLocation.value) return ''
  const accuracy = currentLocation.value.accuracy
  if (accuracy < 50) {
    return `定位精度：高 (±${Math.round(accuracy)}米)`
  } else if (accuracy < 100) {
    return `定位精度：中 (±${Math.round(accuracy)}米)`
  } else {
    return `定位精度：低 (±${Math.round(accuracy)}米)`
  }
})

const getCurrentLocation = () => {
  uni.getLocation({
    type: 'gcj02',
    geocode: true,
    success: (res) => {
      currentLocation.value = {
        lat: res.latitude,
        lng: res.longitude,
        accuracy: res.accuracy,
        altitude: res.altitude,
        timestamp: new Date()
      }
    },
    fail: (err) => {
      uni.showModal({
        title: '获取位置失败',
        content: '无法获取位置信息，请检查GPS设置',
        showCancel: false
      })
      currentLocation.value = {
        lat: 28.97,
        lng: 118.96,
        accuracy: 1000,
        timestamp: new Date()
      }
    }
  })
}

const onTypeChange = (e) => {
  typeIndex.value = e.detail.value
  const selectedType = reportTypes[e.detail.value]
  reportData.value.type = selectedType.value
  
  const descriptions = {
    'boundary-violation': '在生态保护红线范围内进行的侵占、越界行为',
    'construction': '未经批准的建设、施工活动',
    'pollution': '水污染、土壤污染、空气污染等环境问题',
    'checkpoint-damage': '界桩损坏、丢失、倾斜等问题',
    'signboard-damage': '标识牌损坏、污损、字迹不清',
    'vegetation-damage': '非法砍伐、毁林、破坏植被',
    'other': '其他未列出的问题'
  }
  
  typeDescription.value = descriptions[selectedType.value] || ''
}

const onUrgencyChange = (e) => {
  urgencyIndex.value = e.detail.value
  reportData.value.urgency = urgencyOptions[e.detail.value].value
}

const selectType = (index) => {
  typeIndex.value = index
  const selectedType = reportTypes[index]
  reportData.value.type = selectedType.value
  
  const descriptions = {
    'boundary-violation': '在生态保护红线范围内进行的侵占、越界行为',
    'construction': '未经批准的建设、施工活动',
    'pollution': '水污染、土壤污染、空气污染等环境问题',
    'checkpoint-damage': '界桩损坏、丢失、倾斜等问题',
    'signboard-damage': '标识牌损坏、污损、字迹不清',
    'vegetation-damage': '非法砍伐、毁林、破坏植被',
    'other': '其他未列出的问题'
  }
  
  typeDescription.value = descriptions[selectedType.value] || ''
  showTypePicker.value = false
}

const selectUrgency = (index) => {
  urgencyIndex.value = index
  reportData.value.urgency = urgencyOptions[index].value
  showUrgencyPicker.value = false
}

// 点击外部区域关闭选择器
const handleClickOutside = (event) => {
  // #ifdef H5
  // 检查点击是否在选择器外部
  const target = event.target
  if (target && typeof target.closest === 'function') {
    if (!target.closest('.picker-wrapper')) {
      showTypePicker.value = false
      showUrgencyPicker.value = false
    }
  }
  // #endif
}

const takePhoto = (index) => {
  if (photos.value[index]) {
    uni.previewImage({
      urls: photos.value.filter(p => p),
      current: photos.value[index]
    })
    return
  }
  
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['camera', 'album'],
    success: (res) => {
      photos.value[index] = res.tempFilePaths[0]
    },
    fail: (err) => {
      console.error('选择图片失败:', err)
    }
  })
}

const deletePhoto = (index) => {
  photos.value[index] = null
}

const saveDraft = () => {
  const reportDataObj = collectReportData()
  if (!validateReport(reportDataObj, false)) return
  
  try {
    const drafts = uni.getStorageSync('reportDrafts')
    const draftsList = drafts ? JSON.parse(drafts) : []
    reportDataObj.id = Date.now()
    reportDataObj.status = 'draft'
    reportDataObj.createdAt = new Date().toISOString()
    draftsList.push(reportDataObj)
    uni.setStorageSync('reportDrafts', JSON.stringify(draftsList))
    
    resetForm()
    uni.showToast({
      title: '草稿保存成功！',
      icon: 'success'
    })
  } catch (e) {
    console.error('保存草稿失败:', e)
  }
}

const submitReport = () => {
  const reportDataObj = collectReportData()
  if (!validateReport(reportDataObj, true)) return
  
  try {
    const reportId = 'RP' + new Date().getTime()
    const reports = uni.getStorageSync('reportedIssues')
    const reportsList = reports ? JSON.parse(reports) : []
    
    reportDataObj.id = reportId
    reportDataObj.status = 'pending'
    reportDataObj.submittedAt = new Date().toISOString()
    reportDataObj.processStatus = '待处理'
    
    reportsList.unshift(reportDataObj)
    uni.setStorageSync('reportedIssues', JSON.stringify(reportsList))
    
    const today = new Date().toDateString()
    const todayDataStr = uni.getStorageSync(`patrolData_${today}`)
    const todayData = todayDataStr ? JSON.parse(todayDataStr) : {
      distance: 0,
      reports: 0,
      checkpoints: 0
    }
    todayData.reports = (parseInt(todayData.reports) || 0) + 1
    uni.setStorageSync(`patrolData_${today}`, JSON.stringify(todayData))
    
    resetForm()
    loadRecentReports()
    
    uni.showModal({
      title: '上报成功',
      content: `报告编号：${reportId}\n问题类型：${reportDataObj.typeText}\n提交时间：${new Date().toLocaleString()}\n\n您的报告已提交至监管平台，请等待处理。`,
      showCancel: false
    })
  } catch (e) {
    console.error('提交报告失败:', e)
  }
}

const collectReportData = () => {
  const typeText = {
    'boundary-violation': '边界侵占',
    'construction': '违法建设',
    'pollution': '环境污染',
    'checkpoint-damage': '界桩损坏',
    'signboard-damage': '标识牌损坏',
    'vegetation-damage': '植被破坏',
    'other': '其他问题'
  }[reportData.value.type] || reportData.value.type
  
  return {
    type: reportData.value.type,
    typeText: typeText,
    location: currentLocation.value,
    description: reportData.value.description,
    photos: photos.value.filter(photo => photo !== null),
    urgency: reportData.value.urgency,
    contact: reportData.value.contact || '未提供',
    reporter: '巡查员'
  }
}

const validateReport = (data, isSubmit) => {
  if (!data.type) {
    uni.showToast({
      title: '请选择问题类型',
      icon: 'none'
    })
    return false
  }
  
  if (!data.description || data.description.trim().length < 10) {
    uni.showToast({
      title: '请详细描述问题（至少10个字符）',
      icon: 'none'
    })
    return false
  }
  
  if (isSubmit && !currentLocation.value) {
    uni.showToast({
      title: '无法获取位置信息，请检查GPS设置',
      icon: 'none'
    })
    return false
  }
  
  return true
}

const resetForm = () => {
  reportData.value = {
    type: '',
    description: '',
    urgency: 'low',
    contact: ''
  }
  photos.value = [null] // 只保留一个照片框
  typeDescription.value = ''
  typeIndex.value = 0
  urgencyIndex.value = 0
}

const loadRecentReports = () => {
  try {
    const reports = uni.getStorageSync('reportedIssues')
    if (reports) {
      recentReports.value = JSON.parse(reports).slice(0, 5)
    }
  } catch (e) {
    console.error('加载最近报告失败:', e)
  }
}

const formatTime = (dateString) => {
  const date = new Date(dateString)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const getStatusText = (status) => {
  switch(status) {
    case 'pending': return '待处理'
    case 'processing': return '处理中'
    case 'resolved': return '已处理'
    default: return '草稿'
  }
}

const showReportDetail = (report) => {
  uni.showModal({
    title: '报告详情',
    content: `报告编号：${report.id}\n问题类型：${report.typeText}\n上报时间：${new Date(report.submittedAt || report.createdAt).toLocaleString()}\n位置：${report.location ? `${report.location.lng.toFixed(6)}, ${report.location.lat.toFixed(6)}` : '未记录'}\n问题描述：${report.description}\n紧急程度：${getUrgencyText(report.urgency)}\n联系方式：${report.contact}\n照片：${report.photos && report.photos.length > 0 ? '已上传' : '未上传'}\n处理状态：${report.processStatus || '待处理'}`,
    showCancel: false
  })
}

const getUrgencyText = (urgency) => {
  switch(urgency) {
    case 'low': return '一般'
    case 'medium': return '紧急'
    case 'high': return '非常紧急'
    default: return '一般'
  }
}

const goBack = () => {
  uni.navigateBack()
}

onMounted(() => {
  getCurrentLocation()
  loadRecentReports()
  // #ifdef H5
  // 添加点击外部区域关闭选择器的事件监听
  document.addEventListener('click', handleClickOutside)
  // #endif
})

onUnmounted(() => {
  // #ifdef H5
  // 移除事件监听
  document.removeEventListener('click', handleClickOutside)
  // #endif
})
</script>

<style scoped>
.app-container {
  max-width: 480px;
  margin: 0 auto;
  width: 100%;
  background: white;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  box-sizing: border-box;
  overflow-x: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}


  .main-content {
    flex: 1;
    overflow: auto;
    padding: 20px;
    padding-bottom: 80px;
  }

.report-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.function-card {
  background: white;
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 3px 10px rgba(0,0,0,0.1);
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 15px;
  display: block;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

.form-group {
  margin-bottom: 28px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #333;
  font-size: 14px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

.picker-wrapper {
  position: relative;
  width: 100%;
}

.picker-view {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  background-color: #fff;
  transition: all 0.2s ease;
  position: relative;
  z-index: 10;
}

.picker-view:hover {
  border-color: #4CAF50;
  background-color: #f9f9f9;
}

.picker-view:active {
  background-color: #f0f0f0;
}

.picker-view .fa-chevron-up {
  transform: rotate(180deg);
  transition: transform 0.2s ease;
}

/* 下拉选择器 - 在点击框下方展示 */
.picker-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  max-height: 300px;
  overflow-y: auto;
  animation: dropdownFadeIn 0.2s ease;
}

@keyframes dropdownFadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.picker-dropdown-option {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 14px;
}

.picker-dropdown-option:last-child {
  border-bottom: none;
}

.picker-dropdown-option:hover {
  background-color: #f9f9f9;
}

.picker-dropdown-option-selected {
  background-color: #f0f9f0;
  color: #4CAF50;
}

.picker-dropdown-option-selected text {
  font-weight: bold;
}

.picker-dropdown-option i {
  color: #4CAF50;
  font-size: 14px;
}

/* 自定义选择器弹窗 - 从底部弹出 */
.custom-picker-modal {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 99999 !important;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  animation: fadeIn 0.3s ease;
  /* 确保不受父元素影响 */
  margin: 0;
  padding: 0;
  /* 确保在最上层，覆盖所有内容 */
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.custom-picker-content {
  width: 100%;
  max-width: 480px;
  background: white;
  border-radius: 16px 16px 0 0;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  /* 添加底部安全区域适配 */
  padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 20px);
  /* 确保固定在底部 */
  position: relative;
  bottom: 0;
  margin-bottom: 0;
  /* 确保层级高于底部导航栏 */
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
  /* 确保内容不被裁剪 */
  overflow: hidden;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.picker-header {
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  font-size: 16px;
  background: white;
  position: sticky;
  top: 0;
  z-index: 10;
}

.picker-close {
  font-size: 24px;
  color: #999;
  cursor: pointer;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.picker-close:hover {
  color: #333;
}

.picker-options {
  overflow-y: auto;
  max-height: calc(70vh - 60px);
  /* 添加滚动条样式 */
  -webkit-overflow-scrolling: touch;
}

.picker-options::-webkit-scrollbar {
  width: 4px;
}

.picker-options::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 2px;
}

.picker-option {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 14px;
}

.picker-option:hover {
  background-color: #f9f9f9;
}

.picker-option-selected {
  background-color: #f0f9f0;
  color: #4CAF50;
}

.picker-option-selected text {
  font-weight: bold;
}

.picker-option i {
  color: #4CAF50;
  font-size: 16px;
}


.type-description {
  font-size: 12px;
  color: #666;
  margin-top: 5px;
  font-style: italic;
  display: block;
}

.location-info {
  background: #f0f9f0;
  padding: 15px;
  border-radius: 8px;
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.location-coords {
  font-family: monospace;
  color: #4CAF50;
  font-weight: bold;
}

.location-accuracy {
  font-size: 12px;
  color: #666;
}

.refresh-btn {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
}

.refresh-btn:hover {
  background: #45a049;
}

.refresh-btn:active {
  background: #3d8b40;
}

.textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  min-height: 100px;
}

.input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
}

.photo-upload-single {
  margin-top: 10px;
}

.photo-upload {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 10px;
}

.photo-box {
  width: 100%;
  height: 150px;
  background: #f5f5f5;
  border: 2px dashed #ddd;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
}

.photo-box:hover {
  border-color: #4CAF50;
  background: #f0f9f0;
}

.photo-box.photo-taken {
  border-style: solid;
  border-color: #4CAF50;
}

.photo-image {
  width: 100%;
  height: 100%;
}

.photo-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.photo-text {
  font-size: 12px;
  color: #999;
}

.delete-photo {
  position: absolute;
  top: 5px;
  right: 5px;
  background: rgba(0,0,0,0.5);
  color: white;
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.submit-buttons {
  display: flex;
  gap: 15px;
  margin-top: 30px;
  width: 100%;
  box-sizing: border-box;
  position: relative;
}

.submit-btn {
  flex: 1;
  padding: 15px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  will-change: transform;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.submit-save {
  background: #4CAF50;
  color: white;
}

.submit-save:active {
  background: #1976D2;
  transform: scale(0.98);
}

.submit-send {
  background: #4CAF50;
  color: white;
}

.submit-send:active {
  background: #45a049;
  transform: scale(0.98);
}

.report-list {
  margin-top: 15px;
  max-height: 400px;
  /* #ifdef H5 */
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  /* #endif */
}

.report-item {
  padding: 15px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.report-item:last-child {
  border-bottom: none;
}

.report-left {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.report-type {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
  margin-right: 8px;
}

.type-boundary-violation,
.type-construction,
.type-pollution,
.type-checkpoint-damage,
.type-signboard-damage,
.type-vegetation-damage,
.type-other {
  background: #FFEBEE;
  color: #F44336;
}

.report-time {
  font-size: 14px;
  color: #666;
}

.report-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}

.status-pending {
  background: #FFF3E0;
  color: #FF9800;
}

.status-processing {
  background: #E3F2FD;
  color: #4CAF50;
}

.status-resolved {
  background: #E8F5E9;
  color: #4CAF50;
}

.status-draft {
  background: #F5F5F5;
  color: #666;
}

.back-btn {
  color: white;
  margin-right: 10px;
  font-size: 18px;
}

.header-title {
  color: white;
  font-size: 18px;
  font-weight: 600;
}

.location-btn {
  background: none;
  border: none;
  color: white;
  font-size: 16px;
}
</style>