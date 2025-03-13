"use strict";

const { expect } = require("chai");
const sinon = require("sinon");
const rewire = require("rewire");

describe("#getThreeGenerationFamily", ()=>{
  let rewireWorkflowUtil;
  let getThreeGenerationFamily;
  let readComponentJsonMock;
  let getChildrenMock;
  let hasChildMock;

  beforeEach(()=>{
    //workflowUtil.js をリワイヤ
    rewireWorkflowUtil = rewire("../../../app/core/workflowUtil.js");

    //テスト対象の関数を取得
    getThreeGenerationFamily = rewireWorkflowUtil.__get__("getThreeGenerationFamily");

    //依存関数をSinon.stub() でモック化
    readComponentJsonMock = sinon.stub();
    getChildrenMock = sinon.stub();
    hasChildMock = sinon.stub();

    //rewire で内部の依存を差し替え
    rewireWorkflowUtil.__set__({
      readComponentJson: readComponentJsonMock,
      getChildren: getChildrenMock,
      hasChild: hasChildMock
    });
  });

  afterEach(()=>{
    //テストごとに stub/spy をリセット
    sinon.restore();
  });

  it("should return a root component with empty descendants if no children exist", async ()=>{
    //-- 準備 --
    //readComponentJsonMock は ルートコンポーネントのJSONを返す
    readComponentJsonMock.resolves({
      ID: "rootID",
      type: "workflow"
    });

    //getChildrenMock は 空配列を返す => 子供なし
    getChildrenMock.resolves([]);

    //-- 実行 --
    const result = await getThreeGenerationFamily("/dummy/projectRoot", "/dummy/rootComponentDir");

    //-- 検証 --
    expect(result).to.have.property("ID", "rootID");
    expect(result).to.have.property("type", "workflow");
    expect(result).to.have.property("descendants").that.is.an("array").with.lengthOf(0);

    //stub が正しく呼ばれたか(参考)
    expect(readComponentJsonMock.calledOnceWithExactly("/dummy/rootComponentDir")).to.be.true;
    expect(getChildrenMock.calledOnceWithExactly("/dummy/projectRoot", "rootID")).to.be.true;
  });

  it("should remove handler from each child if present, but skip grandsons if hasChild is false", async ()=>{
    //-- 準備 --
    //ルートコンポーネント
    readComponentJsonMock.resolves({
      ID: "rootID",
      type: "workflow"
    });
    //直下の子供を2つ用意
    const child1 = { ID: "child1ID", type: "group", handler: "someHandlerValue" };
    const child2 = { ID: "child2ID", type: "other" };
    getChildrenMock.resolves([child1, child2]);

    //いずれの子供も hasChild => false とする
    hasChildMock.onCall(0).returns(false); //for child1
    hasChildMock.onCall(1).returns(false); //for child2

    //-- 実行 --
    const result = await getThreeGenerationFamily("/dummy/projectRoot", "/dummy/rootComponentDir");

    //-- 検証 --
    //root
    expect(result).to.have.property("ID", "rootID");
    expect(result).to.have.property("descendants").that.is.an("array").with.lengthOf(2);

    //child1 => handler が削除されている
    const [c1, c2] = result.descendants;
    expect(c1).to.have.property("ID", "child1ID");
    expect(c1).to.not.have.property("handler"); //削除されている
    //child2 => もともと handler なし
    expect(c2).to.have.property("ID", "child2ID");

    //hasChild が false なので => どちらの子供も descenants (孫) は付与されない
    expect(c1).to.not.have.property("descendants");
    expect(c2).to.not.have.property("descendants");
  });

  it("should map grandsons when hasChild is true, and transform 'task' type differently", async ()=>{
    //-- 準備 --
    //root の情報
    readComponentJsonMock.resolves({
      ID: "rootID",
      type: "workflow"
    });

    //子供は1つだけ存在
    const childA = { ID: "childAID", type: "group" };
    getChildrenMock.onCall(0).resolves([childA]);
    //↑ getChildren が呼ばれるのは root 用(最初の呼び出し)

    //childA は hasChild => true とする
    hasChildMock.onCall(0).returns(true);

    //childA の子供 (孫にあたる) は2つ
    const grandTask = { ID: "g1", type: "task", pos: { x: 100, y: 200 }, host: "someHost", useJobScheduler: true };
    const grandOther = { ID: "g2", type: "group", pos: { x: 300, y: 400 } };

    //2回目の getChildren 呼び出し => childA の孫取得
    getChildrenMock.onCall(1).resolves([grandTask, grandOther]);

    //-- 実行 --
    const result = await getThreeGenerationFamily("/dummy/proj", "/dummy/rootComp");

    //-- 検証 --
    expect(result).to.have.property("ID", "rootID");
    expect(result).to.have.property("descendants").that.is.an("array").with.lengthOf(1);

    const cA = result.descendants[0];
    expect(cA).to.have.property("ID", "childAID");
    //hasChild => true なので cA の descendants がある
    expect(cA).to.have.property("descendants").that.is.an("array").with.lengthOf(2);

    //孫要素のチェック
    const [g1, g2] = cA.descendants;
    //g1.type === 'task' => host, useJobScheduler も含む
    expect(g1).to.deep.equal({
      type: "task",
      pos: { x: 100, y: 200 },
      host: "someHost",
      useJobScheduler: true
    });
    //g2.type !== 'task' => type, pos のみ
    expect(g2).to.deep.equal({
      type: "group",
      pos: { x: 300, y: 400 }
    });
  });
});
