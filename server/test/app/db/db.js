/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
import os from "os";
import path from "path";
import fs from "fs-extra";

import * as chai from "chai";
const expect = chai.expect;

import { _internal } from "../../../app/db/db.js";
const { loadWheelConfig, coerce } = _internal;

/**
 * Write a JSON file to a temp path and return the path.
 * @param {string} dir - directory to write to
 * @param {string} filename - file name
 * @param {object} data - data to serialize
 * @returns {string} full file path
 */
async function writeJson(dir, filename, data) {
  await fs.ensureDir(dir);
  const filepath = path.join(dir, filename);
  await fs.writeJson(filepath, data);
  return filepath;
}

describe("loadWheelConfig", function () {
  let origWheelConfigDir;
  let tmpDir;

  beforeEach(async function () {
    origWheelConfigDir = process.env.WHEEL_CONFIG_DIR;
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "wheel-db-test-"));

    //Clear env vars used by loadWheelConfig
    delete process.env.WHEEL_CONFIG_DIR;
  });

  afterEach(async function () {
    //Restore env vars
    if (typeof origWheelConfigDir !== "undefined") {
      process.env.WHEEL_CONFIG_DIR = origWheelConfigDir;
    } else {
      delete process.env.WHEEL_CONFIG_DIR;
    }
    await fs.remove(tmpDir);
  });

  it("returns server.json package defaults when no config files exist", async function () {
    const config = await loadWheelConfig("server.json");
    expect(config).to.be.an("object");
    expect(config.port).to.equal(8089);
  });

  it("applies WHEEL_CONFIG_DIR/server.json as highest priority override", async function () {
    const configDir = path.join(tmpDir, "config");
    await writeJson(configDir, "server.json", { port: 7777 });
    process.env.WHEEL_CONFIG_DIR = configDir;

    const config = await loadWheelConfig("server.json");
    expect(config.port).to.equal(7777);
  });

  it("WHEEL_CONFIG_DIR/server.json overrides ~/.wheel/server.json", async function () {
    const dotWheelDir = path.join(os.homedir(), ".wheel");
    const dotWheelConfig = path.join(dotWheelDir, "server.json");

    let existed = false;
    let originalContent;
    try {
      originalContent = await fs.readFile(dotWheelConfig, "utf-8");
      existed = true;
    } catch (e) {
      if (e.code !== "ENOENT") {
        throw e;
      }
    }

    try {
      await fs.ensureDir(dotWheelDir);
      await fs.writeJson(dotWheelConfig, { port: 5555 });

      const configDir = path.join(tmpDir, "envconfig");
      await writeJson(configDir, "server.json", { port: 6543 });
      process.env.WHEEL_CONFIG_DIR = configDir;

      const config = await loadWheelConfig("server.json");
      expect(config.port).to.equal(6543);
    } finally {
      if (existed) {
        await fs.writeFile(dotWheelConfig, originalContent);
      } else {
        await fs.remove(dotWheelConfig);
      }
    }
  });

  it("uses ~/.wheel/server.json as defaults when no WHEEL_CONFIG_DIR is set", async function () {
    const dotWheelDir = path.join(os.homedir(), ".wheel");
    const dotWheelConfig = path.join(dotWheelDir, "server.json");

    let existed = false;
    let originalContent;
    try {
      originalContent = await fs.readFile(dotWheelConfig, "utf-8");
      existed = true;
    } catch (e) {
      if (e.code !== "ENOENT") {
        throw e;
      }
    }

    try {
      await fs.ensureDir(dotWheelDir);
      await fs.writeJson(dotWheelConfig, { port: 5432 });

      const config = await loadWheelConfig("server.json");
      expect(config.port).to.equal(5432);
    } finally {
      if (existed) {
        await fs.writeFile(dotWheelConfig, originalContent);
      } else {
        await fs.remove(dotWheelConfig);
      }
    }
  });

  it("non-port fields from server.json package defaults are preserved", async function () {
    const config = await loadWheelConfig("server.json");
    expect(config).to.include.keys("numLogFiles");
  });

  it("returns jobScheduler.json package defaults when no config files exist", async function () {
    const config = await loadWheelConfig("jobScheduler.json");
    expect(config).to.be.an("object");
    expect(config).to.include.keys("PBSPro", "SLURM");
  });

  it("applies WHEEL_CONFIG_DIR/jobScheduler.json as highest priority override", async function () {
    const configDir = path.join(tmpDir, "config");
    await writeJson(configDir, "jobScheduler.json", { PBSPro: { submit: "custom-qsub" } });
    process.env.WHEEL_CONFIG_DIR = configDir;

    const config = await loadWheelConfig("jobScheduler.json");
    expect(config.PBSPro.submit).to.equal("custom-qsub");
  });

  it("uses ~/.wheel/jobScheduler.json as defaults when no WHEEL_CONFIG_DIR is set", async function () {
    const dotWheelDir = path.join(os.homedir(), ".wheel");
    const dotWheelConfig = path.join(dotWheelDir, "jobScheduler.json");

    let existed = false;
    let originalContent;
    try {
      originalContent = await fs.readFile(dotWheelConfig, "utf-8");
      existed = true;
    } catch (e) {
      if (e.code !== "ENOENT") {
        throw e;
      }
    }

    try {
      await fs.ensureDir(dotWheelDir);
      await fs.writeJson(dotWheelConfig, { PBSPro: { submit: "user-qsub" } });

      const config = await loadWheelConfig("jobScheduler.json");
      expect(config.PBSPro.submit).to.equal("user-qsub");
    } finally {
      if (existed) {
        await fs.writeFile(dotWheelConfig, originalContent);
      } else {
        await fs.remove(dotWheelConfig);
      }
    }
  });
});

describe("coerce", function () {
  it("should return true for string 'true'", function () {
    expect(coerce("true")).to.equal(true);
  });
  it("should return false for string 'false'", function () {
    expect(coerce("false")).to.equal(false);
  });
  it("should return a number for a numeric string", function () {
    expect(coerce("8089")).to.equal(8089);
  });
  it("should return 0 for string '0'", function () {
    expect(coerce("0")).to.equal(0);
  });
  it("should return undefined for an empty string", function () {
    expect(coerce("")).to.be.undefined;
  });
  it("should return undefined for a whitespace-only string", function () {
    expect(coerce("   ")).to.be.undefined;
  });
  it("should return the original string for a non-boolean, non-numeric string", function () {
    expect(coerce("hello")).to.equal("hello");
  });
  it("should return a number for a string with leading/trailing spaces", function () {
    expect(coerce("  42  ")).to.equal(42);
  });
});
