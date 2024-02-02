const { defineConfig } = require("cypress")
const SSH = require('simple-ssh')
const webpackPreprocessor = require('@cypress/webpack-preprocessor')
const { removeDirectory } = require('cypress-delete-downloads-folder');

module.exports = defineConfig({
  waitForAnimations: true,
  requestTimeout: 30000,
  defaultCommandTimeout: 30000,
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
      "WHEEL_TEST_REMOTEHOST": "testServer",
      "WHEEL_TEST_REMOTE_PASSWORD": "passw0rd",
      "WHEEL_TEST_HOSTNAME": "localhost",
      "WHEEL_TEST_PORT": 4000,
      "WHEEL_TEST_USER": "testuser"
    },
    numTestsKeptInMemory: 50,
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
