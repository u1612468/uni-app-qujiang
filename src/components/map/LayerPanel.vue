<template>
  <view class="layer-panel" :class="{ open: visible }" v-if="visible">
    <view class="layer-panel-header">
      <text class="panel-title">图层控制</text>
      <view class="close-btn" @click="$emit('close')">
        <i class="fas fa-times"></i>
      </view>
    </view>

    <view class="layer-list">
      <!-- 底图图层 -->
      <view class="layer-section">
        <text class="section-title">底图类型</text>
        <view class="layer-item" :class="{ active: currentMapType === 'vec' }">
          <view class="layer-checkbox-wrapper" @click="$emit('switch', 'vec')">
            <view class="custom-checkbox" :class="{ checked: currentMapType === 'vec' }">
              <i v-if="currentMapType === 'vec'" class="fas fa-check"></i>
            </view>
          </view>
          <view class="layer-label" @click="$emit('switch', 'vec')">
            <view class="layer-icon">
              <i class="fas fa-map"></i>
            </view>
            <view class="layer-info">
              <text class="layer-name">矢量地图</text>
              <text class="layer-desc">标准道路地图</text>
            </view>
          </view>
        </view>
        
        <view class="layer-item" :class="{ active: currentMapType === 'img' }">
          <view class="layer-checkbox-wrapper" @click="$emit('switch', 'img')">
            <view class="custom-checkbox" :class="{ checked: currentMapType === 'img' }">
              <i v-if="currentMapType === 'img'" class="fas fa-check"></i>
            </view>
          </view>
          <view class="layer-label" @click="$emit('switch', 'img')">
            <view class="layer-icon">
              <i class="fas fa-satellite"></i>
            </view>
            <view class="layer-info">
              <text class="layer-name">影像地图</text>
              <text class="layer-desc">卫星影像地图</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 叠加图层 -->
      <view class="layer-section" v-if="layers && layers.length > 0">
        <text class="section-title">业务图层</text>
        <view v-for="layer in layers" :key="layer.id" class="layer-item" :class="{ active: layer.visible }">
          <view class="layer-checkbox-wrapper" @click="$emit('toggle', layer)">
            <view class="custom-checkbox" :class="{ checked: layer.visible }">
              <i v-if="layer.visible" class="fas fa-check"></i>
            </view>
          </view>
          <view class="layer-label" @click="$emit('toggle', layer)">
            <view class="layer-icon">
              <i :class="layer.icon || 'fas fa-layer-group'"></i>
            </view>
            <view class="layer-info">
              <text class="layer-name">{{ layer.name }}</text>
              <text class="layer-desc">{{ layer.description }}</text>
              <text v-if="layer.featureCount" class="layer-count">
                {{ layer.featureCount }} 个要素
              </text>
            </view>
          </view>
        </view>
      </view>

      <!-- 无叠加图层提示 -->
      <view v-if="!layers || layers.length === 0" class="empty-layers">
        <i class="fas fa-layer-group"></i>
        <text>暂无业务图层</text>
      </view>
    </view>
    
    <view class="layer-panel-footer">
      <text>点击要素可查看详细信息</text>
    </view>
  </view>
</template>

<script setup>
defineProps({
  visible: { type: Boolean, default: false },
  currentMapType: { type: String, default: 'vec' },
  layers: { type: Array, default: () => [] }
})

defineEmits(['close', 'switch', 'toggle'])
</script>

<style scoped>
.layer-panel {
  position: absolute;
  top: 80px;
  right: 10px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  padding: 16px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  z-index: 1200;
  width: 300px;
  max-width: calc(100vw - 100px);
  max-height: calc(100vh - 200px);
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(76, 175, 80, 0.1);
  pointer-events: auto;
}

.layer-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.panel-title {
  margin: 0;
    color: #333;
    font-size: 16px;
    font-weight: 600;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

.close-btn {
  background: none;
    border: none;
    color: #666;
    cursor: pointer;
    font-size: 18px;
    padding: 8px;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    transition: all 0.2s ease;
}


.layer-list {
  flex: 1;
  max-height: 400px;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 4px;
}

/* 自定义滚动条样式 */
.layer-list::-webkit-scrollbar {
  width: 6px;
}

.layer-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.layer-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 10px;
}


.layer-section {
  margin-bottom: 12px;
}

.section-title {
  font-size: 13px;
  color: #666;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
  display: block;
  padding-left: 4px;
}

.layer-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  background: #f8f9fa;
  border: 2px solid transparent;
  margin-bottom: 8px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.layer-item:hover {
  background: #f0f7f0;
  transform: translateX(-2px);
}

.layer-item.active {
  background: rgba(76, 175, 80, 0.08);
}

.layer-item:active {
  transform: scale(0.98);
}

.layer-checkbox-wrapper {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}

.custom-checkbox {
  width: 22px;
  height: 22px;
  border: 2px solid #4CAF50;
  border-radius: 6px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  cursor: pointer;
}

.custom-checkbox.checked {
  background: #4CAF50;
  border-color: #4CAF50;
}

.custom-checkbox.checked i {
  color: #fff;
  font-size: 12px;
  font-weight: bold;
}

.custom-checkbox:active {
  transform: scale(0.95);
}

.layer-label {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.layer-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.05) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #4CAF50;
  flex-shrink: 0;
}

.layer-item.active .layer-icon {
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.2) 0%, rgba(76, 175, 80, 0.1) 100%);
}

.layer-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.layer-name {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.layer-desc {
  font-size: 12px;
  color: #888;
}

.layer-count {
  font-size: 10px;
  color: #888;
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 10px;
  margin-top: 2px;
  display: inline-block;
}

.empty-layers {
  padding: 20px;
  text-align: center;
  color: #999;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.empty-layers i {
  font-size: 32px;
  opacity: 0.5;
}

.layer-panel-footer {
  margin-top: 15px;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
  text-align: center;
  color: #999;
  font-size: 12px;
}

@media (max-width: 480px) {
  .layer-panel {
    position: absolute;
    top: 70px;
    right: 5px;
    left: auto;
    bottom: auto;
    margin: 0;
    border-radius: 16px;
    width: calc(100vw - 80px);
    max-width: calc(100vw - 80px);
    max-height: calc(100vh - 150px);
    padding: 12px;
  }
  
  .layer-item {
    padding: 10px 12px;
  }
  
  .layer-icon {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }
  
  .layer-checkbox-wrapper {
    width: 20px;
    height: 20px;
  }
  
  .custom-checkbox {
    width: 18px;
    height: 18px;
  }
}

@media (max-width: 375px) {
  .layer-panel {
    width: calc(100vw - 60px);
    max-width: calc(100vw - 60px);
    padding: 10px;
  }
  
  .panel-title {
    font-size: 15px;
  }
  
  .layer-name {
    font-size: 13px;
  }
  
  .layer-desc {
    font-size: 11px;
  }
}
</style>