import { defineConfig } from 'cypress'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)

export default defineConfig({
  component: {
    devServer: {
      framework: 'vue',
      bundler: 'vite',
      viteConfig: {
        plugins: [vue()],  
        resolve: {
          alias: {
            '@': path.resolve(__dirname, '../client/src'),
          },
         dedupe: ['vue', 'vuetify'],
         },
        optimizeDeps: {
          include: ['vue', 'vuetify'],
        },
        server: {
          fs: {
            allow: [
              __dirname,                             // test/
              path.resolve(__dirname, '..'),         // open-wheel/
              path.resolve(__dirname, '../client'),  // client/
            ],
            strict: false, 
          },
        },
      },
    },
    specPattern: 'cypress/component/**/*.cy.{js,ts,jsx,tsx}',
    supportFile: 'cypress/support/component.js',
    indexHtmlFile: 'cypress/support/component-index.html',
  },

  e2e: {
    env: {
      browserPermissions: { clipboard: 'allow' },
      WHEEL_TEST_REMOTEHOST: 'testServer',
      WHEEL_TEST_REMOTE_PASSWORD: 'passw0rd',
      WHEEL_TEST_HOSTNAME: 'localhost',
      WHEEL_TEST_PORT: 8000,
      WHEEL_TEST_USER: 'testuser',
      WHEEL_PATH: '/root',
    },
    baseUrl: 'http://localhost:8089',
    setupNodeEvents(on) {
      on('task', {
        removeDirectory,
        log(message) {
          console.log(message)
          return null
        },
        sshExecuteCmd({ sshconn, command }) {
          return new Promise((resolve) => {
            const ssh = new SSH(sshconn)
            ssh.exec(command, {
              out(stdout) {
                console.log('stdout: ' + stdout)
                resolve(stdout)
              },
              err(stderr) {
                console.log('stderr: ' + stderr)
                resolve(stderr)
              },
            })
              .on('ready', () => { console.log('READY') })
              .on('error', (err) => {
                console.log('ERROR')
                console.log(err)
              })
              .start()
          })
        },
        async extractTarArchive({ file, cwd }) {
          await tar.x({ file, cwd })
          return fs.readdir(cwd)
        },
        async fileExists(filePath) {
          return fs.pathExists(filePath)
        },
        async readJson(filePath) {
          return fs.readJson(filePath).catch((err) => {
            console.error(err)
            return null
          })
        },
        async deleteFile(filePath) {
          return fs.remove(filePath)
            .catch((err) => {
              console.error(err)
              return null
            })
            .then(() => true)
        },
      })
    },
  },
})
