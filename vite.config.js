import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // 手动分块策略
        manualChunks: {
          // React相关库
          'react-vendor': ['react', 'react-dom'],
          // 路由库
          'router-vendor': ['react-router-dom'],
          // UI组件库
          'ui-vendor': ['antd-mobile', 'antd-mobile-icons'],
          // 工具库
          'utils-vendor': ['ahooks'],
        },
        // 文件名格式
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // 设置块大小警告限制
    chunkSizeWarningLimit: 1000,
    // 启用源码映射（可选，生产环境可以关闭）
    sourcemap: false,
    // 压缩选项
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 移除console
        drop_debugger: true, // 移除debugger
      }
    }
  },
  // CSS代码分割
  cssCodeSplit: true,
  // 预构建选项
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
})
