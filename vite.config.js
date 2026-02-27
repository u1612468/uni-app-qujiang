import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import path from 'path'

// Uni-app 原生组件列表
const UNI_COMPONENTS = [
  'view', 'text', 'button', 'image', 'input', 'textarea',
  'scroll-view', 'swiper', 'swiper-item', 'picker', 'picker-view',
  'checkbox', 'checkbox-group', 'radio', 'radio-group',
  'switch', 'slider', 'progress', 'label', 'form',
  'navigator', 'web-view', 'cover-view', 'cover-image',
  'map', 'canvas', 'video', 'audio', 'live-player', 'live-pusher',
  'editor', 'rich-text', 'ad', 'official-account',
  'open-data', 'webview', 'movable-area', 'movable-view'
]

export default defineConfig({
  base: './',
  plugins: [
    uni({
      vueOptions: {
        compilerOptions: {
          isCustomElement: (tag) => UNI_COMPONENTS.includes(tag)
        }
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/uni.scss";`
      }
    }
  },
  server: {
    port: 3000,
    open: true,
    cors: true,
    hmr: {
      overlay: true
    }
  },
  logLevel: 'info',
  clearScreen: false,
  publicDir: 'static',
  assetsInclude: ['**/*.woff', '**/*.woff2', '**/*.ttf', '**/*.eot', '**/*.geojson']
})