import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // 明确指定JSX运行时
      jsxRuntime: 'automatic',
      // 支持JSX语法
      jsxImportSource: 'react'
    })
  ],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
  },
  server: {
    port: 3000,
    open: true,
    // 确保正确的MIME类型
    fs: {
      strict: false
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          antd: ['antd'],
          ethers: ['ethers']
        }
      }
    }
  }
})
