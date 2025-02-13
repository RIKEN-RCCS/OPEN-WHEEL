/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
const chai = require("chai");
const { expect } = require("chai");
const chaiIterator = require("chai-iterator");
chai.use(chaiIterator);
const fs = require("fs-extra");
const path = require("path");

//testee
const { paramVecGenerator } = require("../../app/core/parameterParser");
const { getParamSpacev2 } = require("../../app/core/parameterParser");

//test data
const floatCalc = [{
  target: "hoge",
  keyword: "KEYWORD1",
  type: "float",
  min: 0.3,
  max: 0.6,
  step: 0.1,
  list: ""
}];
const intCalc = [{
  target: "hoge",
  keyword: "KEYWORD1",
  type: "integer",
  min: 1,
  max: 3,
  step: 1,
  list: ""
}];
const floatList = [{
  target: "hoge",
  keyword: "KEYWORD1",
  type: "string",
  min: "",
  max: "",
  step: "",
  list: [
    "3.14",
    "0.08",
    "9.2"
  ]
}];
const intList = [{
  target: "hoge",
  keyword: "KEYWORD1",
  type: "string",
  min: "",
  max: "",
  step: "",
  list: [
    "1",
    "5",
    "9",
    "13"
  ]
}];
const stringList = [{
  target: "test",
  keyword: "KEYWORD1",
  type: "string",
  list: [
    "foo",
    "bar",
    "baz"
  ]
}];

//actual test start here
describe("UT for parameterParser", ()=>{
  describe("#paramVecGenerator", ()=>{
    it("retuns calclated float values", ()=>{
      expect(paramVecGenerator(floatCalc)).to.deep.iterate.over([
        [{ key: "KEYWORD1", value: "0.3", type: "float" }],
        [{ key: "KEYWORD1", value: "0.4", type: "float" }],
        [{ key: "KEYWORD1", value: "0.5", type: "float" }],
        [{ key: "KEYWORD1", value: "0.6", type: "float" }]]);
    });
    it("retuns calclated int values", ()=>{
      expect(paramVecGenerator(intCalc)).to.deep.iterate.over([
        [{ key: "KEYWORD1", value: "1", type: "integer" }],
        [{ key: "KEYWORD1", value: "2", type: "integer" }],
        [{ key: "KEYWORD1", value: "3", type: "integer" }]]);
    });
    it("retuns float values in the list", ()=>{
      expect(paramVecGenerator(floatList)).to.deep.iterate.over([
        [{ key: "KEYWORD1", value: "3.14", type: "string" }],
        [{ key: "KEYWORD1", value: "0.08", type: "string" }],
        [{ key: "KEYWORD1", value: "9.2", type: "string" }]]);
    });
    it("retuns int values in the list", ()=>{
      expect(paramVecGenerator(intList)).to.deep.iterate.over([
        [{ key: "KEYWORD1", value: "1", type: "string" }],
        [{ key: "KEYWORD1", value: "5", type: "string" }],
        [{ key: "KEYWORD1", value: "9", type: "string" }],
        [{ key: "KEYWORD1", value: "13", type: "string" }]]);
    });
    it("retuns string values in the list", ()=>{
      expect(paramVecGenerator(stringList)).to.deep.iterate.over([
        [{ key: "KEYWORD1", value: "foo", type: "string" }],
        [{ key: "KEYWORD1", value: "bar", type: "string" }],
        [{ key: "KEYWORD1", value: "baz", type: "string" }]]);
    });
  });
  describe("#getParamSpacev2", function () {
    const testRoot = "WHEEL_TEST_TMP";
    const testDir = path.resolve(testRoot, "paramParserDir");
    before(async function () {
      await fs.ensureDir(testDir);
      await Promise.all([
        fs.outputFile(path.resolve(testDir, "file1.txt"), "test1"),
        fs.outputFile(path.resolve(testDir, "file2.txt"), "test2"),
        fs.outputFile(path.resolve(testDir, "file3.log"), "test3")
      ]);
    });
    after(async function () {
      await fs.remove(testDir);
    });
    it("should expand file globs correctly", async function () {
      const paramSpace = [
        { target: "fileParam", files: ["*.txt"] }
      ];
      const result = await getParamSpacev2(paramSpace, testDir);
      expect(result).to.deep.equal([
        { target: "fileParam", files: ["*.txt"], type: "file", list: ["file1.txt", "file2.txt"] }
      ]);
    });
    it("should filter out invalid parameters", async function () {
      const paramSpace = [
        { target: "valid1", min: 1, max: 10, step: 2 },
        { target: "invalid1", min: 1, max: 10 }, //stepがないため無効
        { target: "valid2", list: ["a", "b", "c"] },
        { target: "invalid2", list: [] }, //空のlistは無効
        { target: "valid3", files: ["*.log"] } //ファイルがある
      ];
      const result = await getParamSpacev2(paramSpace, testDir);
      expect(result).to.deep.equal([
        { target: "valid1", min: 1, max: 10, step: 2 },
        { target: "valid2", list: ["a", "b", "c"] },
        { target: "valid3", files: ["*.log"], type: "file", list: ["file3.log"] }
      ]);
    });
  });
});
