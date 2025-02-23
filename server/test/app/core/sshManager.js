/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
"use strict";

const { expect } = require("chai");
const { describe, it } = require("mocha");
const sinon = require("sinon");
const rewire = require("rewire");

describe("#hasEntry", ()=>{
  let rewireSshManager;
  let hasEntry;
  let dbMock;

  beforeEach(()=>{
    //sshManager.js を再取得
    rewireSshManager = rewire("../../../app/core/sshManager.js");

    //テスト対象関数を取得
    hasEntry = rewireSshManager.__get__("hasEntry");

    //db のモック(Map)を用意し、sshManager.js 内の db を差し替える
    dbMock = new Map();
    rewireSshManager.__set__("db", dbMock);
  });

  it("should return false if the projectRootDir is not in db", ()=>{
    //dbMock 上に projectRootDir は存在しない
    const result = hasEntry("/path/to/projectA", "someID");
    expect(result).to.be.false;
  });

  it("should return false if db has the projectRootDir but does not have the id", ()=>{
    //dbMock に projectRootDir は追加するが、その中に id は存在しない
    const projectDir = "/path/to/projectB";
    dbMock.set(projectDir, new Map()); //空のMap

    const result = hasEntry(projectDir, "missingID");
    expect(result).to.be.false;
  });

  it("should return true if db has the projectRootDir and the id", ()=>{
    const projectDir = "/path/to/projectC";
    const id = "existingID";

    //projectDir 用のサブMapを作って id を登録
    const subMap = new Map();
    subMap.set(id, { ssh: "dummySshObject" });
    dbMock.set(projectDir, subMap);

    //検証
    const result = hasEntry(projectDir, id);
    expect(result).to.be.true;
  });
});

describe("#addSsh", ()=>{
  let rewireSshManager;
  let addSsh;
  let dbMock;

  beforeEach(()=>{
    //sshManager.jsをrewireで読み込む
    rewireSshManager = rewire("../../../app/core/sshManager.js");
    //テスト対象関数addSshを取得
    addSsh = rewireSshManager.__get__("addSsh");

    //dbをMock化する
    //dbはMapオブジェクトですが、has/set/getなどをsinon.stubで差し替える
    dbMock = {
      has: sinon.stub(),
      set: sinon.stub(),
      get: sinon.stub()
    };

    //rewireを使ってsshManager.js内部のdbを差し替え
    rewireSshManager.__set__("db", dbMock);
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should create a new Map when the projectRootDir does not exist in db", ()=>{
    //dbMock.has(...)がfalseを返すように設定
    dbMock.has.returns(false);

    //dbMock.getは返り値をダミーでもいいので設定しておく (後段の .set()呼び出しで利用)
    const mapStub = {
      set: sinon.stub()
    };
    dbMock.get.returns(mapStub);

    //テスト対象呼び出し
    const projectRootDir = "/dummy/path";
    const hostinfo = { id: "host-123" };
    const ssh = { connect: ()=>{} };
    const pw = "dummyPw";
    const ph = "dummyPh";
    const isStorage = false;

    addSsh(projectRootDir, hostinfo, ssh, pw, ph, isStorage);

    //アサーション: dbMock.has(...)が引数"/dummy/path"で呼ばれた
    expect(dbMock.has.calledOnceWithExactly(projectRootDir)).to.be.true;

    //アサーション: dbMock.set(...)が呼ばれた (新規Map生成)
    expect(dbMock.set.calledOnceWithExactly(projectRootDir, sinon.match.instanceOf(Map))).to.be.true;

    //アサーション: dbMock.get(...).set(...)にも期待通りの引数で呼ばれているか
    expect(mapStub.set.calledOnceWithExactly("host-123", {
      ssh,
      hostinfo,
      pw,
      ph,
      isStorage
    })).to.be.true;
  });

  it("should reuse existing Map when the projectRootDir already exists in db", ()=>{
    //dbMock.has(...)がtrueを返す
    dbMock.has.returns(true);

    //既存Mapのモック
    const existingMapMock = {
      set: sinon.stub()
    };
    dbMock.get.returns(existingMapMock);

    //テスト対象呼び出し
    const projectRootDir = "/exists/path";
    const hostinfo = { id: "host-999" };
    const ssh = { connect: ()=>{} };
    const pw = "secretPw";
    const ph = "secretPh";
    const isStorage = true;

    addSsh(projectRootDir, hostinfo, ssh, pw, ph, isStorage);

    //新規Map生成はされないはずなので dbMock.set(...)は呼ばれない
    expect(dbMock.set.notCalled).to.be.true;

    //代わりに、dbMock.get(...).set(...)で情報を追加
    expect(existingMapMock.set.calledOnceWithExactly("host-999", {
      ssh,
      hostinfo,
      pw,
      ph,
      isStorage
    })).to.be.true;
  });
});

describe("#getSsh", ()=>{
  let rewireSshManager;
  let getSsh;
  let hasEntryMock; //hasEntryをStub化
  let dbMock; //db変数をStub(というか差し替え)

  beforeEach(()=>{
    //sshManager.jsをrewireでインポート
    rewireSshManager = rewire("../../../app/core/sshManager.js");

    //テスト対象関数を__get__で取得
    getSsh = rewireSshManager.__get__("getSsh");

    //sinon.stub()でMock(Stub)を作成
    hasEntryMock = sinon.stub();

    //Mapを用いたMockの作成（本来のdbを差し替え）
    dbMock = new Map();

    //rewireを使ってsshManager.js内の変数・関数をStub化
    rewireSshManager.__set__("hasEntry", hasEntryMock);
    rewireSshManager.__set__("db", dbMock);
  });

  it("should throw an error if ssh instance is not registered for the project", ()=>{
    //hasEntryがfalseを返すMock設定
    hasEntryMock.returns(false);

    const projectRootDir = "/mock/project/root";
    const hostID = "someHostID";

    //throwされるErrorを検証
    try {
      getSsh(projectRootDir, hostID);
      //もしthrowされなかったらテスト失敗とする
      throw new Error("Expected getSsh to throw an error");
    } catch (err) {
      //エラーメッセージの確認
      expect(err).to.be.an("Error");
      expect(err.message).to.equal("ssh instance is not registerd for the project");

      //Errorオブジェクトに設定されているはずのプロパティを確認
      expect(err.projectRootDir).to.equal(projectRootDir);
      expect(err.id).to.equal(hostID);
    }
  });

  it("should return ssh instance when entry exists in db", ()=>{
    //hasEntryがtrueを返すMock設定
    hasEntryMock.returns(true);

    const projectRootDir = "/mock/project/root";
    const hostID = "existingHost";

    //dbMockに、該当プロジェクト・IDのsshオブジェクトを格納
    const sshInstanceMock = { /*任意のオブジェクト */ };
    const hostMap = new Map();
    hostMap.set(hostID, { ssh: sshInstanceMock });

    dbMock.set(projectRootDir, hostMap);

    //実行して取得できるsshインスタンスを確認
    const result = getSsh(projectRootDir, hostID);
    expect(result).to.equal(sshInstanceMock);
  });
});

describe("#getSshHostinfo", ()=>{
  let rewireSshManager;
  let getSshHostinfo;
  let hasEntryMock;
  let dbMock;

  beforeEach(()=>{
    rewireSshManager = rewire("../../../app/core/sshManager.js");
    getSshHostinfo = rewireSshManager.__get__("getSshHostinfo");

    //hasEntry をStub化
    hasEntryMock = sinon.stub();
    //rewireでオリジナルのhasEntryを差し替える
    rewireSshManager.__set__("hasEntry", hasEntryMock);

    //db を擬似的に置き換える
    dbMock = new Map();
    dbMock.set("mockProjectDir", new Map([
      ["mockHostID", { hostinfo: { host: "somehost" } }]
    ]));

    //rewireでdbを差し替える
    rewireSshManager.__set__("db", dbMock);
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should throw an error if the hostinfo is not registered", ()=>{
    hasEntryMock.returns(false);

    try {
      getSshHostinfo("mockProjectDir", "unregisteredID");
      throw new Error("Expected getSshHostinfo to throw an error");
    } catch (err) {
      expect(err.message).to.equal("hostinfo is not registerd for the project");
      expect(err.projectRootDir).to.equal("mockProjectDir");
      expect(err.id).to.equal("unregisteredID");
    }
  });

  it("should return hostinfo object if the entry exists", ()=>{
    hasEntryMock.returns(true);

    const result = getSshHostinfo("mockProjectDir", "mockHostID");
    expect(result).to.deep.equal({ host: "somehost" });
  });
});

describe("#getSshPW", ()=>{
  let rewireSshManager;
  let getSshPW;
  let hasEntryMock;
  let dbMock;

  beforeEach(()=>{
    //sshManagerをrewireで読み込み
    rewireSshManager = rewire("../../../app/core/sshManager.js");

    //テスト対象の関数を__get__で取得
    getSshPW = rewireSshManager.__get__("getSshPW");

    //sinon.stub()でMockを作成（Stub化）。
    hasEntryMock = sinon.stub();

    //dbもrewire経由で差し替えるためのMock
    dbMock = new Map();

    //rewireでテストダブルを注入
    rewireSshManager.__set__("hasEntry", hasEntryMock);
    rewireSshManager.__set__("db", dbMock);
  });

  it("should throw an error if hostinfo is not registered for the project", ()=>{
    //hasEntryがfalseを返すケース
    hasEntryMock.returns(false);

    expect(()=>{
      getSshPW("/path/to/project", "hostID");
    }).to.throw("hostinfo is not registerd for the project")
      .and.to.have.property("projectRootDir", "/path/to/project");

    expect(hasEntryMock.calledOnceWithExactly("/path/to/project", "hostID")).to.be.true;
  });

  it("should return the password (string) if hasEntry is true", ()=>{
    //hasEntryがtrueを返す
    hasEntryMock.returns(true);

    //dbに対応するpwを用意
    dbMock.set("/path/to/project", new Map([
      ["hostID", { pw: "mySecretPassword" }]
    ]));

    const result = getSshPW("/path/to/project", "hostID");
    expect(result).to.equal("mySecretPassword");
  });

  it("should return the password (function) if pw is defined as a function", ()=>{
    //hasEntryがtrueを返す
    hasEntryMock.returns(true);

    //パスワードが関数の場合も想定してテスト
    const pwFunc = ()=>"secretFromFunction";
    dbMock.set("/path/to/project", new Map([
      ["hostID", { pw: pwFunc }]
    ]));

    const result = getSshPW("/path/to/project", "hostID");
    //この時点ではpwFunc自体が返る
    expect(result).to.be.a("function");
    expect(result()).to.equal("secretFromFunction");
  });
});

describe("#getSshPH", ()=>{
  let rewireSshManager;
  let getSshPH;
  let hasEntryMock;
  let dbStub; //db自体もMock化するために差し替え

  beforeEach(()=>{
    //rewire でsshManagerモジュールを読み込む
    rewireSshManager = rewire("../../../app/core/sshManager.js");

    //テスト対象の関数を__get__で取得
    getSshPH = rewireSshManager.__get__("getSshPH");

    //hasEntry をスタブ化
    hasEntryMock = sinon.stub();

    //db は Map構造をモックとして差し替え
    dbStub = new Map();

    //rewireを用いて内部の依存を差し替え
    rewireSshManager.__set__({
      hasEntry: hasEntryMock,
      db: dbStub
    });
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should throw an error if hostinfo is not registered for the project", ()=>{
    const projectRootDir = "/dummy/project";
    const hostID = "unregisteredHost";

    //hasEntry が false を返すように設定
    hasEntryMock.returns(false);

    try {
      getSshPH(projectRootDir, hostID);
      expect.fail("Expected getSshPH to throw an error, but it did not");
    } catch (err) {
      expect(err).to.be.instanceOf(Error);
      expect(err.message).to.equal("hostinfo is not registerd for the project");
      expect(err.projectRootDir).to.equal(projectRootDir);
      expect(err.id).to.equal(hostID);
    }
    expect(hasEntryMock.calledOnceWithExactly(projectRootDir, hostID)).to.be.true;
  });

  it("should return the passphrase if hostinfo is registered for the project", ()=>{
    const projectRootDir = "/dummy/project";
    const hostID = "registeredHost";

    //hasEntry が true を返すように設定
    hasEntryMock.returns(true);

    //db の構造をエミュレート
    //dbStub は Map()
    //dbStub.get(projectRootDir) も Map() を返し、その中でキー=hostID でオブジェクトを持つ
    const hostMap = new Map();
    hostMap.set(hostID, { ph: "mySecretPassphrase" });
    dbStub.set(projectRootDir, hostMap);

    const result = getSshPH(projectRootDir, hostID);
    expect(result).to.equal("mySecretPassphrase");
    expect(hasEntryMock.calledOnceWithExactly(projectRootDir, hostID)).to.be.true;
  });
});

describe("#removeSsh", ()=>{
  let rewireSshManager;
  let removeSsh;
  let dbMock;

  beforeEach(()=>{
    //sshManager.jsをrewire
    rewireSshManager = rewire("../../../app/core/sshManager.js");
    //テスト対象関数を取得
    removeSsh = rewireSshManager.__get__("removeSsh");

    //dbをスタブ化(Map)して差し替え
    dbMock = new Map();
    rewireSshManager.__set__("db", dbMock);
  });

  it("should return immediately if db does not have projectRootDir", ()=>{
    //dbMockにキーをセットしない => 存在しない
    removeSsh("notExistsDir");
    //何も起こらないことを確認
    expect(dbMock.has("notExistsDir")).to.be.false;
  });

  it("should clear the map if it is empty and the projectRootDir is found", ()=>{
    const projectRootDir = "emptyDir";
    //projectRootDirに対して空のMapを登録
    dbMock.set(projectRootDir, new Map());

    removeSsh(projectRootDir);

    //.clear() が呼ばれて、空Mapが空のまま(結果的に要素なし)
    expect(dbMock.get(projectRootDir).size).to.equal(0);
  });

  it("should disconnect all non-storage entries and clear db if no storage entries exist", ()=>{
    const projectRootDir = "noStorageDir";
    //ssh.disconnect()をモック化
    const disconnectMock = sinon.stub();

    //2つのエントリを登録。両方isStorage = false
    const mapForDir = new Map();
    mapForDir.set("hostA", { isStorage: false, ssh: { disconnect: disconnectMock } });
    mapForDir.set("hostB", { isStorage: false, ssh: { disconnect: disconnectMock } });

    dbMock.set(projectRootDir, mapForDir);

    removeSsh(projectRootDir);

    //disconnectが呼ばれた回数確認(2回呼ばれる)
    expect(disconnectMock.callCount).to.equal(2);

    //最終的にclearDB=trueなら.db.clear()が実行され、サイズ0になる
    expect(dbMock.get(projectRootDir).size).to.equal(0);
  });

  it("should skip disconnect for storage entries and not clear the map if any storage is found", ()=>{
    const projectRootDir = "withStorageDir";

    //ストレージのsshオブジェクト(接続を切らない)
    const storageDisconnectMock = sinon.stub();
    //非ストレージのsshオブジェクト(切る)
    const normalDisconnectMock = sinon.stub();

    const mapForDir = new Map();
    mapForDir.set("hostStorage", { isStorage: true, ssh: { disconnect: storageDisconnectMock } });
    mapForDir.set("hostNonStorage", { isStorage: false, ssh: { disconnect: normalDisconnectMock } });

    dbMock.set(projectRootDir, mapForDir);

    removeSsh(projectRootDir);

    //storageの方はdisconnectされない
    expect(storageDisconnectMock.called).to.be.false;
    //非ストレージの方だけdisconnect呼ばれる
    expect(normalDisconnectMock.calledOnce).to.be.true;

    //clearDBがfalseになる => mapはclearされないので残る
    expect(dbMock.get(projectRootDir).size).to.equal(2);
  });
});
