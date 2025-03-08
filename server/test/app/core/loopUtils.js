/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";
//setup test framework
const chai = require("chai");
const expect = chai.expect;
chai.use(require("chai-as-promised"));
const rewire = require("rewire");
const sinon = require("sinon");

//testee
const {
  forTripCount,
  loopInitialize,
  foreachTripCount,
  foreachIsFinished,
  foreachGetPrevIndex,
  foreachGetNextIndex,
  whileGetNextIndex,
  forIsFinished,
  forGetNextIndex,
  getPrevIndex,
  getInstanceDirectoryName
} = require("../../../app/core/loopUtils.js");

describe("UT for getInstanceDirectoryName", ()=>{
  it("should build name using name & index", ()=>{
    expect(getInstanceDirectoryName({}, 0, "dummy")).to.be.equal("dummy_0");
  });

  it("should use component.currentIndex instead when index is undefined", ()=>{
    expect(
      getInstanceDirectoryName({ currentIndex: 0 }, undefined, "dummy")
    ).to.be.equal("dummy_0");
  });

  it("should use component.originalName instead when originalName is undefined", ()=>{
    expect(
      getInstanceDirectoryName({ originalName: "dummy" }, 0, undefined)
    ).to.be.equal("dummy_0");
  });

  it("should sanitize index", ()=>{
    expect(getInstanceDirectoryName({}, "0/0", "dummy")).to.be.equal(
      "dummy_0_0"
    );
  });

  it("should not sanitize name", ()=>{
    expect(getInstanceDirectoryName({}, "0", "dummy/dummy")).to.be.equal(
      "dummy/dummy_0"
    );
  });
});

describe("UT for getPrevIndex", ()=>{
  it("should return prevIndex when forceCalc is false & prevIndex is not undefined", ()=>{
    expect(getPrevIndex({ prevIndex: 1 }, false)).to.be.equal(1);
  });

  it("should calc index when forceCalc is false & prevIndex is undefined", ()=>{
    expect(
      getPrevIndex(
        {
          step: 1,
          start: 0,
          currentIndex: 1
        },
        false
      )
    ).to.be.equal(0);
  });

  it("should calc index when forceCals is true & prevIndex is not undefined", ()=>{
    expect(
      getPrevIndex(
        {
          prevIndex: 1,
          step: 1,
          start: 0,
          currentIndex: 1
        },
        true
      )
    ).to.be.equal(0);
  });

  it("should return previous index", ()=>{
    expect(
      getPrevIndex(
        {
          step: 1,
          start: 0,
          currentIndex: 1
        },
        true
      )
    ).to.be.equal(0);
  });

  it("should return null when previous index does not exist", ()=>{
    expect(
      getPrevIndex(
        {
          step: 1,
          start: 0,
          currentIndex: 0
        },
        true
      )
    ).to.be.null;
  });

  it("should calc index by considering step as 1 when step is falsy", ()=>{
    expect(
      getPrevIndex(
        {
          start: 0,
          currentIndex: 2
        },
        true
      )
    ).to.be.equal(1);
  });

  it("should calc index by considering start as 0 when start is falsy", ()=>{
    expect(
      getPrevIndex(
        {
          step: 1,
          currentIndex: 0
        },
        true
      )
    ).to.be.null;
  });
});

describe("UT for loopInitialize()", ()=>{
  let component;

  beforeEach(()=>{
    component = {
      name: "dummy",
      env: {},
      type: "dummy"
    };
  });

  it("should be initialized component", ()=>{
    loopInitialize(component);
    expect(component).to.deep.equal({
      numFinished: 0,
      numFailed: 0,
      currentIndex: 0,
      name: "dummy",
      originalName: "dummy",
      env: {},
      type: "dummy",
      initialized: true
    });
  });

  it("currentIndex should be set when having indexList of array type", ()=>{
    component = {
      ...component,
      indexList: [1, 2]
    };
    loopInitialize(component);
    expect(component.currentIndex).to.be.equal(1);
  });

  it("currentIndex should be set when having start is not undefined", ()=>{
    component = {
      ...component,
      start: 1
    };
    loopInitialize(component);
    expect(component.currentIndex).to.be.equal(1);
  });

  it("indexList has priority over start when setting currentIndex", ()=>{
    component = {
      ...component,
      indexList: [1],
      start: 2
    };
    loopInitialize(component);
    expect(component.currentIndex).to.be.equal(1);
  });

  it("numTotal should be set when getTripCount is available", ()=>{
    component = {
      ...component,
      dummy: 1
    };
    loopInitialize(component, (component)=>{
      return component.dummy + 1;
    });
    expect(component.numTotal).to.be.equal(2);
  });

  it("env should be set when env is undefined", ()=>{
    delete component.env;
    loopInitialize(component);
    expect(component.env).to.deep.equal({});
  });

  it("WHEEL_FOR_START shoulde be set when start is not undefined", ()=>{
    component = {
      ...component,
      start: 1
    };
    loopInitialize(component);
    expect(component.env.WHEEL_FOR_START).to.be.equal(1);
  });

  it("WHEEL_FOR_END shoulde be set when end is not undefined", ()=>{
    component = {
      ...component,
      end: 1
    };
    loopInitialize(component);
    expect(component.env.WHEEL_FOR_END).to.be.equal(1);
  });

  it("WHEEL_FOR_STEP shoulde be set when step is not undefined", ()=>{
    component = {
      ...component,
      step: 1
    };
    loopInitialize(component);
    expect(component.env.WHEEL_FOR_STEP).to.be.equal(1);
  });

  it("WHEEL_LOOP_LEN shoulde be set when numTotal is not undefined", ()=>{
    component = {
      ...component,
      numTotal: 1
    };
    loopInitialize(component);
    expect(component.env.WHEEL_LOOP_LEN).to.be.equal(1);
  });

  it("WHEEL_FOREACH_LEN shoulde be set when type is foreach", ()=>{
    component = {
      ...component,
      type: "foreach",
      numTotal: 1
    };
    loopInitialize(component);
    expect(component.env.WHEEL_FOREACH_LEN).to.be.equal(1);
  });
});

describe("UT for forGetNextIndex", ()=>{
  it("should return next index when currentIndex is not null", ()=>{
    expect(
      forGetNextIndex({
        currentIndex: 1,
        step: 2
      })
    ).to.be.equal(3);
  });

  it("should return start index when currentIndex is null", ()=>{
    expect(
      forGetNextIndex({
        currentIndex: null,
        start: 3
      })
    ).to.be.equal(3);
  });
});

describe("UT for forIsFinished", ()=>{
  it("should return true when positive step & current index is greater than last index", ()=>{
    expect(
      forIsFinished({
        currentIndex: 2,
        end: 1,
        step: 1
      })
    ).to.be.equal(true);
  });

  it("should return false when positive step & current index is last index or less than last index", ()=>{
    expect(
      forIsFinished({
        currentIndex: 2,
        end: 2,
        step: 1
      })
    ).to.be.equal(false);
  });

  it("should return true when negative step & current index is less than last index", ()=>{
    expect(
      forIsFinished({
        currentIndex: 1,
        end: 2,
        step: -1
      })
    ).to.be.equal(true);
  });

  it("should return false when positive step & current index is last index or greater than last index", ()=>{
    expect(
      forIsFinished({
        currentIndex: 2,
        end: 2,
        step: 1
      })
    ).to.be.equal(false);
  });
});

describe("UT for whileGetNextIndex", ()=>{
  it("should return next index when currentIndex is not null", ()=>{
    expect(whileGetNextIndex({ currentIndex: 1 })).to.be.equal(2);
  });

  it("should return 0 when currentIndex is null", ()=>{
    expect(whileGetNextIndex({ currentIndex: null })).to.be.equal(0);
  });
});

describe("UT for whileIsFinished", ()=>{
  let whileIsFinished;
  let evalConditionStub;

  beforeEach(()=>{
    const loopUtils = rewire("../../../app/core/loopUtils.js");
    whileIsFinished = loopUtils.whileIsFinished;
    evalConditionStub = sinon.stub();
    loopUtils.__set__({
      evalCondition: evalConditionStub
    });
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should return true when condition is true", async ()=>{
    evalConditionStub.withArgs("/projectRootDir", "condition", "/cwdDir/name", sinon.match({})).returns("condition");
    expect(await whileIsFinished("/cwdDir", "/projectRootDir", { name: "name", condition: "condition", currentIndex: 1 }, {})).to.be.false;
  });

  it("should return false when condition is false", async ()=>{
    evalConditionStub.withArgs("/projectRootDir", "condition", "/cwdDir/name", sinon.match({})).returns("");
    expect(await whileIsFinished("/cwdDir", "/projectRootDir", { name: "name", condition: "condition", currentIndex: 1 }, {})).to.be.true;
  });

  it("should set 0 to env.WHEEL_CURRENT_INDEX  when component.currentIndex is null", async ()=>{
    const env = {};
    evalConditionStub.withArgs("/projectRootDir", "condition", "/cwdDir/name", env).returns("condition");
    await whileIsFinished("/cwdDir", "/projectRootDir", { name: "name", condition: "condition", currentIndex: null }, env);
    expect(env.WHEEL_CURRENT_INDEX).to.be.equal(0);
  });

  it("should set currentIndex to env.WHEEL_CURRENT_INDEX when component.currentIndex is not null", async ()=>{
    const env = {};
    evalConditionStub.withArgs("/projectRootDir", "condition", "/cwdDir/name", env).returns("condition");
    await whileIsFinished("/cwdDir", "/projectRootDir", { name: "name", condition: "condition", currentIndex: 1 }, env);
    expect(env.WHEEL_CURRENT_INDEX).to.be.equal(1);
  });
});

describe("UT foreachGetNextIndex", ()=>{
  it("should return first index when currentIndex null", ()=>{
    expect(
      foreachGetNextIndex({
        currentIndex: null,
        indexList: [2, 3]
      })
    ).to.be.equal(2);
  });

  it("should return next index when currentIndex it not null", ()=>{
    expect(
      foreachGetNextIndex({
        currentIndex: 2,
        indexList: [2, 3]
      })
    ).to.be.equal(3);
  });

  it("should return null when currentIndex is last index", ()=>{
    expect(
      foreachGetNextIndex({
        currentIndex: 3,
        indexList: [2, 3]
      })
    ).to.be.equal(null);
  });

  it("should return null when currentIndex is not in indexList", ()=>{
    expect(
      foreachGetNextIndex({
        currentIndex: 1,
        indexList: [2, 3]
      })
    ).to.be.equal(null);
  });
});

describe("UT foreachGetPrevIndex", ()=>{
  it("should return prevIndex when forceCals is false and prevIndex is not undefined", ()=>{
    expect(foreachGetPrevIndex({ prevIndex: 1 }, false)).to.be.equal(1);
  });

  it("should calc index when forceCalc is false and prevIndex is undefined", ()=>{
    expect(
      foreachGetPrevIndex(
        {
          indexList: [2, 3],
          currentIndex: 3
        },
        false
      )
    ).to.be.equal(2);
  });

  it("should calc index when forceCalc is true and prevIndex is not undefined", ()=>{
    expect(
      foreachGetPrevIndex(
        {
          prevIndex: 1,
          indexList: [2, 3],
          currentIndex: 3
        },
        true
      )
    ).to.be.equal(2);
  });

  it("should return previous index", ()=>{
    expect(
      foreachGetPrevIndex(
        {
          indexList: [2, 3],
          currentIndex: 3
        },
        true
      )
    ).to.be.equal(2);
  });

  it("should be return null when currentIndex is fast index", ()=>{
    expect(
      foreachGetPrevIndex(
        {
          indexList: [2, 3],
          currentIndex: 2
        },
        true
      )
    ).to.be.equal(null);
  });

  it("should be return null when currentIndex is not in indexList", ()=>{
    expect(
      foreachGetPrevIndex(
        {
          indexList: [2, 3],
          currentIndex: 4
        },
        true
      )
    ).to.be.equal(null);
  });
});

describe("UT for foreachIsFinished()", ()=>{
  it("should return false when currentIndex in indexList", ()=>{
    expect(
      foreachIsFinished({
        indexList: [1],
        currentIndex: 1
      })
    ).to.be.equal(false);
  });

  it("should return true when currentIndex not in indexList", ()=>{
    expect(
      foreachIsFinished({
        indexList: [1],
        currentIndex: 2
      })
    ).to.be.equal(true);
  });
});

describe("UT for foreachTripCount()", ()=>{
  it("should return 0 when indexList is empty", ()=>{
    expect(foreachTripCount({ indexList: [] })).to.be.equal(0);
  });

  it("should return indexList size when indexList contains elements", ()=>{
    expect(foreachTripCount({ indexList: [1] })).to.be.equal(1);
  });
});

describe("UT foreachKeepLoopInstance()", ()=>{
  let foreachKeepLoopInstance;
  let getInstanceDirectoryNameStub;
  let removeStub;

  beforeEach(()=>{
    const loopUtils = rewire("../../../app/core/loopUtils.js");
    foreachKeepLoopInstance = loopUtils.foreachKeepLoopInstance;
    getInstanceDirectoryNameStub = sinon.stub();
    removeStub = sinon.stub();
    loopUtils.__set__({
      getInstanceDirectoryName: getInstanceDirectoryNameStub,
      fs: { remove: removeStub }
    });
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should return nothing if component.keep is not number", async ()=>{
    const result = await foreachKeepLoopInstance({
      keep: "dummy"
    });
    expect(result).to.be.undefined;
  });

  it("should return nothing if component.keep is less than 0", async ()=>{
    const result = await foreachKeepLoopInstance({
      keep: -1
    });
    expect(result).to.be.undefined;
  });

  it("should use component.currentIndex for calculation of removing target when component.currentIndex is not null", async ()=>{
    const component = {
      indexList: [1, 2, 3, 4],
      currentIndex: 3,
      keep: 1
    };
    getInstanceDirectoryNameStub
      .withArgs(sinon.match(component), 2)
      .returns("dummy");
    await foreachKeepLoopInstance(component, "/cwdDir");
    expect(removeStub.calledWith("/cwdDir/dummy")).to.be.true;
  });

  it("should use component.indexList.length for calculation of removing target when component.currentIndex is null", async ()=>{
    const component = {
      indexList: [1, 2, 3, 4],
      currentIndex: null,
      keep: 1
    };
    getInstanceDirectoryNameStub
      .withArgs(sinon.match(component), 4)
      .returns("dummy");
    await foreachKeepLoopInstance(component, "/cwdDir");
    expect(removeStub.calledWith("/cwdDir/dummy")).to.be.true;
  });

  it("should not remove anything when keep is greater than indexList.length", async ()=>{
    const component = {
      indexList: [1, 2, 3, 4],
      currentIndex: null,
      keep: 4
    };
    await foreachKeepLoopInstance(component, "/cwdDir");
    expect(removeStub.called).to.be.false;
  });
});

describe("UT for foreachSearchLatestFinishedIndex", ()=>{
  let foreachSearchLatestFinishedIndex;
  let getInstanceDirectoryNameStub;
  let readComponentJsonStub;

  beforeEach(()=>{
    const loopUtils = rewire("../../../app/core/loopUtils.js");
    foreachSearchLatestFinishedIndex = loopUtils.foreachSearchLatestFinishedIndex;
    getInstanceDirectoryNameStub = sinon.stub();
    readComponentJsonStub = sinon.stub();
    loopUtils.__set__({
      getInstanceDirectoryName: getInstanceDirectoryNameStub,
      readComponentJson: readComponentJsonStub
    });
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should return null when indexList is empty", async ()=>{
    expect(await foreachSearchLatestFinishedIndex({ indexList: [] }, "/cwdDir")).to.be.null;
  });

  it("should return null when indexList is not empty but all index is not finished", async ()=>{
    const component = {
      indexList: [1]
    };
    getInstanceDirectoryNameStub.withArgs(sinon.match(component), 1).returns("dummy");
    readComponentJsonStub.withArgs("/cwdDir/dummy").resolves({ state: "running" });
    expect(await foreachSearchLatestFinishedIndex(component, "/cwdDir")).to.be.null;
  });

  it("should return latest finished index when indexList is not empty and some index is finished", async ()=>{
    const component = {
      indexList: [1, 2, 3]
    };
    getInstanceDirectoryNameStub.withArgs(sinon.match(component), 1).returns("dummy1");
    getInstanceDirectoryNameStub.withArgs(sinon.match(component), 2).returns("dummy2");
    getInstanceDirectoryNameStub.withArgs(sinon.match(component), 3).returns("dummy3");
    readComponentJsonStub.withArgs("/cwdDir/dummy1").resolves({ state: "finished" });
    readComponentJsonStub.withArgs("/cwdDir/dummy2").resolves({ state: "finished" });
    readComponentJsonStub.withArgs("/cwdDir/dummy3").resolves({ state: "running" });
    expect(await foreachSearchLatestFinishedIndex(component, "/cwdDir")).to.be.equal(2);
  });

  it("should return previous finished index when next index directory is not exist", async ()=>{
    const component = {
      indexList: [1, 2, 3]
    };
    const error = new Error("dummy");
    error.code = "ENOENT";
    getInstanceDirectoryNameStub.withArgs(sinon.match(component), 1).returns("dummy1");
    getInstanceDirectoryNameStub.withArgs(sinon.match(component), 2).returns("dummy2");
    getInstanceDirectoryNameStub.withArgs(sinon.match(component), 3).returns("dummy3");
    readComponentJsonStub.withArgs("/cwdDir/dummy1").resolves({ state: "finished" });
    readComponentJsonStub.withArgs("/cwdDir/dummy2").resolves({ state: "finished" });
    readComponentJsonStub.withArgs("/cwdDir/dummy3").rejects(error);
    expect(await foreachSearchLatestFinishedIndex(component, "/cwdDir")).to.be.equal(2);
  });

  it("should throw error when error is not ENOENT", async ()=>{
    const component = {
      indexList: [1, 2, 3]
    };
    const error = new Error("dummy");
    getInstanceDirectoryNameStub.withArgs(sinon.match(component), 1).returns("dummy1");
    getInstanceDirectoryNameStub.withArgs(sinon.match(component), 2).returns("dummy2");
    getInstanceDirectoryNameStub.withArgs(sinon.match(component), 3).returns("dummy3");
    readComponentJsonStub.withArgs("/cwdDir/dummy1").resolves({ state: "finished" });
    readComponentJsonStub.withArgs("/cwdDir/dummy2").resolves({ state: "finished" });
    readComponentJsonStub.withArgs("/cwdDir/dummy3").rejects(error);
    await expect(foreachSearchLatestFinishedIndex(component, "/cwdDir")).to.be.rejectedWith(error);
  });
});

describe("UT for forTripCount()", ()=>{
  it("should be work with positive length in 1 increments", ()=>{
    expect(forTripCount({ start: 1, end: 3, step: 1 })).to.be.equal(3);
  });
  it("should be work with positive length and divisible step width", ()=>{
    expect(forTripCount({ start: 1, end: 3, step: 2 })).to.be.equal(2);
  });
  it("should be work with positive length and indivisible step width", ()=>{
    expect(forTripCount({ start: 1, end: 4, step: 2 })).to.be.equal(2);
  });
  it("should be work with negative length in 1 increments", ()=>{
    expect(forTripCount({ start: 3, end: 1, step: -1 })).to.be.equal(3);
  });
  it("should be work with negative length and divisible step width", ()=>{
    expect(forTripCount({ start: 3, end: 1, step: -2 })).to.be.equal(2);
  });
  it("should be work with negative length and indivisible step width", ()=>{
    expect(forTripCount({ start: 4, end: 1, step: -2 })).to.be.equal(2);
  });

  it("should be work with a combination of start and end across 0 in 1 increments", ()=>{
    expect(forTripCount({ start: -3, end: 2, step: 1 })).to.be.equal(6);
  });
  it("should be work with a combination of start and end across 0  and divisible step width", ()=>{
    expect(forTripCount({ start: -3, end: 2, step: 3 })).to.be.equal(2);
  });
  it("should be work with a combination of start and end across 0  and indivisible step width", ()=>{
    expect(forTripCount({ start: -3, end: 2, step: 4 })).to.be.equal(2);
  });
});
