<template>
  <view class="app-header">
    <view class="header-left">
      <slot name="left">
        <text class="icon"><i class="fas fa-leaf"></i></text>
        <text class="title">{{ title }}</text>
      </slot>
    </view>
    <view class="header-right">
      <slot name="right">
        <text v-if="date" class="date-indicator">
          {{ date }}
        </text>
      </slot>
    </view>
  </view>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: '巡查平台'
  },
  date: {
    type: String,
    default: ''
  }
})
</script>

<style scoped>
.app-header {
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
  max-width: 480px;
  width: 100%;
  box-sizing: border-box;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-left .icon {
  font-size: 22px;
}

.header-left .title {
  font-size: 18px;
  font-weight: 600;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}


.date-indicator {
  font-size: 13px;
  opacity: 0.9;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

@media (max-width: 480px) {
  .app-header {
    padding: 12px 16px;
  }
  
  .header-left .title {
    font-size: 16px;
  }
  
  .header-right {
    font-size: 13px;
    gap: 8px;
  }
}
</style>