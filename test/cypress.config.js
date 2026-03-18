import { defineConfig } from "cypress";
import SSH from "simple-ssh";
import { removeDirectory } from "cypress-delete-downloads-folder";
import fs from "fs-extra";
import * as tar from "tar";
import vue from "@vitejs/plugin-vue";
import path from "path";
import { fileURLToPath } from "url";
import mockServer from "./mock_server/server.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  waitForAnimations: true,
  trashAssetsBeforeRuns: false,
  requestTimeout: 3000,
  experimentalMemoryManagement: true,
  defaultCommandTimeout: 5000,
  video: false,
  retries: 0,
  numTestsKeptInMemory: 0,
  component: {
    devServer: {
      framework: "vue",
      bundler: "vite",
      viteConfig: {
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
      USE_MOCK: true
    },
    baseUrl: `http://localhost:8089`,
    setupNodeEvents(on) {
      on("task", {
        "start:mock-server": (port)=>{
          return mockServer.start(port);
        },
        "stop:mock-server": ()=>{
          return mockServer.stop();
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
        }
      });
    }
  }
});
