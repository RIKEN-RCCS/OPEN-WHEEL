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
const { getFilenames } = require("../../app/core/parameterParser");
const { getParamSize } = require("../../app/core/parameterParser");

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
    it("throws an error when ParamSpace is null", ()=>{
      expect(()=>[...paramVecGenerator(null)]).to.throw();
      expect(()=>[...paramVecGenerator({})]).to.throw();
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
  describe("#getFilenames", ()=>{
    it("should return an array of filenames when file type parameters exist", ()=>{
      const paramSpace = [
        { type: "file", list: ["file1.txt", "file2.txt"] },
        { type: "file", list: ["file3.txt"] },
        { type: "integer", min: 1, max: 3, step: 1 } //無関係なデータ
      ];
      const result = getFilenames(paramSpace);
      expect(result).to.deep.equal(["file1.txt", "file2.txt", "file3.txt"]);
    });
    it("should ignore non-file type parameters", ()=>{
      const paramSpace = [
        { type: "integer", min: 1, max: 3, step: 1 },
        { type: "string", list: ["value1", "value2"] }
      ];
      const result = getFilenames(paramSpace);
      expect(result).to.deep.equal([]); //ファイルパスがないため空
    });
    it("should return an empty array if there are no file type parameters", ()=>{
      const paramSpace = [];
      const result = getFilenames(paramSpace);
      expect(result).to.deep.equal([]); //何もない場合も空
    });
    it("should ignore file type parameters with empty lists", ()=>{
      const paramSpace = [
        { type: "file", list: [] }, //空のリスト
        { type: "file", list: ["validFile.txt"] }
      ];
      const result = getFilenames(paramSpace);
      expect(result).to.deep.equal(["validFile.txt"]); //空のリストは無視
    });
  });
  describe("#getParamSize", ()=>{
    it("returns the product of param axis sizes for integer values", ()=>{
      const paramSpace = [{ min: 1, max: 5, step: 1 }, { min: 10, max: 20, step: 5 }];
      expect(getParamSize(paramSpace)).to.equal(5 * 3); //(1,2,3,4,5) → 5個, (10,15,20) → 3個
    });
    it("returns correct size when there is only one parameter", ()=>{
      const paramSpace = [{ min: 1, max: 10, step: 2 }];
      expect(getParamSize(paramSpace)).to.equal(5); //(1,3,5,7,9) → 5個
    });
    it("returns 1 when ParamSpace is empty", ()=>{
      expect(getParamSize([])).to.equal(1);
    });
    it("skips multiplication when a param axis size is 0", ()=>{
      const paramSpace = [{ min: 1, max: 5, step: 1 }, { min: 10, max: 10, step: 1 }, { min: 20, max: 25, step: 5 }];
      expect(getParamSize(paramSpace)).to.equal(5 * 2); //(1,2,3,4,5) → 5個, (20,25) → 2個
    });
    it("handles floating point values correctly", ()=>{
      const paramSpace = [{ min: 1.0, max: 2.0, step: 0.1 }, { min: 0.0, max: 1.0, step: 0.2 }];
      expect(getParamSize(paramSpace)).to.equal(11 * 6); //(1.0,1.1,...,2.0) → 11個, (0.0,0.2,0.4,0.6,0.8,1.0) → 6個
    });
    it("handles negative values", ()=>{
      const paramSpace = [{ min: -5, max: -1, step: 1 }, { min: -10, max: 10, step: 5 }];
      expect(getParamSize(paramSpace)).to.equal(5 * 5); //(-5,-4,-3,-2,-1) → 5個, (-10,-5,0,5,10) → 5個
    });
    it("handles mixed positive and negative values", ()=>{
      const paramSpace = [{ min: -5, max: 5, step: 2 }];
      expect(getParamSize(paramSpace)).to.equal(6); //(-5,-3,-1,1,3,5) → 6個
    });
    it("handles large values correctly", ()=>{
      const paramSpace = [{ min: 1e6, max: 1e6 + 1000, step: 100 }];
      expect(getParamSize(paramSpace)).to.equal(11); //(1000000,1000100,...,1001000) → 11個
    });
    it("throws an error when ParamSpace is null", ()=>{
      expect(()=>getParamSize(null)).to.throw();
    });
    it("throws an error when ParamSpace is undefined", ()=>{
      expect(()=>getParamSize(undefined)).to.throw();
    });
    it("throws an error when a parameter object is missing required properties", ()=>{
      const paramSpace = [{ foo: 3 }];
      expect(()=>getParamSize(paramSpace)).to.throw();
    });
  });
});
