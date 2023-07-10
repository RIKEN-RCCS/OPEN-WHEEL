import vue from '@vitejs/plugin-vue2'
import { fileURLToPath, URL } from "url";
import { resolve } from 'path'
import { defineConfig } from 'vite'
import { VuetifyResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'

const root = resolve(__dirname, "src");
const outDir=resolve(__dirname, "../server/app/public");

export default defineConfig({
  plugins: [
    vue(),
    Components({
      resolvers: [VuetifyResolver()],
    }),
  ],
  resolve:{
    alias: [{ find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) }],
  },
  root,
  build: {
    outDir,
    emptyOutDir: true,
    rollupOptions: {
      input: {
        workflow: resolve(root, 'workflow.html'),
        viewer: resolve(root, 'viewer.html'),
        home: resolve(root, 'home.html'),
        remotehost: resolve(root, 'remotehost.html'),
      },
    },
  },
})
