<template>
  <view class="search-container">
    <!-- 搜索触发按钮 -->
    <view class="search-trigger" @click="toggleSearchPanel">
      <i class="fas fa-search"></i>
      <text class="trigger-text">搜索地点/图层数据</text>
      <i class="fas fa-chevron-down" :class="{ 'rotated': isPanelOpen }"></i>
    </view>
    
    <!-- 搜索面板 -->
    <view class="search-panel" :class="{ 'open': isPanelOpen }" v-if="isPanelOpen">
      <view class="panel-header">
        <text class="panel-title"><i class="fas fa-search"></i> 智能搜索</text>
        <view class="close-panel-btn" @click="closePanel">
          <i class="fas fa-times"></i>
        </view>
      </view>
      
      <!-- 搜索输入区域 -->
      <view class="search-input-area">
        <view class="input-wrapper">
          <i class="fas fa-search input-icon"></i>
          <input 
            type="text" 
            class="search-input" 
            :placeholder="getPlaceholder()"
            :value="inputValue"
            @input="onInput"
            @keyup.enter="performSearch"
            @confirm="performSearch"
            :focus="isPanelOpen"
          />
          <view 
            class="clear-btn" 
            @click="clearSearch" 
            v-if="inputValue"
          >
            <i class="fas fa-times"></i>
          </view>
          <view 
            class="search-action-btn" 
            @click="performSearch" 
            :class="{ disabled: loading }"
          >
            <i :class="loading ? 'fas fa-spinner fa-spin' : 'fas fa-arrow-right'"></i>
          </view>
        </view>
        
        <!-- 搜索提示 -->
        <view class="search-hints" v-if="showHints">
          <view class="hints-header">
            <i class="fas fa-lightbulb"></i>
            <text>搜索提示</text>
          </view>
          <view class="hints-grid">
            <view 
              v-for="hint in getSearchHints()" 
              :key="hint.text"
              class="hint-chip"
              @click="selectHint(hint)"
            >
              <i :class="hint.icon"></i>
              <text>{{ hint.text }}</text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 搜索结果 -->
      <view class="search-results-container" v-if="showResults">
        <view class="results-header">
          <text class="results-count">
            <i class="fas fa-layer-group"></i>
            共 {{ searchResults.length }} 个结果
          </text>
          <view class="clear-results-btn" @click="clearResults" v-if="searchResults.length">
            <i class="fas fa-times"></i>
            <text>清空</text>
          </view>
        </view>
        
        <!-- 图层提示 -->
        <view class="layer-hint" v-if="showLayerHint">
          <view class="hint-content">
            <i class="fas fa-exclamation-circle"></i>
            <view class="hint-text">
              <text>检测到业务数据关键词</text>
              <text class="hint-suggestion">请在右侧图层面板中开启 <text class="strong">{{ suggestedLayer }}</text> 图层</text>
            </view>
          </view>
        </view>
        
        <!-- 结果列表 -->
        <!-- #ifdef H5 -->
        <view class="results-list">
          <view 
            v-for="(result, index) in searchResults" 
            :key="`${result.type}-${index}`"
            class="result-item"
            :class="{
              'business-result': result.type === 'business',
              'poi-result': result.type === 'poi',
              'selected': selectedIndex === index
            }"
            @click="selectResult(result)"
            @touchstart="hoverResult(index)"
          >
            <view class="result-icon">
              <i :class="getResultIcon(result)"></i>
            </view>
            <view class="result-content">
              <text class="result-title">{{ getResultTitle(result) }}</text>
              <text class="result-subtitle" v-if="getResultSubtitle(result)">
                {{ getResultSubtitle(result) }}
              </text>
              <view class="result-meta">
                <text class="result-type">{{ getResultType(result) }}</text>
                <text class="result-coords" v-if="result.lat && result.lon">
                  {{ result.lat.toFixed(4) }}, {{ result.lon.toFixed(4) }}
                </text>
              </view>
            </view>
            <view class="result-action">
              <i class="fas fa-arrow-right"></i>
            </view>
          </view>
        </view>
        <!-- #endif -->
        <!-- #ifndef H5 -->
        <scroll-view class="results-list" scroll-y>
          <view 
            v-for="(result, index) in searchResults" 
            :key="`${result.type}-${index}`"
            class="result-item"
            :class="{
              'business-result': result.type === 'business',
              'poi-result': result.type === 'poi',
              'selected': selectedIndex === index
            }"
            @click="selectResult(result)"
            @touchstart="hoverResult(index)"
          >
            <view class="result-icon">
              <i :class="getResultIcon(result)"></i>
            </view>
            <view class="result-content">
              <text class="result-title">{{ getResultTitle(result) }}</text>
              <text class="result-subtitle" v-if="getResultSubtitle(result)">
                {{ getResultSubtitle(result) }}
              </text>
              <view class="result-meta">
                <text class="result-type">{{ getResultType(result) }}</text>
                <text class="result-coords" v-if="result.lat && result.lon">
                  {{ result.lat.toFixed(4) }}, {{ result.lon.toFixed(4) }}
                </text>
              </view>
            </view>
            <view class="result-action">
              <i class="fas fa-arrow-right"></i>
            </view>
          </view>
        </scroll-view>
        <!-- #endif -->
        
        <!-- 加载状态 -->
        <view class="loading-state" v-if="loading">
          <i class="fas fa-spinner fa-spin"></i>
          <text>搜索中...</text>
        </view>
        
        <!-- 无结果 -->
        <view class="no-results" v-if="!loading && searchResults.length === 0 && hasSearched">
          <i class="fas fa-search"></i>
          <text>未找到匹配的结果</text>
          <text class="no-results-hint">尝试搜索其他关键词或开启相关图层</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  searchResults: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  hasBusinessLayers: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'search', 'select', 'input', 'clear-results'])

const isPanelOpen = ref(false)
const inputValue = ref('')
const hasSearched = ref(false)
const selectedIndex = ref(-1)
const showLayerHint = ref(false)
const suggestedLayer = ref('')

const showHints = computed(() => {
  return inputValue.value && !hasSearched.value
})

const showResults = computed(() => {
  return hasSearched.value || props.searchResults.length > 0
})

watch(() => props.modelValue, (newVal) => {
  inputValue.value = newVal
})

watch(() => props.searchResults, () => {
  updateLayerHint()
})

const toggleSearchPanel = () => {
  isPanelOpen.value = !isPanelOpen.value
}

const closePanel = () => {
  isPanelOpen.value = false
}

const onInput = (e) => {
  // 兼容 H5 和 uni-app 的事件格式
  const value = e?.detail?.value || e?.target?.value || e?.target?.textContent || ''
  inputValue.value = value
  emit('update:modelValue', inputValue.value)
  emit('input', inputValue.value)
  hasSearched.value = false
}

const performSearch = () => {
  // 安全检查：确保 inputValue.value 存在且是字符串
  if (!inputValue.value || typeof inputValue.value !== 'string' || !inputValue.value.trim()) {
    return
  }
  hasSearched.value = true
  emit('search', inputValue.value.trim())
}

const clearSearch = () => {
  inputValue.value = ''
  emit('update:modelValue', '')
  emit('input', '')
  clearResults()
}

const clearResults = () => {
  hasSearched.value = false
  selectedIndex.value = -1
  emit('clear-results')
}

const getPlaceholder = () => {
  return props.hasBusinessLayers 
    ? '搜索业务数据 (如: HXB-001、 HXJ-001)' 
    : '搜索地点或POI，例如：公园、医院、学校'
}

const getSearchHints = () => {
  if (!inputValue.value) return []
  
  return [
    { text: '按回车搜索；若需搜索业务数据如行政区、界桩、标识牌、图斑，建议先叠加业务图层再进行查询', icon: 'fas fa-keyboard' }
  ]
}

const selectHint = (hint) => {
  if (hint.text.includes('按回车搜索')) {
    performSearch()
  }
}

const selectResult = (result) => {
  emit('select', result)
  closePanel()
}

const hoverResult = (index) => {
  selectedIndex.value = index
}

const getResultIcon = (result) => {
  if (result.type === 'business') {
    switch(result.layerId) {
      case 'cjxzq': return 'fas fa-landmark'
      case 'hxbsp': return 'fas fa-map-signs'
      case 'hxjz': return 'fas fa-map-marker-alt'
      case 'hxtb': return 'fas fa-draw-polygon'
      default: return 'fas fa-database'
    }
  }
  return 'fas fa-map-marker-alt'
}

const getResultTitle = (result) => {
  if (result.type === 'business') {
    const props = result.properties || {}
    if (props.XJQYMC) return props.XJQYMC
    if (props.BSPBH) return props.BSPBH
    if (props.JZKH) return props.JZKH
    if (props.HXMC) return props.HXMC
    return '业务数据'
  }
  return result.display_name ? result.display_name.split(',')[0] : ''
}

const getResultSubtitle = (result) => {
  if (result.type === 'business') {
    const props = result.properties || {}
    if (props.XJQYMC) return '村界行政区'
    if (props.BSPBH) return '红线标识牌'
    if (props.JZKH) return '红线界桩'
    if (props.HXMC) return '红线图斑'
    return '业务数据'
  }
  return result.display_name || ''
}

const getResultType = (result) => {
  if (result.type === 'business') {
    return '业务数据'
  }
  return '外部POI'
}

const updateLayerHint = () => {
  const businessResults = props.searchResults.filter(r => r.type === 'business')
  if (businessResults.length === 0) {
    showLayerHint.value = false
    return
  }
  
  const firstResult = businessResults[0]
  if (firstResult.layerId) {
    showLayerHint.value = true
    const layerNames = {
      'cjxzq': '村界行政区',
      'hxbsp': '红线标识牌',
      'hxjz': '红线界桩',
      'hxtb': '红线图斑'
    }
    suggestedLayer.value = layerNames[firstResult.layerId] || '业务图层'
  } else {
    showLayerHint.value = true
  }
}
</script>

<style scoped>
.search-container {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1200;
  width: 90%;
  max-width: 500px;
  pointer-events: none;
}

.search-container > * {
  pointer-events: auto;
}

.search-trigger {
  background: white;
  padding: 12px 20px;
  border-radius: 30px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
  border: 2px solid rgba(0, 0, 0, 0.15);
}

.search-trigger .fa-chevron-down {
  margin-left: auto;
  transition: transform 0.3s ease;
}

.search-trigger .fa-chevron-down.rotated {
  transform: rotate(180deg);
}

.trigger-text {
  font-size: 15px;
  font-weight: 500;
  color: #2c3e50;
  flex: 1;
}

.search-panel {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(76, 175, 80, 0.1);
  opacity: 0;
  visibility: hidden;
  transform: translateY(-10px);
  transition: all 0.3s ease;
  max-height: 0;
  overflow: hidden;
}

.search-panel.open {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
  max-height: 60vh;
  overflow: visible;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  border-bottom: 1px solid rgba(76, 175, 80, 0.1);
}

.panel-title {
  font-size: 16px;
  color: #2c3e50;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.close-panel-btn {
  background: #f5f5f5;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
}

.search-input-area {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 0 0 20px 20px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: white;
  border-radius: 15px;
  padding: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  border: 2px solid rgba(76, 175, 80, 0.1);
}

.input-icon {
  position: absolute;
  left: 15px;
  font-size: 16px;
  color: #999;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  padding: 14px 50px 14px 45px;
  font-size: 15px;
  background: transparent;
  color: #333;
}

.clear-btn {
  background: none;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  margin-right: 4px;
}

.search-action-btn {
  border: none;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4CAF50;
  background: rgba(76, 175, 80, 0.1);
}

.search-action-btn.disabled {
  background: #cccccc;
  color: #999;
}

.search-hints {
  margin-top: 12px;
}

.hints-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 13px;
  margin-bottom: 10px;
}

.hints-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hint-chip {
  background: rgba(76, 175, 80, 0.1);
  border: 1px solid rgba(76, 175, 80, 0.2);
  color: #2c6b2f;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.search-results-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-height: calc(60vh - 200px);
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #f8f9fa;
  border-top: 1px solid rgba(76, 175, 80, 0.1);
}

.results-count {
  color: #4CAF50;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

.clear-results-btn {
  background: none;
  border: 1px solid #ddd;
  color: #666;
  padding: 4px 12px;
  border-radius: 15px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.layer-hint {
  background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%);
  border: 1px solid #ffd54f;
  border-radius: 10px;
  margin: 15px 20px;
  padding: 12px;
}

.hint-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.hint-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  color: #5d4037;
}

.hint-suggestion {
  font-size: 12px;
}

.strong {
  color: #4CAF50;
  font-weight: 600;
}

.results-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 20px 20px;
  min-height: 0;
}

/* 自定义滚动条 */
.results-list::-webkit-scrollbar {
  width: 6px;
}

.results-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.results-list::-webkit-scrollbar-thumb {
  background: #666;
  border-radius: 10px;
}

.results-list::-webkit-scrollbar-thumb:hover {
  background: #45a049;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px;
  border-radius: 12px;
  margin-bottom: 8px;
  border: 2px solid rgba(76, 175, 80, 0.2);
  background: rgba(255, 255, 255, 0.95);
  transition: all 0.2s ease;
  cursor: pointer;
}

.result-item:hover {
  background: rgba(76, 175, 80, 0.05);
  border-color: rgba(76, 175, 80, 0.4);
  transform: translateX(-2px);
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.15);
}

.result-item:active {
  transform: scale(0.98);
}

.result-item.selected {
  background: rgba(76, 175, 80, 0.1);
  border-color: #4CAF50;
}

.result-item.business-result {
  border-left: 4px solid #45a049;
}

.result-item.poi-result {
  border-left: 4px solid #4CAF50;
}

.result-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 16px;
}

.result-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.result-title {
  font-weight: 600;
  color: #2c3e50;
  font-size: 15px;
}

.result-subtitle {
  font-size: 13px;
  color: #666;
}

.result-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 11px;
  margin-top: 4px;
}

.result-type {
  background: rgba(76, 175, 80, 0.1);
  color: #2c6b2f;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}

.result-coords {
  color: #888;
  font-family: monospace;
}

.result-action {
  color: #4CAF50;
  font-size: 18px;
}

.loading-state,
.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #666;
  gap: 12px;
}

.loading-state i,
.no-results i {
  font-size: 32px;
}

.no-results-hint {
  font-size: 13px;
  color: #888;
}
</style>