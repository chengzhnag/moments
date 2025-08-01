import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import cdn from 'vite-plugin-cdn-import'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    cdn({
      modules: [
        {
          name: 'react',
          var: 'React',
          path: 'https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js',
        },
        {
          name: 'react-dom',
          var: 'ReactDOM',
          path: 'https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js',
        }
      ],
    }),
  ],
  build: {
    rollupOptions: {
      external: ['react', 'react-dom',  ], // 将 React 和 Antd 外部化
      input: {
        main: path.resolve(__dirname, './index.html'),
      },
      output: {
        globals: {
          react: 'React', // 全局变量名
          'react-dom': 'ReactDOM', // 全局变量名
        },
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
})
