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

describe("#getChildren", ()=>{
  let rewireWorkflowUtil;
  let getChildren;
  let getComponentDirMock; //getComponentDir を Stub 化
  let readJsonGreedyMock; //readJsonGreedy を Stub 化
  let promisifyMock; //promisify を Stub 化
  let globMock; //glob 関数(正確には promisify された glob)を Stub 化
  let componentJsonFilename; //componentJsonFilename の値を取得し検証に利用する

  beforeEach(()=>{
    //テスト対象モジュールを rewire で読み込む
    rewireWorkflowUtil = rewire("../../../app/core/workflowUtil.js");

    //テスト対象関数を取得
    getChildren = rewireWorkflowUtil.__get__("getChildren");

    //各依存関数を Stub 化
    getComponentDirMock = sinon.stub();
    readJsonGreedyMock = sinon.stub();
    globMock = sinon.stub();

    //promisify(...) が globMock を返すようにする
    promisifyMock = sinon.stub().returns(globMock);

    //依存を rewire で差し替え
    rewireWorkflowUtil.__set__({
      getComponentDir: getComponentDirMock,
      readJsonGreedy: readJsonGreedyMock,
      promisify: promisifyMock
    });

    //componentJsonFilename の実際の値を取得 (デフォルトでは "component.json" など)
    componentJsonFilename = rewireWorkflowUtil.__get__("componentJsonFilename");
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should return an empty array if getComponentDir returns a falsy value", async ()=>{
    //getComponentDir が null や undefined を返すケース
    getComponentDirMock.resolves(null);

    const result = await getChildren("/some/project", "parentID");
    expect(result).to.be.an("array").that.is.empty;

    //getComponentDir が正しく呼ばれ、ほかの依存が呼ばれていないことを検証
    expect(getComponentDirMock.calledOnceWithExactly("/some/project", "parentID", true)).to.be.true;
    expect(promisifyMock.notCalled).to.be.true;
    expect(globMock.notCalled).to.be.true;
  });

  it("should return an empty array if no children are found by glob", async ()=>{
    //getComponentDir でパスが返ってきても、glob 結果が空配列になるケース
    getComponentDirMock.resolves("/path/to/component");
    globMock.resolves([]); //=> children.length === 0

    const result = await getChildren("/projRoot", "someParent");
    expect(result).to.be.an("array").that.is.empty;

    //glob の呼び出しパスが正しいか確認
    const expectedGlobPath = require("path").join("/path/to/component", "*", componentJsonFilename);
    expect(promisifyMock.calledOnce).to.be.true;
    expect(globMock.calledOnceWithExactly(expectedGlobPath)).to.be.true;
  });

  it("should filter out subComponent objects and return the rest", async ()=>{
    //getComponentDir で有効なパスが返り、glob で複数ファイルが見つかるケース
    getComponentDirMock.resolves("/my/component");
    globMock.resolves([
      "/my/component/child1/component.json",
      "/my/component/child2/component.json",
      "/my/component/child3/component.json"
    ]);

    //readJsonGreedy の Stub 動作設定
    //1つだけ subComponent:true として除外させる
    readJsonGreedyMock.onCall(0).resolves({ ID: "child1", subComponent: false });
    readJsonGreedyMock.onCall(1).resolves({ ID: "child2", subComponent: true });
    readJsonGreedyMock.onCall(2).resolves({ ID: "child3" }); //subComponent が undefined

    const result = await getChildren("/projRoot", "myParentID");
    expect(result).to.have.lengthOf(2);
    expect(result).to.deep.include({ ID: "child1", subComponent: false });
    expect(result).to.deep.include({ ID: "child3" });

    //glob の呼び出しパスが正しいか確認
    const expectedGlobPath = require("path").join("/my/component", "*", componentJsonFilename);
    expect(globMock.calledOnceWithExactly(expectedGlobPath)).to.be.true;

    //3ファイルとも readJsonGreedy が呼ばれているか
    expect(readJsonGreedyMock.callCount).to.equal(3);
  });
});
