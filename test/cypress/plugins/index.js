/// <reference types="cypress" />
const fs = require('fs');
const path = require('path');

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on, config) => {
  on('task', {
    backupFile({ src, dest }) {
      return new Promise((resolve, reject) => {
        const destDir = path.dirname(dest);
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        fs.copyFile(src, dest, (err) => {
          if (err) {
            return reject(err);
          }
          resolve(null);
        });
      });
    },
    restoreFile({ src, dest }) {
      return new Promise((resolve, reject) => {
        fs.copyFile(src, dest, (err) => {
          if (err) {
            return reject(err);
          }
          fs.unlink(src, (err) => {
            if (err) {
              return reject(err);
            }
            resolve(null);
          });
        });
      });
    }
  });
};