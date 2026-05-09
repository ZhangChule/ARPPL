import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'arppl_process_app',
      filename: 'remoteEntry.js',
      exposes: {
        // Host platforms import this as: import('arppl_process_app/ArpplApp').
        // The default export remains the same component used by local main.tsx.
        './ArpplApp': './src/App.tsx',
        './ProcessLauncher': './src/ProcessLauncher.tsx',
        './processManifest': './src/processManifest.ts',
      },
      // The plugin version used here models shared packages as an array. React
      // and ReactDOM must be provided by both host and remote at compatible
      // versions to avoid duplicate renderer instances.
      shared: ['react', 'react-dom', 'three'],
    }),
  ],
  build: {
    target: 'esnext',
    modulePreload: false,
    cssCodeSplit: false,
    rollupOptions: {
      input: {
        app: fileURLToPath(new URL('./index.html', import.meta.url)),
        platform: fileURLToPath(new URL('./platform.html', import.meta.url)),
      },
    },
  },
  server: {
    proxy: {
      // Development convenience: the React dev server can call the same gateway
      // path used in production, while Nginx still remains the only public entry
      // to the backend container.
      '/api/process-a': {
        target: 'http://127.0.0.1:80',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://127.0.0.1:80',
        changeOrigin: true,
      },
    },
  },
})
