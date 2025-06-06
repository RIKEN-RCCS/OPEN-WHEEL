const { defineConfig } = require("cypress")
const SSH = require('simple-ssh')
const webpackPreprocessor = require('@cypress/webpack-preprocessor')
const { removeDirectory } = require('cypress-delete-downloads-folder');

module.exports = defineConfig({
  waitForAnimations: true,
  requestTimeout: 3000,
  defaultCommandTimeout: 10000,
  video: true,
  retries: 2,
  component: {
    devServer: {
      framework: "vue",
      bundler: "vite",
    },
  },

  e2e: {
    env: {
      browserPermissions: {
        clipboard: "allow"
      },
      WHEEL_TEST_REMOTEHOST: "testServer",
      WHEEL_TEST_REMOTE_PASSWORD: "passw0rd",
      WHEEL_TEST_HOSTNAME: "localhost",
      WHEEL_TEST_PORT: 8000,
      WHEEL_TEST_USER: "testuser",
      WHEEL_PATH: '/root'
    },
    numTestsKeptInMemory: 1,
    experimentalMemoryManagement: true,
    baseUrl: `http://localhost:8089`,
    setupNodeEvents(on, config) {
      on('task', {
        removeDirectory,
        log(message) {
          console.log(message)
    
          return null
        },
        sshExecuteCmd({sshconn, command}) {
          return new Promise((resolve, reject) => {
            let ssh = new SSH(sshconn)
    
            ssh.exec(command, {
              out: function (stdout) {
                console.log("stdout: " + stdout)
                resolve(stdout)
              },
              err: function (stderr) {
                console.log("stderr: " + stderr)
                resolve(stderr)
              },
            }).on('ready', () => {console.log('READY')})
            .on('error', (err) => {
              console.log('ERROR')
              console.log(err)
            })
            .start()
          })
        }
      })
    },
  },
})
