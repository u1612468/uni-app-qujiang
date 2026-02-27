<template>
  <view class="app-container">
    <AppHeader :title="'地图浏览'">
      <template #left>
        <view class="back-btn" @click="goBack" style="color: white; margin-right: 10px;">
          <i class="fas fa-arrow-left"></i>
        </view>
        <text class="header-title">地图浏览</text>
      </template>
   
      <template #right>
        <text class="coord-display">{{ currentCoords }}</text>
      </template>
    </AppHeader>

    <view class="main-content">
      <view class="map-container">
        <!-- #ifdef H5 -->
        <div id="map" ref="mapContainer"></div>
        <!-- #endif -->
        <!-- #ifndef H5 -->
        <view id="map" ref="mapContainer" class="map-placeholder">
          <text>地图功能仅在 H5 端可用</text>
        </view>
        <!-- #endif -->
        
        <!-- POI 搜索框（拆分为子组件） -->
        <MapSearch
          v-model="searchQuery"
          :searchResults="searchResults"
          :loading="searchLoading"
          :error="searchError"
          :hasBusinessLayers="hasBusinessLayers"
          @search="searchPOI"
          @select="selectPOI"
          @input="onSearchInput"
          @clear-results="clearSearchResults"
        />

        <!-- 工具栏 -->
        <view class="toolbar-container" :class="{ expanded: toolbarExpanded }">
          <!-- 初始状态下只有一个按钮 -->
          <view class="toolbar-btn toggle-btn" @click="toggleToolBar" v-if="!toolbarExpanded">
            <i class="fas fa-bars"></i>
          </view>

          <!-- 展开状态下显示所有按钮 -->
          <template v-if="toolbarExpanded">
            <view class="toolbar-btn" @click="activateDrawing">
              <i class="fas fa-draw-polygon" :style="isDrawing ? { color: '#4CAF50' } : {}"></i>
              <text>绘制</text>
            </view>
            <view class="toolbar-btn" @click="saveFeature">
              <i class="fas fa-save"></i>
              <text>保存</text>
            </view>
            <view class="toolbar-btn" @click="clearDrawings">
              <i class="fas fa-trash"></i>
              <text>删除</text>
            </view>
            <view class="toolbar-btn" @click="measureLength" :title="measuringDistance ? '停止测距' : '测量线段'">
              <i class="fas fa-ruler" :style="measuringDistance ? { color: '#4CAF50' } : {}"></i>
              <text>测距</text>
            </view>
            <view class="toolbar-btn" @click="measureArea" :title="measuringArea ? '停止测面积' : '测量面积'">
              <i class="fas fa-area-chart" :style="measuringArea ? { color: '#4CAF50' } : {}"></i>
              <text>测面</text>
            </view>
            <view class="toolbar-btn" @click="screenCut">
              <i class="fas fa-camera"></i>
              <text>截图</text>
            </view>
            <view class="toolbar-btn " @click="toggleToolBar">
              <i class="fas fa-chevron-right"></i>
              <text>收起</text>
            </view>
          </template>
        </view>
        
        <!-- 控件与面板（拆分为子组件） -->
        <MapControls
          @zoom-in="zoomIn"
          @zoom-out="zoomOut"
          @locate="locateMe"
          @toggle-layer="toggleLayerPanel"
        />

        <LayerPanel
          :visible="showLayerPanel"
          :currentMapType="currentMapType"
          :layers="layers"
          @close="toggleLayerPanel"
          @switch="switchMapType"
          @toggle="toggleLayerVisibility"
        />
        
        <!-- 测量信息面板 -->
        <view v-if="measureInfo" class="measure-info-panel">
          <view class="measure-header">
            <text class="measure-title">{{ measureInfo.type === 'distance' ? '距离测量' : '面积测量' }}</text>
            <view class="close-measure-btn" @click="clearMeasure">
              <i class="fas fa-times"></i>
            </view>
          </view>
          <view class="measure-content">
            <text v-if="measureInfo.type === 'distance'" class="measure-item">
              <i class="fas fa-ruler-combined"></i>
              <text class="measure-value">{{ measureInfo.distance.toFixed(2) }}米</text>
              <text class="measure-converted">({{ (measureInfo.distance/1000).toFixed(3) }}公里)</text>
            </text>
            <text v-if="measureInfo.type === 'area'" class="measure-item">
              <i class="fas fa-area-chart"></i>
              <text class="measure-value">{{ measureInfo.area.toFixed(2) }}㎡</text>
              <text class="measure-converted">({{ (measureInfo.area/10000).toFixed(3) }}公顷)</text>
            </text>
            <text class="measure-points">
              <i class="fas fa-map-marker-alt"></i>
              点数：{{ measureInfo.points }}
            </text>
          </view>
        </view>
        
        <!-- 绘制信息面板 -->
        <view v-if="drawInfo" class="draw-info-panel">
          <view class="draw-header">
            <text class="draw-title">{{ drawInfo.title }}</text>
            <view class="close-draw-btn" @click="clearDrawings">
              <i class="fas fa-times"></i>
            </view>
          </view>
          <view class="draw-content">
            <text v-if="drawInfo.area" class="draw-item">
              <i class="fas fa-area-chart"></i>
              <text class="draw-value">{{ drawInfo.area.toFixed(2) }}㎡</text>
              <text class="draw-converted">({{ (drawInfo.area/666.6666667).toFixed(3) }}亩)</text>
            </text>
            <text v-if="drawInfo.perimeter" class="draw-item">
              <i class="fas fa-ruler-combined"></i>
              <text class="draw-value">{{ drawInfo.perimeter.toFixed(2) }}米</text>
            </text>
            <text class="draw-points">
              <i class="fas fa-map-marker-alt"></i>
              点数：{{ drawInfo.points }}
            </text>
          </view>
          <view class="draw-actions">
            <view @click="saveFeature" class="action-btn save-btn">
              <i class="fas fa-save"></i> 保存
            </view>
          </view>
        </view>
        
        <!-- 搜索结果标记 -->
        <view v-if="searchMarker" class="search-marker-info">
          <view class="marker-content">
            <i class="fas fa-map-marker-alt"></i>
            <text>{{ searchMarkerTitle }}</text>
            <view class="close-marker-btn" @click="clearSearchMarker">
              <i class="fas fa-times"></i>
            </view>
          </view>
        </view>
      </view>
    </view>
    
  <BottomNav />
  </view>
</template>

<script>
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw/dist/leaflet.draw.css'
import 'leaflet-draw'
import html2canvas from 'html2canvas'
import * as turf from '@turf/turf'
import BottomNav from '@/components/common/BottomNav.vue'
import AppHeader from '@/components/common/AppHeader.vue'
import MapSearch from '@/components/map/MapSearch.vue'
import LayerPanel from '@/components/map/LayerPanel.vue'
import MapControls from '@/components/map/MapControls.vue'

export default {
  name: 'Map',
  components: {
    BottomNav,
    AppHeader,
    MapSearch,
    LayerPanel,
    MapControls
  },
  data() {
    return {
      map: null,
      _initMapRetry: 0,
      _maxInitRetries: 20, // 最多重试20次（2秒）
      currentMapType: 'vec',
      baseLayers: {},
      annotationLayers: {}, // 标注图层（注记图层）
      currentCoords: '正在定位...',
      measuringDistance: false,
      measuringArea: false,
      measureInfo: null,
      measurePoints: [],
      measureLine: null,
      measurePolygon: null,

// 工具栏相关
      toolbarExpanded: false,
      isDrawing: false,
      drawingMode: null,
      drawPoints: [],
      drawLayer: null,
      drawFeature: null,
      drawInfo: null,
      savedFeatures: [],
      featureCounter: 1,
      showLayerPanel: false,

// 搜索相关
      searchQuery: '',
      searchResults: [],
      searchLoading: false,
      searchError: '',
      searchMarker: null,
      searchMarkerTitle: '',
      searchMarkerLayer: null,
      
      // 导航相关
      routeLine: null,
      routeMarkers: [],
      userLocation: null,
      previousView: null, // 保存搜索前的视图状态
      

// 图层数据
      layers: [
  {
    id: 'cjxzq',
    name: '村界行政区',
    visible: false,
          color: '#1F293',
    icon: 'fas fa-landmark',
    description: '村级行政区域边界',
    layer: null,
    loaded: false
  },
  {
    id: 'hxbsp',
    name: '红线标识牌',
    visible: false,
    color: '#2196F3',
    icon: 'fas fa-map-signs',
    description: '生态保护红线标识牌',
    layer: null,
    loaded: false
  },
  {
    id: 'hxjz',
    name: '红线界桩',
    visible: false,
    color: '#9C27B0',
    icon: 'fas fa-map-marker-alt',
    description: '生态保护红线界桩',
    layer: null,
    loaded: false
  },
  {
    id: 'hxtb',
    name: '红线图斑',
    visible: false,
    color: '#4CAF50',
    icon: 'fas fa-draw-polygon',
    description: '生态保护红线图斑',
    layer: null,
    loaded: false
  }
      ],
      // 存储加载的GeoJSON数据
      geoJsonData: {
  cjxzq: null,
  hxbsp: null,
  hxjz: null,
  hxtb: null
      },

// 搜索配置
      searchConfig: {
  businessFields: {
    cjxzq: ['XJQYMC'],
    hxbsp: ['BSPBH', 'BSPNR'],
    hxjz: ['JZKH'],
    hxtb: ['HXMC', 'HXLX']
  },
  poiCache: new Map()
      }
    }
  },
  computed: {
    hasBusinessLayers() {
      return this.layers.some(layer => layer.loaded)
    }
  },
  mounted() {
    // #ifdef H5
    if (typeof window !== 'undefined') {
      window.vm = this;
      // 绑定窗口调整事件
      window.addEventListener('resize', this.onResize);
    }
    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', this.handleKeydown);
    }
    // #endif
    
    // 延迟初始化地图，确保 DOM 已渲染
    this.$nextTick(() => {
      // 给更多时间让样式生效
      setTimeout(() => {
        this.initMap()
        // 地图初始化后再加载图层
        if (this.map) {
          this.loadMapLayers()
        }
      }, 300)
    })
  },
  beforeDestroy() {
    if (this.map) {
      this.map.remove()
    }
    // #ifdef H5
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.onResize)
      delete window.vm;
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener('keydown', this.handleKeydown);
    }
    // #endif
  },
  methods: {
    initMap() {
      // 防止无限重试
      if (this._initMapRetry >= this._maxInitRetries) {
        console.error('地图初始化失败：超过最大重试次数')
        return
      }
      
      const container = this.$refs.mapContainer
      if (!container) {
        console.warn('地图容器未找到，延迟初始化', this._initMapRetry)
        this._initMapRetry++
        setTimeout(() => this.initMap(), 100)
        return
      }
      
      // 检查容器是否有尺寸（包括通过CSS设置的尺寸）
      const offsetHeight = container.offsetHeight || 0
      const clientHeight = container.clientHeight || 0
      // #ifdef H5
      let computedHeight = '0px'
      if (typeof window !== 'undefined' && window.getComputedStyle) {
        const computedStyle = window.getComputedStyle(container)
        computedHeight = computedStyle.height
      }
      // #endif
      const hasSize = offsetHeight > 0 || clientHeight > 0 || (computedHeight && computedHeight !== '0px' && computedHeight !== 'auto')
      
      if (!hasSize) {
        console.warn('地图容器没有尺寸，等待...', this._initMapRetry, {
          offsetHeight,
          clientHeight,
          computedHeight,
          parentHeight: container.parentElement?.offsetHeight
        })
        this._initMapRetry++
        setTimeout(() => this.initMap(), 100)
        return
      }
      
      // 重置重试计数
      this._initMapRetry = 0
      
      try {
        this.map = L.map(container, {
    zoomControl: false,
    attributionControl: false
  }).setView([28.8, 118.9], 11)
  
        this.initTiandituLayers()
        this.baseLayers.vec.addTo(this.map)
        // 添加矢量标注图层（基础图层注记）
        if (this.annotationLayers.cva) {
          this.annotationLayers.cva.addTo(this.map)
        }
        
        L.control.scale({ imperial: false }).addTo(this.map)
        
        // 确保地图尺寸正确
        setTimeout(() => {
          if (this.map) {
            this.map.invalidateSize()
          }
        }, 200)
        
        this.map.on('mousemove', (e) => {
          this.updateCoordDisplay(e.latlng)
        })
        
        this.map.on('click', (e) => {
          this.handleMapClick(e)
        })
        
        // 双击完成绘制
        this.map.on('dblclick', () => {
          if (this.measuringDistance || this.measuringArea) {
            this.clearMeasure()
          }
        })
        
        this.map.whenReady(() => {
          console.log('地图初始化完成')
        })
      } catch (error) {
        console.error('地图初始化失败:', error)
      }
    },
    // 加载所有业务图层
    async loadMapLayers() {
      try {
        // 并行加载所有图层
        await Promise.all([
          this.loadGeoJsonLayer('cjxzq'),
          this.loadGeoJsonLayer('hxbsp'),
          this.loadGeoJsonLayer('hxjz'),
          this.loadGeoJsonLayer('hxtb')
        ])
        
        console.log('所有图层加载完成')
      } catch (error) {
        console.error('图层加载失败:', error)
      }
    },
    
    // 加载单个GeoJSON图层
    async loadGeoJsonLayer(layerId) {
      if (!this.map) {
        console.warn('地图未初始化，无法加载图层')
        return
      }
      
      try {
        // GeoJSON files are stored under static/geojson/, served at /geojson/...
        // Vite publicDir is set to 'static', so files are served from root
        const url = `/geojson/${layerId}.geojson`
        
        let geoJsonData
        
        // #ifdef H5
        // H5 模式使用 fetch
        try {
          const response = await fetch(url)
          
          // 检查响应状态
          if (!response.ok) {
            console.warn(`图层文件 ${layerId}.geojson 不存在或无法访问 (${response.status})`)
            const layerConfig = this.layers.find(l => l.id === layerId)
            if (layerConfig) {
              layerConfig.description = '图层文件不存在'
              layerConfig.loaded = false
            }
            return
          }
          
          // 尝试解析 JSON，如果失败则检查是否是 HTML（404 页面）
          try {
            const text = await response.text()
            // 如果返回的是 HTML（通常是 404 页面），说明文件不存在
            if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
              console.warn(`图层文件 ${layerId}.geojson 不存在（返回了 HTML 页面）`)
              const layerConfig = this.layers.find(l => l.id === layerId)
              if (layerConfig) {
                layerConfig.description = '图层文件不存在'
                layerConfig.loaded = false
              }
              return
            }
            // 尝试解析为 JSON
            geoJsonData = JSON.parse(text)
          } catch (parseError) {
            console.error(`图层 ${layerId} 数据解析失败:`, parseError)
            const layerConfig = this.layers.find(l => l.id === layerId)
            if (layerConfig) {
              layerConfig.description = `图层数据格式错误: ${parseError.message || '未知错误'}`
              layerConfig.loaded = false
            }
            return
          }
        } catch (fetchError) {
          console.error(`加载图层 ${layerId} 失败:`, fetchError)
          const layerConfig = this.layers.find(l => l.id === layerId)
          if (layerConfig) {
            layerConfig.description = `图层加载失败: ${fetchError.message || '未知错误'}`
            layerConfig.loaded = false
          }
          return
        }
        // #endif
        
        // #ifndef H5
        // 小程序/App 端使用 uni.request
        geoJsonData = await new Promise((resolve, reject) => {
          uni.request({
      url: url,
            method: 'GET',
            success: (res) => {
              if (res.statusCode === 200) {
                resolve(res.data)
              } else {
                reject(new Error(`HTTP ${res.statusCode}`))
              }
            },
            fail: reject
          })
        })
        // #endif
        
        if (!geoJsonData || !geoJsonData.features) {
          console.warn(`图层 ${layerId} 数据格式错误`)
          const layerConfig = this.layers.find(l => l.id === layerId)
          if (layerConfig) {
            layerConfig.description = '图层数据格式错误'
          }
          return
        }
        
        this.geoJsonData[layerId] = geoJsonData
        
        // 创建Leaflet GeoJSON图层
        const geoJsonLayer = L.geoJSON(geoJsonData, {
          style: this.getLayerStyle(layerId),
          pointToLayer: layerId === 'hxbsp' || layerId === 'hxjz' ? this.createPointMarker(layerId) : undefined,
        onEachFeature: (feature, layer) => {
            this.bindPopup(feature, layer, layerId)
        }
      })
      
        // 找到对应的图层配置
        const layerConfig = this.layers.find(l => l.id === layerId)
      if (layerConfig) {
        layerConfig.layer = geoJsonLayer
        layerConfig.loaded = true
        
          // 如果图层默认可见，添加到地图
        if (layerConfig.visible) {
            this.map.addLayer(geoJsonLayer)
        }
      }
      
        console.log(`图层 ${layerId} 加载成功，包含 ${geoJsonData.features.length} 个要素`)
  } catch (error) {
    console.error(`加载图层 ${layerId} 失败:`, error)
        // 如果文件不存在，不显示该图层
        const layerConfig = this.layers.find(l => l.id === layerId)
    if (layerConfig) {
      layerConfig.visible = false
          layerConfig.loaded = false
          layerConfig.description = `图层加载失败: ${error.message || '未知错误'}`
    }
  }
    },

    // 获取图层样式
    getLayerStyle(layerId) {
  const styles = {
    cjxzq: {
      color: '#374151',
      weight: 0.8,
      opacity: 0.9,
      fillColor: '#374151',
      fillOpacity: 0.04
    },
    hxtb: {
      color: '#4CAF50',
      weight: 2,
      opacity: 0.6,
      fillColor: '#4CAF50',
      fillOpacity: 0.2
    },
    default: {
      color: '#666',
      weight: 2,
      opacity: 0.7
    }
  }
  
  return styles[layerId] || styles.default
    },

    // 创建点标记（用于标识牌和界桩）
    createPointMarker(layerId) {
  return (feature, latlng) => {
    const iconColor = layerId === 'hxbsp' ? '#2196F3' : '#9C27B0'
    const iconType = layerId === 'hxbsp' ? 'map-signs' : 'map-marker-alt'
    
    return L.marker(latlng, {
      icon: L.divIcon({
        className: `${layerId}-marker`,
        html: `
          <div style="
            background: ${iconColor};
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
          ">
            <i class="fas fa-${iconType}"></i>
          </div>
        `,
        iconSize: [24, 24]
      })
    })
  }
    },

    // 绑定弹窗信息
    bindPopup(feature, layer, layerId) {
  const properties = feature.properties
  let content = `<div style="min-width: 200px; max-width: 300px;">`
  
        // 根据图层类型显示不同的信息
  switch(layerId) {
          case 'cjxzq': // 村界行政区
      content += `<h4 style="margin: 0 0 10px 0;">
        <i class="fas fa-landmark"></i> 村界行政区
      </h4>`
      if (properties.XJQYMC) content += `<p><b>名称:</b> ${properties.XJQYMC}</p>`
      if (properties.Shape_Area) content += `<p><b>面积:</b> ${(properties.Shape_Area / 666.6666667).toFixed(3)} 亩</p>`
      break
          case 'hxbsp': // 红线标识牌
      content += `<h4 style="margin: 0 0 8px 0;">
        <i class="fas fa-map-signs"></i> 红线标识牌
      </h4>`
      if (properties.BSPNR) content += `<p style="margin: 0 0 5px 0;"><b>描述:</b> ${properties.BSPNR}</p>`
      if (properties.JD && properties.WD) content += `<p style="margin: 0 0 5px 0;"><b>位置:</b> ${properties.JD.toFixed(6)}, ${properties.WD.toFixed(6)}</p>`
      if (properties.BSPBH) {
              const bspbh = properties.BSPBH.trim();
            
              let imagesHtml = '';
        
        for (let i = 1; i <= 2; i++) {
                let imagePath = `/picture/bsp/${bspbh}/${bspbh}-${i}.jpg`;
                
                  const imageAlt = `${bspbh}-${i}`;
          
          imagesHtml += `
            <div class="image-container" style="margin-bottom: 8px; min-height: 120px; background: #f5f5f5; display: flex; align-items: center; justify-content: center;">
                <img 
                  src="${imagePath}" 
                  alt="${imageAlt}"
                  class="popup-image"
                style="max-width: 100%; max-height: 150px; border: 1px solid #ddd; object-fit: contain;"
                  onerror="this.style.display='none'; this.parentElement.innerHTML='<div style=\\'padding: 20px; color: #999;\\'>图片加载失败</div>'"
                />
            </div>
                  `;
        }
        
        if (imagesHtml) {
          content += `
            <div class="images-section" style="margin-top: 10px;">
              <p style="margin: 0 0 5px 0;"><b>现场照片:</b></p>
              <div class="images-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                ${imagesHtml}
              </div>
            </div>
                  `;
        }
      }
      if (properties.MSRQ) {
        const date = new Date(properties.MSRQ)
        content += `<p style="margin: 10px 0 0 0;"><b>埋设日期:</b> ${date.toLocaleDateString()}</p>`
      }
      break
            
          case 'hxjz': // 红线界桩
      content += `<h4 style="margin: 0 0 8px 0;">
        <i class="fas fa-map-marker-alt"></i> 红线界桩
      </h4>`
      if (properties.JD && properties.WD) content += `<p style="margin: 0 0 5px 0;"><b>位置:</b> ${properties.JD.toFixed(6)}, ${properties.WD.toFixed(6)}</p>`
      if (properties.JZKH) {
              const jzkh = properties.JZKH.trim();

              let imagesHtml = '';
        
        for (let i = 1; i <= 2; i++) {
                  let imagePath = `/picture/jz/${jzkh}/${jzkh}-${i}.jpg`;
                  const imageAlt = `${jzkh}-${i}`;
          
          imagesHtml += `
            <div class="image-container" style="margin-bottom: 8px; min-height: 120px; background: #f5f5f5; display: flex; align-items: center; justify-content: center;">
                <img 
                  src="${imagePath}" 
                  alt="${imageAlt}"
                  class="popup-image"
                  style="max-width: 100%; max-height: 150px; border: 1px solid #ddd; object-fit: contain;"
                  onerror="this.style.display='none'; this.parentElement.innerHTML='<div style=\\'padding: 20px; color: #999;\\'>图片加载失败</div>'"
                />
            </div>
                  `;
        }
        
        if (imagesHtml) {
          content += `
            <div class="images-section" style="margin-top: 10px;">
              <p style="margin: 0 0 5px 0;"><b>现场照片:</b></p>
              <div class="images-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                ${imagesHtml}
              </div>
            </div>
                  `;
        }
      }
      if (properties.MSRQ) {
        const date = new Date(properties.MSRQ)
        content += `<p style="margin: 10px 0 0 0;"><b>埋设日期:</b> ${date.toLocaleDateString()}</p>`
      }
      break
            
          case 'hxtb': // 红线图斑
      content += `<h4 style="margin: 0 0 10px 0;">
        <i class="fas fa-draw-polygon"></i> 红线图斑
      </h4>`
      if (properties.HXMC) content += `<p style="margin: 0 0 5px 0;"><b>红线名称:</b> ${properties.HXMC}</p>`
      if (properties.HXLX) content += `<p style="margin: 0 0 5px 0;"><b>红线类型:</b> ${properties.HXLX}</p>`
      if (properties.Shape_Area) content += `<p style="margin: 0;"><b>面积:</b> ${(properties.Shape_Area / 666.6666667).toFixed(3)} 亩</p>`
      break
  }
  
  // 获取要素中心点坐标
  let centerLat = null
  let centerLon = null
  let featureName = ''
  
  // 从属性中获取坐标
  if (properties.JD && properties.WD) {
    centerLat = properties.WD
    centerLon = properties.JD
  } else if (properties.lat && properties.lon) {
    centerLat = properties.lat
    centerLon = properties.lon
  } else if (feature.geometry) {
    // 计算几何中心点
    try {
      const centerTurf = turf.center(feature)
      if (centerTurf && centerTurf.geometry && centerTurf.geometry.coordinates) {
        centerLon = centerTurf.geometry.coordinates[0]
        centerLat = centerTurf.geometry.coordinates[1]
      }
    } catch (e) {
      console.warn('计算中心点失败:', e)
    }
  }
  
  // 获取要素名称
  if (properties.XJQYMC) featureName = properties.XJQYMC
  else if (properties.BSPBH) featureName = properties.BSPBH
  else if (properties.JZKH) featureName = properties.JZKH
  else if (properties.HXMC) featureName = properties.HXMC
  else featureName = '该位置'
  
  // 如果有坐标，添加导航按钮
  if (centerLat !== null && centerLon !== null) {
    content += `
      <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee;">
        <button 
          onclick="event.stopPropagation(); window.vm.navigateToLocation(${centerLat}, ${centerLon}, '${featureName.replace(/'/g, "\\'")}')"
          style="
            width: 100%;
            padding: 8px 12px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            transition: background 0.2s;
          "
          onmouseover="this.style.background='#45a049'"
          onmouseout="this.style.background='#4CAF50'"
        >
          <i class="fas fa-route"></i> 导航到此位置
        </button>
      </div>
    `
  }
  
  content += `</div>`
          
  layer.bindPopup(content)
        },

    onResize() {
      if (this.map) {
    setTimeout(() => {
          this.map.invalidateSize()
    }, 100)
  }
    },
    
    initTiandituLayers() {
      // 使用天地图 WMTS 切片（Web Mercator / TILEMATRIXSET=w）
      // 确保所有图层使用相同的坐标系：Web Mercator (EPSG:3857)
      const tk = '86234145d7b24f2717adbe8fd1fde585'

      // 矢量底图（Web Mercator坐标系）
      this.baseLayers.vec = L.tileLayer(
        'https://t0.tianditu.gov.cn/vec_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILECOL={x}&TILEROW={y}&tk=' + tk,
        {
          subdomains: ['0', '1', '2', '3'],
          maxZoom: 19,
          minZoom: 3,
          attribution: '© 天地图'
        }
      )

      // 影像底图（Web Mercator坐标系）
      this.baseLayers.img = L.tileLayer(
        'https://t0.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILECOL={x}&TILEROW={y}&tk=' + tk,
        {
          subdomains: ['0', '1', '2', '3'],
          maxZoom: 19,
          minZoom: 3,
          attribution: '© 天地图'
        }
      )

      // 矢量标注图层（基础图层注记）- 用于矢量底图
      // cva: 矢量地图标注，包含地名、道路名称等注记信息
      this.annotationLayers.cva = L.tileLayer(
        'https://t0.tianditu.gov.cn/cva_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cva&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILECOL={x}&TILEROW={y}&tk=' + tk,
        {
          subdomains: ['0', '1', '2', '3'],
          maxZoom: 19,
          minZoom: 3,
          attribution: '© 天地图',
          pane: 'overlayPane' // 确保标注图层在底图之上
        }
      )

      // 影像标注图层（基础图层注记）- 用于影像底图
      // cia: 影像地图标注，包含地名、道路名称等注记信息
      this.annotationLayers.cia = L.tileLayer(
        'https://t0.tianditu.gov.cn/cia_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cia&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILECOL={x}&TILEROW={y}&tk=' + tk,
        {
          subdomains: ['0', '1', '2', '3'],
          maxZoom: 19,
          minZoom: 3,
          attribution: '© 天地图',
          pane: 'overlayPane' // 确保标注图层在底图之上
        }
      )
    },
    
    // 工具栏方法
    toggleToolBar() {
      this.toolbarExpanded = !this.toolbarExpanded
    },
    
    // 图层控制方法
    toggleLayerVisibility(layer) {
      if (!this.map) {
        console.warn('地图未初始化，无法切换图层')
    return
  }
  
      layer.visible = !layer.visible
      
      if (layer.layer) {
        if (layer.visible) {
          if (!this.map.hasLayer(layer.layer)) {
            this.map.addLayer(layer.layer)
          }
          
          // 如果图层数据尚未加载，尝试加载
          if (!layer.layer.getLayers().length && this.geoJsonData[layer.id]) {
            this.loadGeoJsonLayer(layer.id)
          }
        } else {
          if (this.map.hasLayer(layer.layer)) {
            this.map.removeLayer(layer.layer)
          }
        }
      }
      
      // 更新图层列表
      this.layers = [...this.layers]
    },
    
    // 切换地图类型
    switchMapType(type) {
      if (!this.map) {
        console.warn('地图未初始化，无法切换地图类型')
        return
      }
      
      if (this.currentMapType === type) return
      
      // 移除当前底图和对应的标注图层
      if (this.baseLayers[this.currentMapType] && this.map.hasLayer(this.baseLayers[this.currentMapType])) {
        this.map.removeLayer(this.baseLayers[this.currentMapType])
      }
      
      // 移除当前标注图层
      const currentAnnotationType = this.currentMapType === 'vec' ? 'cva' : 'cia'
      if (this.annotationLayers[currentAnnotationType] && this.map.hasLayer(this.annotationLayers[currentAnnotationType])) {
        this.map.removeLayer(this.annotationLayers[currentAnnotationType])
      }
      
      // 添加新的底图
      if (this.baseLayers[type]) {
        this.map.addLayer(this.baseLayers[type])
        this.currentMapType = type
        
        // 添加对应的标注图层（基础图层注记）
        const annotationType = type === 'vec' ? 'cva' : 'cia'
        if (this.annotationLayers[annotationType]) {
          this.map.addLayer(this.annotationLayers[annotationType])
        }
      } else {
        console.warn('地图类型不存在:', type)
      }
    },
    
    activateDrawing() {
      if (this.isDrawing) {
        this.isDrawing = false
        this.drawingMode = null
      } else {
        // 使用多边形绘制模式（点击添加顶点，双击或保存结束）
        this.isDrawing = true
        this.drawingMode = 'polygon'
        this.clearCurrentMeasurements()
        this.showLayerPanel = false
      }
    },
    
    toggleLayerPanel() {
      this.showLayerPanel = !this.showLayerPanel
    },
    
    // 搜索相关方法
    onSearchInput(value) {
      this.searchQuery = value
      if (!value.trim()) {
        this.clearSearchResults()
      }
    },
    
    async searchPOI(query) {
      const q = (query || this.searchQuery || '').trim()
      if (!q) {
        this.searchResults = []
        return
      }
      
      if (!this.map) {
        console.warn('地图未初始化，无法搜索')
        this.searchError = '地图未加载完成，请稍候'
        return
      }
      
      this.searchLoading = true
      this.searchError = ''
      this.searchResults = []
      
      try {
        // 智能搜索：先搜索业务数据，再搜索外部POI
        const businessResults = await this.searchBusinessData(q)
        const poiResults = await this.searchExternalPOI(q)
        
        // 合并结果，业务数据在前
        this.searchResults = [...businessResults, ...poiResults]
        
        if (this.searchResults.length === 0) {
          this.searchError = '未找到相关结果'
        }
        
        // 如果有业务结果但对应图层未加载，会在组件中显示提示
  } catch (error) {
    console.error('搜索失败:', error)
        this.searchError = '搜索失败，请稍后重试: ' + (error.message || '未知错误')
  } finally {
        this.searchLoading = false
  }
    },

    async searchBusinessData(query) {
      if (!this.hasBusinessLayers) return []
  
  const results = []
  const lowerQuery = query.toLowerCase()
  
      // 遍历所有已加载的业务图层
      for (const layer of this.layers) {
        if (!layer.loaded || !this.geoJsonData[layer.id]) continue
    
        const features = this.geoJsonData[layer.id].features || []
        const searchFields = this.searchConfig.businessFields[layer.id] || []
    
    for (const feature of features) {
      const properties = feature.properties || {}
      let matched = false
      
          // 检查所有搜索字段
      for (const field of searchFields) {
        const value = properties[field]
        if (value && value.toString().toLowerCase().includes(lowerQuery)) {
          matched = true
          break
        }
      }
      
      if (matched) {
            // 获取要素的中心点
        let center
        if (feature.geometry.type === 'Point') {
          center = feature.geometry.coordinates
        } else {
              // 使用Turf.js计算面或多边形的中心点
          try {
            const turfFeature = turf.feature(feature.geometry)
            const centerTurf = turf.center(turfFeature)
            center = centerTurf.geometry.coordinates
          } catch (e) {
            console.warn('计算中心点失败:', e)
            continue
          }
        }
        
        results.push({
          type: 'business',
          layerId: layer.id,
          layerName: layer.name,
          properties: properties,
          lat: center[1],
          lon: center[0],
          feature: feature,
          geometryType: feature.geometry.type
        })
        
            // 限制结果数量
        if (results.length >= 20) break
      }
    }
    
    if (results.length >= 20) break
  }
  
  return results
    },
    
    async searchExternalPOI(query) {
      if (!this.map) {
        return []
}

  const cacheKey = `poi_${query}`
      if (this.searchConfig.poiCache.has(cacheKey)) {
        return this.searchConfig.poiCache.get(cacheKey)
  }
  
  try {
    // 第三方POI搜索服务API密钥
    const POI_API_KEY = '44a98f315de114539efd492c4dbcb655'
    
        // 获取当前地图中心坐标
        const center = this.map.getCenter()
        
        const url = `https://restapi.amap.com/v3/place/text?key=${POI_API_KEY}&keywords=${encodeURIComponent(query)}&city=全国&location=${center.lng},${center.lat}&offset=10&page=1&extensions=base`
        
        let data
    // #ifdef H5
        const res = await fetch(url)
        if (!res.ok) {
          console.warn('POI搜索请求失败:', res.status)
          return []
        }
        data = await res.json()
    // #endif
        
    // #ifndef H5
        data = await new Promise((resolve, reject) => {
          uni.request({
            url: url,
            method: 'GET',
            success: (res) => {
              if (res.statusCode === 200) {
                resolve(res.data)
              } else {
                reject(new Error(`HTTP ${res.statusCode}`))
              }
            },
            fail: reject
          })
        })
    // #endif
    
        if (data && data.status === '1' && data.pois && Array.isArray(data.pois)) {
      const results = data.pois.map(poi => {
        // POI API返回的是GCJ02坐标，需要转换为WGS84以匹配天地图底图
        const gcjLat = parseFloat((poi.location || '0,0').split(',')[1]) || 0
        const gcjLon = parseFloat((poi.location || '0,0').split(',')[0]) || 0
        const [wgsLat, wgsLon] = this.gcj02ToWgs84(gcjLat, gcjLon)
        
        return {
        type: 'poi',
            display_name: poi.name || '',
            lat: wgsLat,
            lon: wgsLon,
            address: poi.address || '',
            pname: poi.pname || '',
            cityname: poi.cityname || '',
            adname: poi.adname || '',
            poiType: poi.type || '',
            typecode: poi.typecode || ''
          }
      })
          
          this.searchConfig.poiCache.set(cacheKey, results)
      return results
    }
    
    return []
  } catch (err) {
    console.error('POI搜索失败:', err)
    return []
  }
    },

    selectPOI(result) {
  if (!result) return
  
      // 清除之前的标记
      this.clearSearchMarker()
  
  if (result.type === 'business') {
        // 业务数据定位
        this.handleBusinessResult(result)
  } else {
        // 外部POI定位
        this.handlePOIResult(result)
  }
    },

    handleBusinessResult(result) {
  const lat = result.lat
  const lon = result.lon
  
      // 定位到中心点
      this.map.setView([lat, lon], result.geometryType === 'Point' ? 16 : 14)
  
      // 创建标记
      this.searchMarker = L.marker([lat, lon], {
    icon: L.divIcon({
      className: 'business-marker',
      html: `
        <div style="
          background: #2196F3;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 14px;
          font-weight: bold;
        ">
              <i class="${this.getLayerIcon(result.layerId)}"></i>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    })
      }).addTo(this.map)
  
      // 添加弹窗
      const title = this.getResultTitle(result)
      this.searchMarkerTitle = title
  
  let popupContent = `<div style="min-width: 200px; max-width: 300px;">
    <h4 style="margin: 0 0 10px 0; color: #2196F3;">
          <i class="${this.getLayerIcon(result.layerId)}"></i> ${result.layerName}
    </h4>
    <p><b>名称:</b> ${title}</p>`
  
  if (result.properties.Shape_Area) {
    popupContent += `<p><b>面积:</b> ${(result.properties.Shape_Area / 666.6666667).toFixed(2)} 亩</p>`
  }
  
  if (result.properties.HXLX) {
    popupContent += `<p><b>类型:</b> ${result.properties.HXLX}</p>`
  }
  
  if (result.properties.MSRQ) {
    const date = new Date(result.properties.MSRQ)
    popupContent += `<p><b>日期:</b> ${date.toLocaleDateString()}</p>`
  }
  
  // 添加导航按钮
  popupContent += `
    <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee;">
      <button 
        onclick="event.stopPropagation(); window.vm.navigateToLocation(${lat}, ${lon}, '${title.replace(/'/g, "\\'")}')"
        style="
          width: 100%;
          padding: 8px 12px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: background 0.2s;
        "
        onmouseover="this.style.background='#45a049'"
        onmouseout="this.style.background='#4CAF50'"
      >
        <i class="fas fa-route"></i> 导航到此位置
      </button>
    </div>
  `
  
  popupContent += `</div>`
  
      // 保存当前视图状态
      if (this.map) {
        this.previousView = {
          center: this.map.getCenter(),
          zoom: this.map.getZoom()
        }
      }
  
      this.searchMarker.bindPopup(popupContent).openPopup()
  
      // 如果需要，确保对应图层可见
      const layer = this.layers.find(l => l.id === result.layerId)
  if (layer && !layer.visible) {
    layer.visible = true
    if (layer.layer) {
          this.map.addLayer(layer.layer)
    }
  }
    },

    handlePOIResult(result) {
  const lat = result.lat
  const lon = result.lon
      this.map.setView([lat, lon], 16)
  
      this.searchMarker = L.marker([lat, lon], {
    icon: L.divIcon({
      className: 'poi-marker',
      html: `
        <div style="
          background: #4CAF50;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 14px;
          font-weight: bold;
        ">
          <i class="fas fa-map-marker-alt"></i>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    })
      }).addTo(this.map)
    
    // 创建弹窗内容，包含导航按钮
    const popupContent = `
      <div style="min-width: 200px; max-width: 300px;">
        <h4 style="margin: 0 0 10px 0; color: #4CAF50;">
          <i class="fas fa-map-marker-alt"></i> ${result.display_name.split(',')[0]}
        </h4>
        <p><b>位置:</b> ${lat.toFixed(6)}, ${lon.toFixed(6)}</p>
        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee;">
          <button 
            onclick="event.stopPropagation(); window.vm.navigateToLocation(${lat}, ${lon}, '${result.display_name.split(',')[0].replace(/'/g, "\\'")}')"
            style="
              width: 100%;
              padding: 8px 12px;
              background: #4CAF50;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 500;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 6px;
              transition: background 0.2s;
            "
            onmouseover="this.style.background='#45a049'"
            onmouseout="this.style.background='#4CAF50'"
          >
            <i class="fas fa-route"></i> 导航到此位置
          </button>
        </div>
      </div>
    `
    
    // 保存当前视图状态
    if (this.map) {
      this.previousView = {
        center: this.map.getCenter(),
        zoom: this.map.getZoom()
      }
    }
    
    this.searchMarker
      .bindPopup(popupContent)
      .openPopup()
  
      this.searchMarkerTitle = result.display_name.split(',')[0]
    },

    getLayerIcon(layerId) {
  switch(layerId) {
    case 'cjxzq': return 'fas fa-landmark'
    case 'hxbsp': return 'fas fa-map-signs'
    case 'hxjz': return 'fas fa-map-marker-alt'
    case 'hxtb': return 'fas fa-draw-polygon'
    default: return 'fas fa-database'
  }
    },

    getResultTitle(result) {
  if (result.type === 'business') {
    const props = result.properties
    if (props.XJQYMC) return props.XJQYMC
    if (props.BSPBH) return props.BSPBH
    if (props.JZKH) return props.JZKH
    if (props.HXMC) return props.HXMC
    return '业务数据'
  }
      return result.display_name.split(',')[0]
    },
    
    clearSearchResults() {
      this.searchResults = []
      this.searchError = ''
      this.clearSearchMarker()
    },
    
    clearSearchMarker() {
      // 清除路径
      this.clearRoute()
      
      if (this.searchMarker) {
        this.map.removeLayer(this.searchMarker)
        this.searchMarker = null
        this.searchMarkerTitle = ''
      }
      
      // 恢复之前的视图
      if (this.previousView && this.map) {
        this.map.setView(this.previousView.center, this.previousView.zoom)
        this.previousView = null
      }
    },
    
    // 导航到指定位置
    // GCJ02转WGS84坐标转换（GCJ02坐标系转WGS84坐标系）
    gcj02ToWgs84(gcjLat, gcjLon) {
      const a = 6378245.0
      const ee = 0.00669342162296594323
      
      let dLat = this.transformLat(gcjLon - 105.0, gcjLat - 35.0)
      let dLon = this.transformLon(gcjLon - 105.0, gcjLat - 35.0)
      const radLat = gcjLat / 180.0 * Math.PI
      let magic = Math.sin(radLat)
      magic = 1 - ee * magic * magic
      const sqrtMagic = Math.sqrt(magic)
      dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * Math.PI)
      dLon = (dLon * 180.0) / (a / sqrtMagic * Math.cos(radLat) * Math.PI)
      const wgsLat = gcjLat - dLat
      const wgsLon = gcjLon - dLon
      
      return [wgsLat, wgsLon]
    },
    
    // WGS84转GCJ02坐标转换（WGS84坐标系转GCJ02坐标系）
    wgs84ToGcj02(wgsLat, wgsLon) {
      const a = 6378245.0
      const ee = 0.00669342162296594323
      
      let dLat = this.transformLat(wgsLon - 105.0, wgsLat - 35.0)
      let dLon = this.transformLon(wgsLon - 105.0, wgsLat - 35.0)
      const radLat = wgsLat / 180.0 * Math.PI
      let magic = Math.sin(radLat)
      magic = 1 - ee * magic * magic
      const sqrtMagic = Math.sqrt(magic)
      dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * Math.PI)
      dLon = (dLon * 180.0) / (a / sqrtMagic * Math.cos(radLat) * Math.PI)
      const gcjLat = wgsLat + dLat
      const gcjLon = wgsLon + dLon
      
      return [gcjLat, gcjLon]
    },
    
    transformLat(lon, lat) {
      let ret = -100.0 + 2.0 * lon + 3.0 * lat + 0.2 * lat * lat + 0.1 * lon * lat + 0.2 * Math.sqrt(Math.abs(lon))
      ret += (20.0 * Math.sin(6.0 * lon * Math.PI) + 20.0 * Math.sin(2.0 * lon * Math.PI)) * 2.0 / 3.0
      ret += (20.0 * Math.sin(lat * Math.PI) + 40.0 * Math.sin(lat / 3.0 * Math.PI)) * 2.0 / 3.0
      ret += (160.0 * Math.sin(lat / 12.0 * Math.PI) + 320 * Math.sin(lat * Math.PI / 30.0)) * 2.0 / 3.0
      return ret
    },
    
    transformLon(lon, lat) {
      let ret = 300.0 + lon + 2.0 * lat + 0.1 * lon * lon + 0.1 * lon * lat + 0.1 * Math.sqrt(Math.abs(lon))
      ret += (20.0 * Math.sin(6.0 * lon * Math.PI) + 20.0 * Math.sin(2.0 * lon * Math.PI)) * 2.0 / 3.0
      ret += (20.0 * Math.sin(lon * Math.PI) + 40.0 * Math.sin(lon / 3.0 * Math.PI)) * 2.0 / 3.0
      ret += (150.0 * Math.sin(lon / 12.0 * Math.PI) + 300.0 * Math.sin(lon / 30.0 * Math.PI)) * 2.0 / 3.0
      return ret
    },
    
    navigateToLocation(lat, lon, name) {
      if (this.map) {
        this.map.closePopup()
      }
      uni.showToast({
        title: '正在获取位置...',
        icon: 'loading',
        duration: 2000
      })
      // #ifdef H5
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            // H5 环境中 uni.hideToast 可能不存在，使用 try-catch
            try {
              if (typeof uni !== 'undefined' && uni.hideToast) {
                uni.hideToast()
              }
            } catch (e) {
              // 忽略错误
            }
            const startLat = position.coords.latitude
            const startLon = position.coords.longitude
            this.userLocation = { lat: startLat, lon: startLon }
            this.planRoute(startLat, startLon, lat, lon, name)
          },
          (error) => {
            // H5 环境中 uni.hideToast 可能不存在，使用 try-catch
            try {
              if (typeof uni !== 'undefined' && uni.hideToast) {
                uni.hideToast()
              }
            } catch (e) {
              // 忽略错误
            }
            console.error('获取当前位置失败:', error)
            // 显示位置权限提示弹窗
            this.showLocationPermissionDialog()
          },
          {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 60000
          }
        )
      } else {
        // 浏览器不支持定位，显示提示
        this.showLocationPermissionDialog()
      }
      // #endif
      // #ifndef H5
      // App端使用 uni.getLocation
      // 注意：App端获取的是GCJ02坐标，需要转换为WGS84以匹配天地图底图
      let _this = this
      uni.getLocation({
        type: 'gcj02',
        success: (res) => {
          const gcjLat = res.latitude
          const gcjLon = res.longitude
          // 将GCJ02转换为WGS84
          const [wgsLat, wgsLon] = _this.gcj02ToWgs84(gcjLat, gcjLon)
          _this.userLocation = { lat: wgsLat, lon: wgsLon }
          // 目标坐标也需要检查，如果传入的是GCJ02也需要转换
          // 这里假设目标坐标lat, lon已经是WGS84（从地图点击或搜索获取）
          _this.planRoute(wgsLat, wgsLon, lat, lon, name)
        },
        fail: (err) => {
          console.error('getLocation error', err)
          // 显示位置权限提示弹窗
          _this.showLocationPermissionDialog()
        }
      })
      // #endif
    },
    
    // 路径规划（使用实际路径规划服务）
    planRoute(startLat, startLon, endLat, endLon, name) {
      // 清除之前的路径
      this.clearRoute()
      
      console.log('开始路径规划:', { startLat, startLon, endLat, endLon, name })
      
      // 使用OSRM免费路径规划服务
      this.planRouteWithOSRM(startLat, startLon, endLat, endLon, name)
    },
    
    // 使用OSRM进行路径规划
    planRouteWithOSRM(startLat, startLon, endLat, endLon, name) {
      console.log('使用OSRM进行路径规划:', { startLat, startLon, endLat, endLon, name })
      // OSRM使用WGS84坐标系，天地图底图也使用WGS84（Leaflet自动投影到Web Mercator）
      // 如果输入坐标是GCJ02（从App端获取），需要先转换为WGS84
      let wgsStartLat = startLat
      let wgsStartLon = startLon
      let wgsEndLat = endLat
      let wgsEndLon = endLon
      
      // 检查坐标是否需要转换（如果是从App端获取的GCJ02坐标）
      // 这里假设如果坐标明显不在WGS84范围内，可能是GCJ02
      // 更准确的做法是根据数据来源判断，但这里简化处理
      // 实际上，如果是从navigator.geolocation获取的，已经是WGS84
      // 如果是从uni.getLocation(type: 'gcj02')获取的，需要转换
      
      const url = `https://router.project-osrm.org/route/v1/driving/${wgsStartLon},${wgsStartLat};${wgsEndLon},${wgsEndLat}?overview=full&geometries=geojson`
      
      console.log('OSRM请求URL:', url)
      
      fetch(url)
        .then(response => {
          console.log('OSRM响应状态:', response.status)
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          return response.json()
        })
        .then(data => {
          console.log('OSRM响应数据:', data)
          if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
            const route = data.routes[0]
            const geometry = route.geometry
            
            // OSRM返回的是WGS84坐标，可以直接使用（Leaflet会自动投影到Web Mercator）
            const routePoints = []
            if (geometry.type === 'LineString' && geometry.coordinates) {
              geometry.coordinates.forEach(coord => {
                // OSRM返回 [lng, lat] 格式，WGS84坐标系
                const wgsLat = coord[1]
                const wgsLon = coord[0]
                // 直接使用WGS84坐标，Leaflet会自动处理
                routePoints.push([wgsLat, wgsLon])
              })
            }
            
            if (routePoints.length > 0) {
              this.routeLine = L.polyline(routePoints, {
                color: '#4CAF50',
                weight: 5,
                opacity: 0.8,
                smoothFactor: 1
              }).addTo(this.map)
              
              // 起点和终点直接使用WGS84坐标
              const startMarker = L.marker([wgsStartLat, wgsStartLon], {
                icon: L.divIcon({
                  className: 'route-start-marker',
                  html: '<div style="background: #2196F3; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>',
                  iconSize: [20, 20]
                })
              }).addTo(this.map)
              startMarker.bindPopup('起点').openPopup()
              
              const endMarker = L.marker([wgsEndLat, wgsEndLon], {
                icon: L.divIcon({
                  className: 'route-end-marker',
                  html: '<div style="background: #FF5722; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>',
                  iconSize: [20, 20]
                })
              }).addTo(this.map)
              endMarker.bindPopup(`终点：${name}`).openPopup()
              
              this.routeMarkers = [startMarker, endMarker]
              
              const group = new L.featureGroup([this.routeLine, ...this.routeMarkers])
              this.map.fitBounds(group.getBounds().pad(0.1))
              
              const distance = (route.distance / 1000).toFixed(2)
              const duration = Math.round(route.duration / 60)
              
              uni.showToast({
                title: `路径规划成功：${distance}公里，约${duration}分钟`,
                icon: 'none',
                duration: 3000
              })
              
              return
            }
          }
          
          console.warn('OSRM路径规划失败，响应数据无效:', data)
          uni.showModal({
            title: '路径规划失败',
            content: '无法获取路线信息，请检查网络连接后重试',
            showCancel: false,
            confirmText: '确定'
          })
        })
        .catch(error => {
          console.error('OSRM路径规划请求失败:', error)
          uni.showModal({
            title: '路径规划失败',
            content: '无法获取路线信息，请检查网络连接后重试',
            showCancel: false,
            confirmText: '确定'
          })
        })
    },
    
    // 显示位置权限提示弹窗
    showLocationPermissionDialog() {
      uni.showModal({
        title: '需要位置权限',
        content: '路线规划功能需要获取您的位置信息。请在系统设置中开启位置权限，然后重试。',
        showCancel: true,
        cancelText: '取消',
        confirmText: '去设置',
        success: (res) => {
          if (res.confirm) {
            // 引导用户去设置页面
            // #ifdef H5
            // H5端无法直接打开系统设置，显示提示
            uni.showToast({
              title: '请在浏览器设置中开启位置权限',
              icon: 'none',
              duration: 3000
            })
            // #endif
            // #ifndef H5
            // App端可以打开系统设置
            uni.openSetting({
              success: (settingRes) => {
                if (settingRes.authSetting['scope.userLocation']) {
                  uni.showToast({
                    title: '位置权限已开启',
                    icon: 'success',
                    duration: 2000
                  })
                }
              }
            })
            // #endif
          }
        }
      })
    },
    
    // 清除路径
    clearRoute() {
      if (this.routeLine) {
        this.map.removeLayer(this.routeLine)
        this.routeLine = null
      }
      if (this.routeMarkers && this.routeMarkers.length > 0) {
        this.routeMarkers.forEach(marker => {
          this.map.removeLayer(marker)
        })
        this.routeMarkers = []
      }
    },
    
    // 放大缩小方法
    zoomIn() {
      if (this.map) {
        this.map.zoomIn()
      }
    },
    
    zoomOut() {
      if (this.map) {
        this.map.zoomOut()
      }
    },
    
    handleDrawingClick(e) {
      if (!this.isDrawing || !this.drawingMode) return
      
      this.measurePoints.push(e.latlng)
      
      if (this.drawingMode === 'polygon' && this.measurePoints.length > 2) {
        this.updateDrawPolygon()
      }
    },
    
    updateDrawPolygon() {
      if (this.measurePolygon) {
        this.map.removeLayer(this.measurePolygon)
      }
      
      this.measurePolygon = L.polygon(this.measurePoints, {
        color: '#4CAF50',
        weight: 3,
        opacity: 0.8,
        fillColor: '#4CAF50',
        fillOpacity: 0.3
      }).addTo(this.map)
      
      const area = L.GeometryUtil.geodesicArea(this.measurePoints)
      const perimeter = this.calculatePerimeter(this.measurePoints)
      
      this.drawInfo = {
        title: '自定义绘制',
        area: area,
        perimeter: perimeter,
        points: this.measurePoints.length
      }
      
      this.drawFeature = {
        type: 'polygon',
        coordinates: this.measurePoints,
        properties: {
          id: 'CUSTOM_' + this.featureCounter,
          name: '自定义范围' + this.featureCounter
        }
      }
    },
    
    calculatePerimeter(points) {
      let perimeter = 0
      for (let i = 1; i < points.length; i++) {
        perimeter += points[i-1].distanceTo(points[i])
      }
      // 闭合多边形
      if (points.length > 2) {
        perimeter += points[points.length-1].distanceTo(points[0])
      }
      return perimeter
    },
    
    saveFeature() {
      if (!this.drawFeature) {
        alert('请先绘制图形')
        return
      }
      
      const feature = {
        ...this.drawFeature,
        properties: {
          ...this.drawFeature.properties,
          savedAt: new Date().toISOString(),
          area: this.drawInfo.area,
          perimeter: this.drawInfo.perimeter
        }
      }
      
      this.savedFeatures.push(feature)
      this.featureCounter++
      
      // 将图形转换为永久图层
      const permanentLayer = L.polygon(feature.coordinates, {
        color: '#4CAF50',
        weight: 3,
        opacity: 0.8,
        fillColor: '#4CAF50',
        fillOpacity: 0.3
      }).addTo(this.map)
        .bindPopup(`<b>${feature.properties.name}</b><br>面积: ${(feature.properties.area/666.66667).toFixed(3)}亩`)
      
      // 保存到图层组
      this.layers.push({
        id: feature.properties.id,
        name: feature.properties.name,
        visible: true,
        layer: permanentLayer,
        loaded: true
      })
      
      alert('图形保存成功！')
      this.clearDrawing()
    },
    
    clearDrawings() {
      this.clearDrawing()

      // 从地图上移除所有自定义（CUSTOM_）图层
      if (this.layers && this.layers.length) {
        this.layers.forEach(layer => {
          try {
            if (layer && layer.id && String(layer.id).startsWith('CUSTOM_') && layer.layer) {
              this.map.removeLayer(layer.layer)
            }
          } catch (e) {
            // 忽略单个图层移除错误
          }
        })
      }

      // 从图层列表中移除自定义图层
      this.layers = this.layers.filter(layer => !(layer && layer.id && String(layer.id).startsWith('CUSTOM_')))

      // 清理已保存的要素数组
      this.savedFeatures = []
    },
    
    clearDrawing() {
      this.isDrawing = false
      this.drawingMode = null
      this.drawFeature = null
      this.drawInfo = null
      this.measurePoints = []
      
      if (this.measurePolygon) {
        this.map.removeLayer(this.measurePolygon)
        this.measurePolygon = null
      }
    },
    
    measureLength() {
      this.measuringDistance = !this.measuringDistance
      this.measuringArea = false
      this.clearDrawing()
      this.showLayerPanel = false
    },
    
    measureArea() {
      this.measuringArea = !this.measuringArea
      this.measuringDistance = false
      this.clearDrawing()
      this.showLayerPanel = false
    },
    
    async screenCut() {
      try {
        const mapContainer = this.$refs.mapContainer
        
        // 隐藏工具栏和控件
        const originalStyles = {}
        const elementsToHide = mapContainer.querySelectorAll('.toolbar-container, .map-type-selector, .zoom-controls, .layer-panel, .measure-info-panel, .draw-info-panel, .leaflet-control, .search-container')
        
        elementsToHide.forEach(el => {
          originalStyles[el] = el.style.display
          el.style.display = 'none'
        })
        
        // 截取地图
        const canvas = await html2canvas(mapContainer, {
          useCORS: true,
          allowTaint: true,
          backgroundColor: null,
          scale: 2 // 高清截图
        })
        
        // 恢复显示
        elementsToHide.forEach(el => {
          el.style.display = originalStyles[el] || ''
        })
        
        // 创建下载链接
        // #ifdef H5
        if (typeof document !== 'undefined') {
          const link = document.createElement('a')
          link.download = `地图截图_${new Date().getTime()}.png`
          link.href = canvas.toDataURL('image/png')
          link.click()
        }
        // #endif
      } catch (error) {
        console.error('截图失败:', error)
        alert('截图失败，请重试')
      }
    },
    
    handleMapClick(e) {
      if (this.drawingMode === 'polygon' || this.drawingMode === 'freehand') {
        this.handleDrawingClick(e)
      } else if (this.measuringDistance) {
        this.handleDistanceMeasure(e)
      } else if (this.measuringArea) {
        this.handleAreaMeasure(e)
      }
    },
    
    handleDistanceMeasure(e) {
      this.measurePoints.push(e.latlng)
      
      if (this.measureLine) {
        this.map.removeLayer(this.measureLine)
      }
      
      if (this.measurePoints.length > 1) {
        this.measureLine = L.polyline(this.measurePoints, {
          color: '#4CAF50',
          weight: 3,
          opacity: 0.8,
          dashArray: '5, 5'
        }).addTo(this.map)
        
        let totalDistance = 0
        for (let i = 1; i < this.measurePoints.length; i++) {
          totalDistance += this.measurePoints[i-1].distanceTo(this.measurePoints[i])
        }
        
        this.measureInfo = {
          type: 'distance',
          distance: totalDistance,
          points: this.measurePoints.length
        }
      }
    },
    
    handleAreaMeasure(e) {
      this.measurePoints.push(e.latlng)
      
      if (this.measurePolygon) {
        this.map.removeLayer(this.measurePolygon)
      }
      
      if (this.measurePoints.length > 2) {
        this.measurePolygon = L.polygon(this.measurePoints, {
          color: '#4CAF50',
          weight: 2,
          opacity: 0.8,
          fillColor: '#4CAF50',
          fillOpacity: 0.3
        }).addTo(this.map)
        
        const area = L.GeometryUtil.geodesicArea(this.measurePoints)
        
        this.measureInfo = {
          type: 'area',
          area: area,
          points: this.measurePoints.length
        }
      }
    },
    
    clearMeasure() {
      this.clearCurrentMeasurements()
    },
    
    clearCurrentMeasurements() {
      this.measuringDistance = false
      this.measuringArea = false
      this.measurePoints = []
      this.measureInfo = null
      
      if (this.measureLine) {
        this.map.removeLayer(this.measureLine)
        this.measureLine = null
      }
      
      if (this.measurePolygon) {
        this.map.removeLayer(this.measurePolygon)
        this.measurePolygon = null
      }
    },
    
    updateCoordDisplay(latlng) {
      const lat = latlng.lat
      const lng = latlng.lng
      this.currentCoords = `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    },
    
    locateMe() {
      // #ifdef H5
      // 检查权限状态（不打印日志）
      if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
        navigator.permissions.query({ name: 'geolocation' }).catch(() => {})
      }

      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            // 定位成功
            const lat = position.coords.latitude
            const lng = position.coords.longitude
            this.map.setView([lat, lng], 15)

            L.marker([lat, lng], {
              icon: L.divIcon({
                className: 'user-marker',
                html: '<div style="background: #4CAF50; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>',
                iconSize: [20, 20]
              })
            })
            .addTo(this.map)
            .bindPopup('当前位置')
            .openPopup()
          },
          (error) => {
            console.error('geolocation error', error)
            alert('无法获取位置信息：' + this.getPositionError(error))
          },
          { enableHighAccuracy: true, timeout: 10000 }
        )
      } else {
        console.warn('navigator.geolocation not available')
        alert('浏览器不支持地理定位功能')
      }
      // #endif
      // #ifndef H5
      // App端使用 uni.getLocation
      // App端获取的是GCJ02坐标，需要转换为WGS84以匹配天地图底图
      uni.getLocation({
        type: 'gcj02',
        success: (res) => {
          const gcjLat = res.latitude
          const gcjLon = res.longitude
          // 将GCJ02转换为WGS84
          let _this = this
          const [wgsLat, wgsLon] = _this.gcj02ToWgs84(gcjLat, gcjLon)
          _this.map.setView([wgsLat, wgsLon], 15)
          L.marker([wgsLat, wgsLon], {
            icon: L.divIcon({
              className: 'user-marker',
              html: '<div style="background: #4CAF50; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>',
              iconSize: [20, 20]
            })
          })
          .addTo(_this.map)
          .bindPopup('当前位置')
          .openPopup()
        },
        fail: (err) => {
          console.error('getLocation error', err)
          uni.showToast({
            title: '无法获取位置信息',
            icon: 'none'
          })
        }
      })
      // #endif
    },
    
    getPositionError(error) {
      switch(error.code) {
        case 1: return '用户拒绝了位置请求'
        case 2: return '无法获取位置信息'
        case 3: return '位置请求超时'
        default: return '未知错误'
      }
    },
    
    // 图层相关方法（现在仅加载已存在的 layer.layer）
    loadMapData() {
      if (!this.layers || !this.map) return
      this.layers.forEach(layer => {
        if (layer.visible && layer.layer) {
          this.map.addLayer(layer.layer)
        }
      })
    },
    // 预览图片
    // ESC键处理（保留用于未来扩展）
    handleKeydown(event) {
      // 可以在这里添加其他键盘快捷键处理
    },
    
    goBack() {
      uni.navigateBack({
        fail: () => {
          // 如果无法返回，则跳转到首页
          uni.switchTab({
            url: '/pages/index/index'
          })
        }
      })
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

.map-container {
  position: relative;
  height: 100%;
  width: 100%;
  min-height: calc(100vh - 140px);
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

#map {
  width: 100%;
  height: 100%;
  min-height: 400px; /* 确保有最小高度 */
  border-radius: 0;
  overflow: hidden;
  flex: 1;
  position: relative;
}

.map-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 16px;
}

.header-title {
  color: white;
  font-size: 18px;
  font-weight: 600;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: opacity 0.3s;
}

.back-btn:active {
  opacity: 0.7;
}

.coord-display {
  color: white;
  font-size: 12px;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 8px;
  border-radius: 12px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

/* 搜索标记信息 */
.search-marker-info {
  position: absolute;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.95) 0%, rgba(69, 160, 73, 0.95) 100%);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  backdrop-filter: blur(5px);
  animation: slideDown 0.3s ease;
}

.marker-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.marker-content i {
  font-size: 14px;
}

.marker-content span {
  font-size: 13px;
  font-weight: 500;
}

.close-marker-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  transition: all 0.2s ease;
  margin-left: 8px;
}

.close-marker-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

/* 工具栏样式 - 右侧垂直排列 */
.toolbar-container {
  position: absolute;
  top: 80px;
  right: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 1100;
  pointer-events: none;
}

.toolbar-container > * {
  pointer-events: auto;
}

.toolbar-container.expanded {
  top: 80px;
  right: 10px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(76, 175, 80, 0.1);
  padding: 12px 8px;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
  overflow-x: hidden;
  min-width: 60px;
}

.toolbar-btn {
  background: rgba(255,255,255,0.95);
  border: none;
  padding: 10px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 44px;
  min-height: 44px;
}

.toolbar-btn:hover {
  border-color: #45a049;
  transform: translateY(-2px);
}

.toolbar-btn i {
  font-size: 18px;
  margin-bottom: 4px;
  color: #333;
  font-family: 'Font Awesome 7 Free';
  font-weight: 900;
  display: inline-block;
  font-style: normal;
  font-variant: normal;
  text-rendering: auto;
  line-height: 1;
}

.toolbar-btn span {
  font-size: 10px;
  color: #666;
  font-weight: 500;
}

/* 放大缩小定位控件 */
.zoom-controls {
  position: absolute;
  top: 20px;
  left: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 1000;
}

.zoom-btn,.control-btn {
  background: white;
  border: none;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 20px;
  color: #333;
  box-shadow: 0 2px 10px rgba(0,0,0,0.15);
  transition: all 0.3s ease;
  
}

.zoom-btn:hover,.control-btn:hover {
  background: #f5f5f5;
  transform: scale(1.05);
}

.zoom-btn:active,.control-btn:active {
  transform: scale(0.95);
}

.location-control {
  position: absolute;
  bottom: 10%;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 1000;
}

.location-control .control-btn {
  width: 44px;
  height: 44px;
  padding: 0;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  border-radius: 10px;
  background: white;
  color: #333;
  box-shadow: 0 2px 10px rgba(0,0,0,0.15);
}

.location-control .control-btn i {
  font-size: 18px;
  line-height: 1;
}


/* 图层控制面板 */
.layer-panel {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(255,255,255,0.95);
  padding: 15px;
  border-radius: 15px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  z-index: 1000;
  min-width: 200px;
  max-width: 80vw;
}

.layer-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.layer-panel-header h4 {
  margin: 0;
  color: #333;
  font-size: 16px;
}

.close-btn {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  font-size: 18px;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.close-btn:hover {
  background: #f5f5f5;
}

.layer-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.layer-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 0;
}

.layer-item input[type="checkbox"] {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  accent-color: #4CAF50;
}

.layer-item label {
  font-size: 14px;
  color: #333;
  cursor: pointer;
  user-select: none;
}

/* 测量信息面板 */
.measure-info-panel {
  position: absolute;
  bottom: 90px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  padding: 0;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  min-width: 320px;
  max-width: 90vw;
  overflow: hidden;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(76, 175, 80, 0.1);
}

.measure-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.08) 0%, rgba(76, 175, 80, 0.03) 100%);
  border-bottom: 1px solid rgba(76, 175, 80, 0.1);
}

.measure-title {
  font-size: 16px;
  font-weight: 500;
  margin: 0;
}

.close-measure-btn {
  background: rgba(0, 0, 0, 0.05);
  border: none;
  color: #666;
  cursor: pointer;
  font-size: 16px;
  padding: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.close-measure-btn:hover {
  background: rgba(0, 0, 0, 0.1);
  transform: scale(1.1);
}

.close-measure-btn i {
  font-size: 14px;
}

.measure-content {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.measure-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #333;
  line-height: 1.6;
}

.measure-item i {
  color: #4CAF50;
  width: 18px;
  font-size: 16px;
  flex-shrink: 0;
}

.measure-value {
  font-weight: 600;
  color: #1f2937;
  font-size: 15px;
  margin-right: 6px;
}

.measure-converted {
  color: #6b7280;
  font-size: 13px;
  font-weight: 400;
}

.measure-points {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #6b7280;
  font-size: 14px;
  margin-top: 4px;
}

.measure-points i {
  color: #4CAF50;
  width: 18px;
  font-size: 16px;
  flex-shrink: 0;
}

/* 绘制信息面板 */
.draw-info-panel {
  position: absolute;
  bottom: 80px;
  left: 10px;
  background: rgba(255,255,255,0.95);
  padding: 15px;
  border-radius: 15px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  z-index: 1000;
  min-width: 200px;
  max-width: 80vw;
}

.draw-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(76, 175, 80, 0.1);
}

.draw-title {
  font-size: 16px;
  font-weight: 600;
  color: #2e7d32;
  margin: 0;
}

.close-draw-btn {
  background: rgba(0, 0, 0, 0.05);
  border: none;
  color: #666;
  cursor: pointer;
  font-size: 16px;
  padding: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}


.close-draw-btn i {
  font-size: 14px;
}

.draw-content {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.draw-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #333;
  line-height: 1.6;
}

.draw-item i {
  color: #4CAF50;
  width: 18px;
  font-size: 16px;
  flex-shrink: 0;
}

.draw-value {
  font-weight: 600;
  color: #1f2937;
  font-size: 15px;
  margin-right: 6px;
}

.draw-converted {
  color: #6b7280;
  font-size: 13px;
  font-weight: 400;
}

.draw-points {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #6b7280;
  font-size: 14px;
  margin-top: 4px;
}

.draw-points i {
  color: #4CAF50;
  width: 18px;
  font-size: 16px;
  flex-shrink: 0;
}

.draw-actions {
  margin-top: 15px;
}

.action-btn {
  width: 100%;
  padding: 8px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  transition: all 0.3s ease;
}

.save-btn {
  background: #4CAF50;
  color: white;
}


/* 响应式设计 */
@media (max-width: 768px) {
  .app-header {
    padding: 8px 12px;
  }
  
  .header-left h1 {
    font-size: 16px;
  }
  
  .coord-display {
    font-size: 10px;
    padding: 3px 6px;
  }
  
  .map-type-btn {
    padding: 5px 10px;
    font-size: 11px;
    min-width: 50px;
  }
  
  .toolbar-container {
    top: 80px;
    right: 8px;
  }
  
  .toolbar-container.expanded {
    top: 80px;
    right: 8px;
    max-width: calc(100vw - 120px);
  }
  
  .toolbar-btn {
    min-width: 40px;
    min-height: 40px;
    padding: 8px;
  }
  
  .toolbar-btn i {
    font-size: 16px;
  }
  
  .toolbar-btn span {
    font-size: 9px;
  }
  
  .layer-panel {
    top: 80px;
    right: 8px;
    max-width: calc(100vw - 100px);
    max-height: calc(100vh - 180px);
  }

  .zoom-btn {
    width: 40px;
    height: 40px;
    font-size: 18px;
  }
  
  .layer-panel,
  .measure-info-panel,
  .draw-info-panel {
    max-width: 90vw;
  }
  
  .measure-info-panel,
  .draw-info-panel {
    min-width: 280px;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
  }
  
  .measure-header,
  .draw-header {
    padding: 14px 16px;
  }
  
  .measure-content,
  .draw-content {
    padding: 14px 16px;
  }
  
  .draw-actions {
    padding: 10px 16px 16px 16px;
  }

.search-marker-info {
    top: 70px;
    font-size: 12px;
    padding: 6px 12px;
  }
}

@media (max-width: 480px) {
  .header-left h1 {
    font-size: 14px;
  }
  
  .coord-display {
    font-size: 9px;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .toolbar-container {
    top: 70px;
    right: 5px;
  }
  
  .toolbar-container.expanded {
    top: 70px;
    right: 5px;
    max-height: calc(100vh - 150px);
    max-width: calc(100vw - 80px);
    padding: 8px 6px;
  }
  
  .toolbar-btn {
    min-width: 36px;
    min-height: 36px;
    padding: 6px;
  }
  
  .toolbar-btn i {
    font-size: 14px;
  }
  
  .toolbar-btn span {
    font-size: 8px;
  }
  
  .layer-panel {
    top: 70px;
    right: 5px;
    max-width: calc(100vw - 80px);
    max-height: calc(100vh - 150px);
    padding: 12px;
  }
  
  .zoom-controls {
    top: 70px;
    left: 5px;
  }
  
  .layer-toggle-control {
    top: 130px;
    left: 5px;
  }
  
  .location-control {
    bottom: 90px;
    right: 5px;
  }
  
  .measure-info-panel,
  .draw-info-panel {
    bottom: 70px;
    min-width: 260px;
    max-width: 92vw;
  }
  
  .measure-title,
  .draw-title {
    font-size: 15px;
  }
  
  .measure-item,
  .draw-item {
    font-size: 13px;
    gap: 8px;
  }
  
  .measure-value,
  .draw-value {
    font-size: 14px;
  }
  
  .measure-converted,
  .draw-converted {
    font-size: 12px;
  }
  
  .measure-points,
  .draw-points {
    font-size: 13px;
  }
  
  .action-btn {
    padding: 10px 16px;
    font-size: 14px;
  }
  
  .search-marker-info {
    top: 60px;
    font-size: 11px;
    padding: 5px 10px;
  }
}

/* 浮动图层按钮 */
.layer-toggle-control {
  position: absolute;
  /* 放在定位按钮下面 */
  top: 130px;
  left: 10px;
  z-index: 1000;
}

.layer-btn {
  background: white;
  border: none;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 18px;
  color: #333;
  box-shadow: 0 2px 10px rgba(0,0,0,0.15);
  transition: transform .12s ease, background .12s ease;
}

.layer-btn:hover {
  background: #f5f5f5;
  transform: translateY(-2px);
}

/* 美化图层面板：位于图层按钮右侧，避免遮挡顶部搜索框 */
.layer-panel {
  position: absolute;
  top: 130px;
  left: 64px;
  background: rgba(255,255,255,0.98);
  padding: 12px;
  border-radius: 12px;
  box-shadow: 0 8px 28px rgba(0,0,0,0.12);
  z-index: 1100;
  min-width: 220px;
  max-width: 320px;
  max-height: 60vh;
  overflow: auto;
  backdrop-filter: blur(4px);
}

.layer-panel-header h4 {
  font-size: 15px;
  margin: 0;
}

.base-toggle {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.base-toggle .map-type-btn {
  padding: 6px 10px;
  border-radius: 999px;
  background: #f3f5f6;
  border: 1px solid rgba(0,0,0,0.04);
  color: #444;
  font-weight: 600;
}

.base-toggle .map-type-btn.active {
  background: #4CAF50;
  color: white;
  box-shadow: 0 4px 12px rgba(76,175,80,0.14);
}

.layer-list { padding: 6px 6px 12px 6px; }
.layer-item { padding: 8px 6px; border-radius: 8px; }
.layer-item input { margin-right: 8px; }

/* 确保面板不会遮挡搜索下拉 */
.search-container { z-index: 1200; }


.hxbsp-marker {
  cursor: pointer;
}

.hxjz-marker {
  cursor: pointer;
}

/* 在弹窗中添加一些样式优化 */
.leaflet-popup-content {
  max-height: 300px;
  overflow-y: auto;
}

.leaflet-popup-content p {
  margin: 5px 0;
  font-size: 13px;
  line-height: 1.4;
}

.leaflet-popup-content b {
  color: #333;
  min-width: 80px;
  display: inline-block;
}

/* 弹窗导航按钮样式 */
.leaflet-popup-content-wrapper button {
  width: 100%;
  padding: 8px 12px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: background 0.2s;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

.leaflet-popup-content-wrapper button:hover {
  background: #45a049;
}

.leaflet-popup-content-wrapper button:active {
  background: #3d8b40;
}

.leaflet-popup-content-wrapper button i {
  font-size: 14px;
}

/* 添加图层切换按钮样式 */
.layer-toggle-control {
  position: absolute;
  bottom: 80px;
  left: 10px;
  z-index: 1000;
}

.layer-btn {
  background: white;
  border: none;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 18px;
  color: #333;
  box-shadow: 0 2px 10px rgba(0,0,0,0.15);
  transition: all 0.3s ease;
}

.layer-btn:hover {
  background: #f5f5f5;
  transform: scale(1.05);
}


@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes zoomIn {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
</style>