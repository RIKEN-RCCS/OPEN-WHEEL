
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)


const clientSrc = resolve(__dirname, '../client/src')

export default defineConfig({
  plugins: [
    vue(),
    vuetify(),
  ],
  resolve: {
    alias: {
      '@': clientSrc,
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },

})
