import { defineConfig } from "cypress";
import SSH from "simple-ssh";
import { removeDirectory } from "cypress-delete-downloads-folder";
import fs from "fs-extra";
import tar from "tar";
import path from "path";

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
      bundler: "vite"
    }
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
      WHEEL_PATH: "/root"
    },
    numTestsKeptInMemory: 1,
    experimentalMemoryManagement: true,
    baseUrl: `http://localhost:8089`,
    setupNodeEvents(on) {
      on("task", {
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
        readJson(filePath) {
          return fs.readJson(filePath).catch((err)=>{
            console.error(err);
            return null;
          });
        },
        backupFile({ src, dest }) {
          return new Promise((resolve, reject)=>{
            const destDir = path.dirname(dest);
            if (!fs.existsSync(destDir)) {
              fs.mkdirSync(destDir, { recursive: true });
            }
            fs.copyFile(src, dest, (err)=>{
              if (err) {
                return reject(err);
              }
              resolve(null);
            });
          });
        },
        restoreFile({ src, dest }) {
          return new Promise((resolve, reject)=>{
            fs.copyFile(src, dest, (err)=>{
              if (err) {
                return reject(err);
              }
              fs.unlink(src, (err)=>{
                if (err) {
                  return reject(err);
                }
                resolve(null);
              });
            });
          });
        }
      });
    }
  }
});
