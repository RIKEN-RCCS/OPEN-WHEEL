import { defineConfig } from "cypress";
import SSH from "simple-ssh";
import { removeDirectory } from "cypress-delete-downloads-folder";
import fs from "fs-extra";
import * as tar from "tar";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import mockServer from "./mock_server/server.js";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  waitForAnimations: true,
  trashAssetsBeforeRuns: false,
  requestTimeout: 5000,
  experimentalMemoryManagement: true,
  defaultCommandTimeout: 5000,
  video: false,
  retries: 0,
  numTestsKeptInMemory: 0,
  component: {
    devServer: {
      framework: "vue",
      bundler: "vite",
      viteConfig: async ()=>{
        const { default: vue } = await import("@vitejs/plugin-vue");
        return {
          plugins: [vue()],
          resolve: {
            alias: {
              "@": path.resolve(__dirname, "../client/src")
            },
            dedupe: ["vue", "vuetify"]
          },
          optimizeDeps: {
            include: ["vue", "vuetify"]
          },
          server: {
            fs: {
              allow: [
                __dirname, //test/
                path.resolve(__dirname, ".."), //open-wheel/
                path.resolve(__dirname, "../client") //client/
              ],
              strict: false
            }
          }
        };
      }
    },
    supportFile: "cypress/support/component.js",
    indexHtmlFile: "cypress/support/component-index.html",
    specPattern: "cypress/component/**/*.cy.{js,jsx,ts,tsx}",
    devServerPublicPathRoute: ""
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
      WHEEL_PATH: "/root",
      USE_MOCK: true,
      WHEEL_TEST_AUTH_URL: "http://localhost:8090",
      WHEEL_TEST_LOGIN_PASSWORD: "WheelTest123!"
    },
    baseUrl: `http://localhost:8089`,
    setupNodeEvents(on) {
      process.env.MOCK_DEBUG = process.env.MOCK_DEBUG ?? "0";
      process.env.GW_DEBUG = process.env.GW_DEBUG ?? "0";

      /*
       * Prevent Chrome renderer OOM crashes on memory-intensive test suites.
       * --disable-dev-shm-usage: use file-backed shared memory instead of /dev/shm
       *   (prevents exhaustion of the 64MB /dev/shm limit in Docker containers on Linux).
       * --js-flags=--max-old-space-size=4096: increase V8 heap to 4 GB so the renderer
       *   does not OOM after running the memory-intensive home.cy.js suite (20 tests,
       *   testIsolation:false, cytoscape.js graph navigation) before importProject.cy.js.
       */
      on("before:browser:launch", (browser, launchOptions)=>{
        if (browser.name === "chrome") {
          launchOptions.args.push("--disable-dev-shm-usage");
          launchOptions.args.push("--js-flags=--max-old-space-size=4096");
        }
        return launchOptions;
      });
      on("task", {
        "start:mock-server": (port)=>{
          return mockServer.start(port);
        },
        "stop:mock-server": ()=>{
          return mockServer.stop();
        },
        "resetMockProjectList": ()=>{
          //Connect to Docker mock via socket.io-client and reset project list
          return new Promise((resolve, reject)=>{
            const { io: sioClient } = require("socket.io-client");
            const client = sioClient("http://localhost:3101", { path: "/socket.io/", transports: ["websocket"] });
            const timeoutId = setTimeout(()=>{
              client.disconnect();
              reject(new Error("resetMockProjectList: connection timeout"));
            }, 5000);
            client.on("connect", ()=>{
              client.emit("__testResetProjectList", (ok)=>{
                clearTimeout(timeoutId);
                client.disconnect();
                resolve(ok);
              });
            });
            client.on("connect_error", (err)=>{
              clearTimeout(timeoutId);
              client.disconnect();
              reject(err);
            });
          });
        },
        "setupMockCleanTest": (componentName)=>{
          const result = mockServer.setupCleanComponentTest(componentName);
          if (result !== false) return result;
          //Local mock server not running; connect via socket.io-client to Docker mock
          return new Promise((resolve, reject)=>{
            const { io: sioClient } = require("socket.io-client");
            const client = sioClient("http://localhost:3101", { path: "/socket.io/", transports: ["websocket"] });
            const timeoutId = setTimeout(()=>{
              client.disconnect();
              reject(new Error("setupMockCleanTest: connection timeout"));
            }, 5000);
            client.on("connect", ()=>{
              client.emit("__testSetupCleanComponent", componentName, (ok)=>{
                clearTimeout(timeoutId);
                client.disconnect();
                resolve(ok);
              });
            });
            client.on("connect_error", (err)=>{
              clearTimeout(timeoutId);
              client.disconnect();
              reject(err);
            });
          });
        },
        removeDirectory,
        log(message) {
          console.log(message);

          return null;
        },
        sshExecuteCmd({ sshconn, command }) {
          return new Promise((resolve)=>{
            let ssh = new SSH(sshconn);

            ssh.exec(command, {
              out: function (stdout) {
                console.log("stdout: " + stdout);
                resolve(stdout);
              },
              err: function (stderr) {
                console.log("stderr: " + stderr);
                resolve(stderr);
              }
            }).on("ready", ()=>{ console.log("READY"); })
              .on("error", (err)=>{
                console.log("ERROR");
                console.log(err);
              })
              .start();
          });
        },
        async extractTarArchive({ file, cwd }) {
          await tar.x({ file, cwd });
          return fs.readdir(cwd);
        },
        async fileExists(filePath) {
          return fs.pathExists(filePath);
        },
        async readJson(filePath) {
          return fs.readJson(filePath)
            .catch((err)=>{
              console.error(err);
              return null;
            });
        },
        async deleteFile(filePath) {
          return fs.remove(filePath)
            .catch((err)=>{
              console.error(err);
              return null;
            })
            .then(()=>{
              return true;
            });
        },
        async writeJson({ filePath, data }) {
          await fs.writeJson(filePath, data, { spaces: 4 });
          return true;
        }
      });
    }
  }
});
