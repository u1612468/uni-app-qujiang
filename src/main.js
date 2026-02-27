// #ifdef H5
import { createApp as createVueApp } from 'vue'
// #endif
// #ifndef H5
import { createSSRApp } from 'vue'
// #endif
import App from './App.vue'
import '/assets/style.css'
import '/assets/popup-styles.css'

// 导入 Font Awesome CSS
import '@fortawesome/fontawesome-free/css/all.min.css'

// 导入 Leaflet CSS（使用已安装的 npm 包）
import 'leaflet/dist/leaflet.css'

console.log('main.js loaded')
console.log('App component imported:', App)
console.log('Environment check:', {
  isWindow: typeof window !== 'undefined',
  isH5: typeof window !== 'undefined' && window.location,
  isNode: typeof process !== 'undefined'
})

// H5 模式下创建 uni 对象的 polyfill
// #ifdef H5
if (typeof window !== 'undefined' && !window.uni) {
  window.uni = {
    getStorageSync: (key) => {
      try {
        return localStorage.getItem(key)
      } catch (e) {
        console.warn('localStorage not available:', e)
        return null
      }
    },
    setStorageSync: (key, value) => {
      try {
        localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))
      } catch (e) {
        console.warn('localStorage not available:', e)
      }
    },
    switchTab: (options) => {
      console.log('switchTab called:', options)
      const path = options.url || options
      let hash = '#/pages/index/index'
      
      if (path.includes('index') || path === '/') {
        hash = '#/pages/index/index'
      } else if (path.includes('map')) {
        hash = '#/pages/map/map'
      } else if (path.includes('patrol')) {
        hash = '#/pages/patrol/patrol'
      } else if (path.includes('report')) {
        hash = '#/pages/report/report'
      }
      
      window.location.hash = hash
      console.log('Switched to:', hash)
      
      // 触发 hashchange 事件（某些情况下可能不会自动触发）
      setTimeout(() => {
        window.dispatchEvent(new Event('hashchange'))
      }, 10)
      
      if (options.success) {
        setTimeout(() => {
          options.success()
        }, 50)
      }
    },
    showModal: (options) => {
      if (window.confirm(options.content || options.title || '确认')) {
        options.success && options.success({ confirm: true })
      } else {
        options.fail && options.fail()
      }
    },
    getLocation: (options) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            options.success && options.success({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy || 100
            })
          },
          (error) => {
            options.fail && options.fail(error)
          }
        )
      } else {
        options.fail && options.fail({ errMsg: 'Geolocation not supported' })
      }
    },
    navigateBack: (options) => {
      if (options && options.fail) {
        // 如果无法返回，执行 fail 回调
        try {
          window.history.back()
        } catch (e) {
          options.fail(e)
        }
      } else {
        window.history.back()
      }
    },
    navigateTo: (options) => {
      const url = typeof options === 'string' ? options : (options.url || '')
      if (url) {
        window.location.hash = url.startsWith('#') ? url : `#${url}`
        if (options && options.success) {
          setTimeout(() => options.success(), 50)
        }
      }
    },
    reLaunch: (options) => {
      const url = typeof options === 'string' ? options : (options.url || '')
      if (url) {
        window.location.hash = url.startsWith('#') ? url : `#${url}`
        // reLaunch 会清除页面栈，在 H5 中通过 hash 实现
        if (options && options.success) {
          setTimeout(() => options.success(), 50)
        }
      }
    },
    request: (options) => {
      return new Promise((resolve, reject) => {
        const url = options.url.startsWith('http') 
          ? options.url 
          : (options.url.startsWith('/') ? options.url : `/${options.url}`)
        
        fetch(url, {
          method: options.method || 'GET',
          headers: options.header || {}
        })
        .then(res => {
          if (!res.ok) {
            const error = new Error(`HTTP error! status: ${res.status}`)
            error.statusCode = res.status
            if (options.fail) options.fail(error)
            reject(error)
            return
          }
          
          const contentType = res.headers.get('content-type')
          const isJson = contentType && contentType.includes('application/json')
          
          return (isJson ? res.json() : res.text()).then(data => {
            const response = {
              data: data,
              statusCode: res.status,
              header: {}
            }
            if (options.success) options.success(response)
            resolve(response)
          })
        })
        .catch(error => {
          console.error('uni.request failed:', error, 'URL:', url)
          if (options.fail) options.fail(error)
          reject(error)
        })
        .finally(() => {
          if (options.complete) options.complete()
        })
      })
    },
    showToast: (options) => {
      const message = typeof options === 'string' ? options : (options.title || '提示')
      alert(message)
    },
    chooseImage: (options) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.multiple = options.count > 1
      input.onchange = (e) => {
        const files = Array.from(e.target.files)
        const tempFilePaths = files.map(file => URL.createObjectURL(file))
        if (options.success) {
          options.success({
            tempFilePaths: tempFilePaths
          })
        }
      }
      input.click()
    },
    previewImage: (options) => {
      // 简单的图片预览实现
      if (options.urls && options.urls.length > 0) {
        window.open(options.urls[0], '_blank')
      }
    }
  }
  console.log('uni polyfill created')
}
// #endif

export function createApp() {
  console.log('=== createApp called ===')
  try {
    let app
    // #ifdef H5
    // H5 模式使用普通的 createApp（客户端渲染）
    app = createVueApp(App)
    // #endif
    // #ifndef H5
    // 非 H5 模式（真机）使用 createSSRApp
    app = createSSRApp(App)
    // #endif
    console.log('App created successfully:', app)
    console.log('App component:', App)
    console.log('App instance:', app)
    
    return {
      app
    }
  } catch (error) {
    console.error('Error in createApp:', error)
    throw error
  }
}

// H5 模式下需要手动挂载（用于开发调试）
// #ifdef H5
if (typeof window !== 'undefined') {
  try {
    const { app } = createApp()
    const appElement = document.getElementById('app')
    if (appElement) {
      app.mount('#app')
      console.log('App mounted to #app')
    } else {
      console.error('App element #app not found')
    }
  } catch (error) {
    console.error('Error mounting app:', error)
  }
}
// #endif

// uni-app 在真机运行时会自动处理应用挂载
