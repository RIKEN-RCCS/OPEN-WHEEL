const chai = require("chai");
const { expect } = require("chai");
const chaiIterator = require("chai-iterator");
chai.use(chaiIterator);

//testee
const { workAroundForVersion1, paramVecGenerator } = require("../app/core/parameterParser");

//test data
const floatCalc = [{
  target: "hoge",
  keyword: "KEYWORD1",
  type: "float",
  min: "0.3",
  max: "0.6",
  step: "0.1",
  list: ""
}];
const intCalc = [{
  target: "hoge",
  keyword: "KEYWORD1",
  type: "integer",
  min: "1",
  max: "3",
  step: "1",
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
describe("#paramVecGenerator", ()=>{
  it("retuns calclated float values", ()=>{
    expect(paramVecGenerator(workAroundForVersion1(floatCalc))).to.deep.iterate.over([
      [{ key: "KEYWORD1", value: "0.3", type: "float" }],
      [{ key: "KEYWORD1", value: "0.4", type: "float" }],
      [{ key: "KEYWORD1", value: "0.5", type: "float" }],
      [{ key: "KEYWORD1", value: "0.6", type: "float" }]]);
  });
  it("retuns calclated int values", ()=>{
    expect(paramVecGenerator(workAroundForVersion1(intCalc))).to.deep.iterate.over([
      [{ key: "KEYWORD1", value: "1", type: "integer" }],
      [{ key: "KEYWORD1", value: "2", type: "integer" }],
      [{ key: "KEYWORD1", value: "3", type: "integer" }]]);
  });
  it("retuns float values in the list", ()=>{
    expect(paramVecGenerator(workAroundForVersion1(floatList))).to.deep.iterate.over([
      [{ key: "KEYWORD1", value: "3.14", type: "string" }],
      [{ key: "KEYWORD1", value: "0.08", type: "string" }],
      [{ key: "KEYWORD1", value: "9.2", type: "string" }]]);
  });
  it("retuns int values in the list", ()=>{
    expect(paramVecGenerator(workAroundForVersion1(intList))).to.deep.iterate.over([
      [{ key: "KEYWORD1", value: "1", type: "string" }],
      [{ key: "KEYWORD1", value: "5", type: "string" }],
      [{ key: "KEYWORD1", value: "9", type: "string" }],
      [{ key: "KEYWORD1", value: "13", type: "string" }]]);
  });
  it("retuns string values in the list", ()=>{
    expect(paramVecGenerator(workAroundForVersion1(stringList))).to.deep.iterate.over([
      [{ key: "KEYWORD1", value: "foo", type: "string" }],
      [{ key: "KEYWORD1", value: "bar", type: "string" }],
      [{ key: "KEYWORD1", value: "baz", type: "string" }]]);
  });
});
