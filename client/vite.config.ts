import { resolve } from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
import VueDevTools from 'vite-plugin-vue-devtools'


const root = resolve(__dirname, "src");
const outDir=resolve(__dirname, "../server/app/public");

export default defineConfig({
  base: "./",
  plugins: [
    vue({
      template: { transformAssetUrls }
    }),
    vuetify(),
    VueDevTools()
  ],
  define:{
    __VUE_PROD_DEVTOOLS__: true
  },
  resolve:{
    alias: [
      { find: '@', replacement: root },
    ]
  },
  root,
  build: {
    sourcemap: true,
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
