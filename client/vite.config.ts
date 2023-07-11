import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import { resolve } from 'path'
import { defineConfig } from 'vite'

const root = resolve(__dirname, "src");
const outDir=resolve(__dirname, "../server/app/public");

export default defineConfig({
  base: "./",
  plugins: [
    vue(),
    vuetify()
  ],
  resolve:{
    alias: [
      { find: '@', replacement: root },
      {find:"vue", replacement:'@vue/compat'}
    ]
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
