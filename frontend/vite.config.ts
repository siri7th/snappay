// vite.config.ts
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import os from 'os';

// Helper function to get local IP
const getLocalIP = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]!) {
      if (!iface.internal && iface.family === 'IPv4') {
        return iface.address;
      }
    }
  }
  return 'localhost';
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isDev = mode === 'development';
  const isProd = mode === 'production';
  const localIP = getLocalIP();

  return {
    plugins: [react()],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@pages': path.resolve(__dirname, './src/pages'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@store': path.resolve(__dirname, './src/store'),
        '@services': path.resolve(__dirname, './src/services'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@assets': path.resolve(__dirname, './src/assets'),
        '@types': path.resolve(__dirname, './src/types'),
      },
    },

    server: {
      port: 5173,
      host: '0.0.0.0',
      open: isDev,
      cors: true,
      hmr: {
        host: localIP,
        port: 5173,
        protocol: 'ws',
      },
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
          // 🔥 FIXED: Keep /api prefix (remove rewrite)
        },
      },
    },

    preview: {
      port: 4173,
      host: '0.0.0.0',
      open: isDev,
    },

    build: {
      sourcemap: isDev,
      minify: isProd ? 'terser' : false,
      terserOptions: isProd
        ? {
            compress: {
              drop_console: true,
              drop_debugger: true,
            },
          }
        : {},
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            ui: ['@headlessui/react', '@heroicons/react'],
            utils: ['axios', 'react-hot-toast', 'qrcode.react'],
            redux: ['@reduxjs/toolkit', 'react-redux', 'redux-persist'],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },

    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
      __DEV__: isDev,
      __PROD__: isProd,
      __API_URL__: JSON.stringify(env.VITE_API_URL || 'http://localhost:5000'),
    },

    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', 'react-redux', '@reduxjs/toolkit'],
    },
  };
});