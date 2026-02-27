<template>
	<view class="app-container">
	  <AppHeader :title="'巡查记录'">
		<template #left>
		  <view class="back-btn" @click="goBack" style="color: white; margin-right: 10px;">
			<i class="fas fa-arrow-left"></i>
		  </view>
		  <text class="header-title">巡查记录</text>
		</template>
		
		<template #right>
		  <text class="patrol-timer">{{ patrolTimer }}</text>
		</template>
	  </AppHeader>
  
  
	  <view class="main-content">
		<view class="patrol-container">
		  <view class="patrol-status function-card">
			<text class="status-header">
			  <view :class="['status-indicator', patrolStatus === '巡查中' ? 'status-on' : 'status-off']"></view>
			  <text>巡查状态：{{ patrolStatus }}</text>
			</text>
			<text class="location-info">{{ locationInfo }}</text>
			
			<view class="patrol-controls">
			  <view 
				class="control-btn start-btn" 
				@click="startPatrol"
				:class="{ disabled: patrolStatus === '巡查中' }"
			  >
				<i class="fas fa-play"></i> 开始巡查
			  </view>
			  <view 
				class="control-btn stop-btn" 
				@click="stopPatrol"
				:class="{ disabled: patrolStatus !== '巡查中' }"
			  >
				<i class="fas fa-stop"></i> 结束巡查
			  </view>
			</view>
			
			<view class="patrol-stats stats-grid">
			  <view class="stat-item">
				<text class="stat-value">{{ currentDistance.toFixed(2) }}</text>
				<text class="stat-label">当前里程(km)</text>
			  </view>
			  <view class="stat-item">
				<text class="stat-value">{{ currentTime }}</text>
				<text class="stat-label">持续时间</text>
			  </view>
			  <view class="stat-item">
				<text class="stat-value">{{ currentSpeed.toFixed(1) }}</text>
				<text class="stat-label">速度(km/h)</text>
			  </view>
			</view>
		  </view>
		  
		  <view class="function-card" @click="startBoundaryPatrol">
			<text class="card-title"><i class="fas fa-draw-polygon"></i> 边界专项巡查</text>
			<text class="card-desc">沿生态保护红线边界进行巡查，重点检查边界清晰度</text>
		  </view>
		  
		  <view class="function-card" @click="startCheckpointPatrol">
			<text class="card-title"><i class="fas fa-map-pin"></i> 界桩专项巡查</text>
			<text class="card-desc">按预定路线巡查所有界桩，检查界桩状况</text>
		  </view>
		  
		  <view class="patrol-history function-card">
			<text class="card-title"><i class="fas fa-history"></i> 历史巡查记录</text>
			<view class="history-list">
			  <view 
				v-for="record in historyRecords" 
				:key="record.id"
				class="history-item"
				@click="showHistoryDetail(record)"
			  >
				<view>
				  <text class="history-date">{{ formatDate(record.startTime) }}</text>
				  <text class="history-duration">时长: {{ record.duration }}</text>
				</view>
				<view>
				  <text class="history-distance">{{ record.distance }} km</text>
				  <text style="color: #666; font-size: 12px;">{{ record.points }} 个记录点</text>
				</view>
			  </view>
			  <view v-if="historyRecords.length === 0" class="history-item">
				<text>暂无巡查记录</text>
			  </view>
			</view>
		  </view>
		</view>
	  </view>
	<BottomNav />
	</view>
</template>
  
  <script>
  import BottomNav from '@/components/common/BottomNav.vue'
  import AppHeader from '@/components/common/AppHeader.vue'
  
  export default {
	name: 'Patrol',
	components: {
	  BottomNav,
	  AppHeader
	},
	data() {
	  return {
		patrolStatus: '未开始',
		patrolTimer: '00:00:00',
		locationInfo: '等待定位...',
		currentDistance: 0,
		currentTime: '0:00',
		currentSpeed: 0,
		historyRecords: [],
		isPatrolling: false,
		patrolInterval: null,
		patrolStartTime: null,
		patrolPoints: [],
		watchId: null,
		totalDistance: 0,
		timerSeconds: 0
	  }
	},
	mounted() {
	  this.loadHistory()
	},
	beforeDestroy() {
	  if (this.isPatrolling) {
		this.stopPatrol()
	  }
	},
	methods: {
	  loadHistory() {
		try {
		  const historyStr = uni.getStorageSync('patrolHistory')
		  const history = historyStr ? JSON.parse(historyStr) : []
		  this.historyRecords = history.slice(0, 10)
		} catch (e) {
		  console.error('加载历史记录失败:', e)
		  this.historyRecords = []
		}
	  },
	  
	  formatDate(dateString) {
		const date = new Date(dateString)
		return `${date.getMonth()+1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
	  },
	  
	  startPatrol() {
		uni.getLocation({
		  type: 'gcj02',
		  geocode: true,
		  success: (res) => {
			this.isPatrolling = true
			this.patrolStatus = '巡查中'
			this.patrolStartTime = new Date()
			this.patrolPoints = [{
			  lat: res.latitude,
			  lng: res.longitude,
			  time: this.patrolStartTime.toISOString(),
			  accuracy: res.accuracy || 100
			}]
			this.totalDistance = 0
			this.timerSeconds = 0
			
			// 开始位置监听（H5 模式下使用 navigator.geolocation）
			// #ifdef H5
			if (navigator.geolocation) {
			  this.watchId = navigator.geolocation.watchPosition(
				this.updatePosition,
				this.handlePositionError,
				{
				  enableHighAccuracy: true,
				  maximumAge: 10000,
				  timeout: 5000
				}
			  )
			}
			// #endif
			
			// #ifndef H5
			// 小程序端使用 uni.onLocationChange
			// 这里可以添加小程序端的定位监听逻辑
			// #endif
			
			// 开始计时器
			this.startTimer()
			
			uni.showModal({
			  title: '巡查已开始',
			  content: '系统将自动记录您的轨迹。',
			  showCancel: false
			})
		  },
		  fail: (error) => {
			uni.showModal({
			  title: '获取位置失败',
			  content: '无法获取位置信息，请检查GPS设置',
			  showCancel: false
			})
		  }
		})
	  },
	  
	  updatePosition(position) {
		const newPoint = {
		  lat: position.coords.latitude,
		  lng: position.coords.longitude,
		  time: new Date().toISOString(),
		  accuracy: position.coords.accuracy,
		  speed: position.coords.speed || 0
		}
		
		this.patrolPoints.push(newPoint)
		
		// 计算距离
		if (this.patrolPoints.length > 1) {
		  const lastPoint = this.patrolPoints[this.patrolPoints.length - 2]
		  const distance = this.calculateDistance(
			lastPoint.lat,
			lastPoint.lng,
			newPoint.lat,
			newPoint.lng
		  )
		  this.totalDistance += distance
		  this.currentDistance = this.totalDistance / 1000 // 转换为公里
		  this.currentSpeed = (newPoint.speed * 3.6) || 0
		}
		
		// 更新位置信息
		this.locationInfo = `
		  位置：${newPoint.lat.toFixed(6)}, ${newPoint.lng.toFixed(6)}
		  精度：±${Math.round(newPoint.accuracy)}米
		  海拔：${position.coords.altitude ? position.coords.altitude.toFixed(1) + '米' : '未知'}
		`
	  },
	  
	  calculateDistance(lat1, lon1, lat2, lon2) {
		const R = 6371000 // 地球半径（米）
		const dLat = (lat2 - lat1) * Math.PI / 180
		const dLon = (lon2 - lon1) * Math.PI / 180
		const a = 
		  Math.sin(dLat/2) * Math.sin(dLat/2) +
		  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
		  Math.sin(dLon/2) * Math.sin(dLon/2)
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
		return R * c
	  },
	  
	  startTimer() {
		this.patrolInterval = setInterval(() => {
		  this.timerSeconds++
		  const hours = Math.floor(this.timerSeconds / 3600)
		  const minutes = Math.floor((this.timerSeconds % 3600) / 60)
		  const seconds = this.timerSeconds % 60
		  
		  this.currentTime = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
		  this.patrolTimer = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
		}, 1000)
	  },
	  
	  handlePositionError(error) {
		console.error('位置获取错误:', error)
		this.locationInfo = '位置获取失败：' + this.getErrorMessage(error.code)
	  },
	  
	  getErrorMessage(code) {
		switch(code) {
		  case 1: return '用户拒绝了位置请求'
		  case 2: return '无法获取位置信息'
		  case 3: return '位置请求超时'
		  default: return '未知错误'
		}
	  },
	  
	  stopPatrol() {
		if (!this.isPatrolling) return
		
		this.isPatrolling = false
		this.patrolStatus = '未开始'
		
		// 停止位置监听
		if (this.watchId) {
		  navigator.geolocation.clearWatch(this.watchId)
		}
		
		// 停止计时器
		clearInterval(this.patrolInterval)
		
		// 计算总时长
		const endTime = new Date()
		const duration = Math.floor((endTime - this.patrolStartTime) / 1000)
		const hours = Math.floor(duration / 3600)
		const minutes = Math.floor((duration % 3600) / 60)
		const seconds = duration % 60
		const durationText = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
		
		// 保存巡查记录
		this.savePatrolRecord(durationText)
		
		alert(`巡查结束！
  里程：${this.currentDistance.toFixed(2)} km
  时长：${durationText}
  记录点：${this.patrolPoints.length}个`)
		
		// 重置数据
		this.resetPatrolData()
	  },
	  
	  savePatrolRecord(durationText) {
		const record = {
		  id: Date.now(),
		  startTime: this.patrolStartTime.toISOString(),
		  endTime: new Date().toISOString(),
		  duration: durationText,
		  distance: this.currentDistance.toFixed(2),
		  points: this.patrolPoints.length,
		  route: this.patrolPoints,
		  type: '常规巡查'
		}
		
		// 保存到本地存储
		try {
		  const historyStr = uni.getStorageSync('patrolHistory')
		  const history = historyStr ? JSON.parse(historyStr) : []
		  history.unshift(record)
		  uni.setStorageSync('patrolHistory', JSON.stringify(history))

		  // 更新统计
		  const today = new Date().toDateString()
		  const todayDataStr = uni.getStorageSync(`patrolData_${today}`)
		  const todayData = todayDataStr ? JSON.parse(todayDataStr) : {
			distance: 0,
			reports: 0,
			checkpoints: 0
		  }
		  todayData.distance = (parseFloat(todayData.distance) + this.currentDistance).toFixed(2)
		  uni.setStorageSync(`patrolData_${today}`, JSON.stringify(todayData))
		} catch (e) {
		  console.error('保存巡查记录失败:', e)
		}
		
		// 重新加载历史记录
		this.loadHistory()
	  },
	  
	  resetPatrolData() {
		this.currentDistance = 0
		this.currentSpeed = 0
		this.currentTime = '0:00'
		this.patrolTimer = '00:00:00'
		this.locationInfo = '等待定位...'
		this.timerSeconds = 0
		this.patrolPoints = []
		this.totalDistance = 0
	  },
	  
	  showHistoryDetail(record) {
		alert(`巡查记录详情\n\n` +
			  `开始时间：${new Date(record.startTime).toLocaleString()}\n` +
			  `结束时间：${new Date(record.endTime).toLocaleString()}\n` +
			  `巡查时长：${record.duration}\n` +
			  `巡查里程：${record.distance} km\n` +
			  `记录点数：${record.points}个\n` +
			  `巡查类型：${record.type}`)
	  },
	  
	  startBoundaryPatrol() {
		uni.showModal({
		  title: '开始边界专项巡查',
		  content: '注意：此模式会沿生态保护红线边界进行巡查，重点检查边界清晰度和界桩标识。',
		  success: (res) => {
			if (res.confirm) {
			  uni.showModal({
				title: '边界专项巡查模式已启动',
				content: '请沿红线边界移动，系统将自动记录。',
				showCancel: false
			  })
			  // 可以添加专门的边界巡查逻辑
			}
		  }
		})
	  },
	  
	  startCheckpointPatrol() {
		uni.showModal({
		  title: '开始界桩专项巡查',
		  content: '注意：此模式会按预定路线巡查所有界桩，需要检查每个界桩的状况。',
		  success: (res) => {
			if (res.confirm) {
			  uni.showModal({
				title: '界桩专项巡查模式已启动',
				content: '请按预定路线检查各界桩点。',
				showCancel: false
			  })
			  // 可以添加专门的界桩巡查逻辑
			}
		  }
		})
	  },
	  
	  goBack() {
		uni.navigateBack()
	  }
	}
  }
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
  
  .patrol-container {
	display: flex;
	flex-direction: column;
	gap: 15px;
  }
  
  .function-card {
	background: white;
	border-radius: 15px;
	padding: 20px;
	margin-bottom: 15px;
	box-shadow: 0 3px 10px rgba(0,0,0,0.1);
  }
  
  .card-title {
	font-size: 16px;
	font-weight: 600;
	margin-bottom: 8px;
	display: block;
	color: #333;
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  }
  
  .card-desc {
	font-size: 13px;
	color: #666;
	line-height: 1.5;
	display: block;
	margin-top: 5px;
  }
  
  .patrol-status {
	text-align: center;
  }
  
  .status-header {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 10px;
	margin-bottom: 15px;
	font-size: 16px;
	font-weight: 600;
  }
  
  .status-indicator {
	width: 12px;
	height: 12px;
	border-radius: 50%;
	background: #ccc;
  }
  
  .status-indicator.status-on {
	background: #4CAF50;
	animation: pulse 2s infinite;
  }
  
  .status-indicator.status-off {
	background: #ccc;
  }
  
  @keyframes pulse {
	0%, 100% { opacity: 1; }
	50% { opacity: 0.5; }
  }
  
  .patrol-controls {
	display: flex;
	justify-content: center;
	gap: 20px;
	margin: 20px 0;
  }
  
  .control-btn {
	flex: 1;
	padding: 12px 20px;
	border-radius: 8px;
	font-size: 14px;
	font-weight: 600;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	cursor: pointer;
	transition: all 0.3s ease;
  }
  
  .control-btn.disabled {
	opacity: 0.5;
	cursor: not-allowed;
  }
  
  .start-btn {
	background: #4CAF50;
	color: white;
  }
  
  .start-btn:not(.disabled):active {
	background: #45a049;
	transform: scale(0.98);
  }
  
  .stop-btn {
	background: #F44336;
	color: white;
  }
  
  .stop-btn:not(.disabled):active {
	background: #D32F2F;
	transform: scale(0.98);
  }
  
  .patrol-stats {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 12px;
	margin-top: 20px;
  }
  
  .stat-item {
	background: #f8f9fa;
	padding: 15px;
	border-radius: 10px;
	text-align: center;
  }
  
  .stat-value {
	font-size: 18px;
	font-weight: 700;
	color: #4CAF50;
	margin-bottom: 5px;
	display: block;
  }
  
  .stat-label {
	font-size: 12px;
	color: #666;
	display: block;
  }
  
  .history-list {
	margin-top: 15px;
  }
  
  .history-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 15px;
	border-bottom: 1px solid #eee;
	cursor: pointer;
	transition: background-color 0.2s;
  }
  
  .history-item:active {
	background: #f9f9f9;
  }
  
  .history-item:last-child {
	border-bottom: none;
  }
  
  .history-date {
	font-weight: bold;
	font-size: 14px;
	display: block;
	margin-bottom: 5px;
  }
  
  .history-distance {
	color: #4CAF50;
	font-weight: bold;
	font-size: 16px;
	display: block;
	margin-bottom: 5px;
  }
  
  .history-duration {
	color: #666;
	font-size: 12px;
	display: block;
  }
  
  .location-info {
	white-space: pre-line;
	text-align: left;
	background: #f8f9fa;
	padding: 10px;
	border-radius: 8px;
	margin: 15px 0;
	font-size: 14px;
	line-height: 1.5;
	display: block;
  }
  
  .header-title {
	color: white;
	font-size: 18px;
	font-weight: 600;
  }
  
  .patrol-timer {
	color: white;
	font-size: 14px;
	font-weight: 500;
  }
  </style>