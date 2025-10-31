import { resolve } from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'


const root = resolve(__dirname, "src");
const outDir=resolve(__dirname, "../server/app/public");

export default defineConfig(async ({ mode }) => {
  const plugins = [
    vue({
      template: { transformAssetUrls }
    }),
    vuetify(),
  ];

  // Only load VueDevTools in development mode
  if (mode === 'development') {
    const VueDevTools = (await import('vite-plugin-vue-devtools')).default;
    plugins.push(VueDevTools());
  }

  return {
    base: "./",
    plugins,
    define:{
      __VUE_PROD_DEVTOOLS__: true
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
          login: resolve(root, 'login.html'),
        },
      },
    },
  };
});
