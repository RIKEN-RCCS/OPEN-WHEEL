const { Server } = require("socket.io");
const siofu = require("socketio-file-upload");
const net = require("net");

//MOCK_DEBUG=1 で詳細ログ、未設定/0で静穏化
const VERBOSE = process.env.MOCK_DEBUG === "1";
const log = (...a)=>{
  if (VERBOSE) console.log(...a);
};
const warn = (...a)=>{
  if (VERBOSE) console.warn(...a);
};
const err = (...a)=>{
  return console.error(...a);
}; //エラーは常に出す

/**
 * STATE: 画面表示に必要な情報を一時的に保持する。
 * - projectList  … Home の一覧の元データ
 * - files/dirs   … ファイルブラウザ用の仮想FS（フルパス集合）
 * - workflows    … 作業用フォルダごとの Workflow
 * - projectJsons … 作業用フォルダごとの ProjectJson
 */
const STATE = {
  files: new Set(),
  dirs: new Set(),
  workflows: new Map(),
  projectJsons: new Map(),
  projectList: []
};

/**Workflow/ProjectJson の実体 */
let workflowsByRoot = new Map();
let projectJsonByRoot = new Map();

/**
 * 仮想ファイルシステム（VFS）の“本体”。ファイルブラウザは基本ここを見る
 * - addFile / addDir / listEntries などがこの集合を更新・参照
 */

let _FILES = new Set();
let _DIRS = new Set();

/**コンポーネント作成時の初期状態スナップショット（cleanComponent用）*/
const _COMPONENT_SNAPSHOTS = new Map();

/**ファイルコンテンツVFS（openFile/saveFile用）- フルパス → 文字列コンテンツ*/
const _FILE_CONTENTS = new Map();

/**Socket.IO サーバのインスタンス*/

let io;
let __startedHere = false; //このプロセスが起動したかどうか

/**
 * 指定ポートに誰かが LISTEN しているかを同期的に判定（成功: true, 失敗: false）
 * @param {number} port
 * @param {string} [host]
 * @returns {Promise<boolean>}
 */
function isPortOpen(port, host = "127.0.0.1") {
  return new Promise((resolve)=>{
    const s = new net.Socket();
    const done = (ret)=>{
      s.destroy(); ;
      resolve(ret);
    };
    s.once("connect", ()=>{
      return done(true);
    });
    s.once("error", ()=>{
      return done(false);
    });
    s.connect(port, host);
  });
}

/*============================================================================
 * ユーティリティ
 * ==========================================================================*/
/**
 * projectJson をルートごとに初期化/取得
 * @param {string} projectRootDir - プロジェクトのルートパス
 * @param {string} [rootId] - ルートコンポーネントのID
 * @returns {{name:string,description:string,state:string,mtime:string,readOnly:boolean,componentPath:Record<string,string>}} 取得,生成したprojectJsonを返す
 */
function getOrInitProjectJson(projectRootDir, rootId = "root") {
  const key = projectRootDir + "__default__";
  if (!projectJsonByRoot.has(key)) {
    projectJsonByRoot.set(key, {
      name: "WHEEL_TEST_MOCK",
      description: "TestDescription",
      state: "not-started", //初回表示で RUN を活性化するため
      mtime: "2025-01-01",
      readOnly: false,
      componentPath: { [rootId]: "." }
    });
  }
  return projectJsonByRoot.get(key);
}

/**
 * workflow をルートごとに初期化/取得
 * @param {string} projectRootDir - プロジェクトのルートパス（.wheel でも可）
 * @param {string} rootId - ルートコンポーネントのID
 * @returns {{ID:string,name:string,type:"workflow",typeof:"workflow",state:string,descendants:any[],links:any[],edges?:any[],connections?:any[]}} 取得,生成したworkflowを返す
 */
function getOrInitWorkflow(projectRootDir, rootId) {
  const key = projectRootDir + "__default__";
  if (!workflowsByRoot.has(key)) {
    workflowsByRoot.set(key, {
      ID: rootId || "root",
      name: "root",
      type: "workflow",
      typeof: "workflow",
      state: "not-started",
      descendants: [],
      links: []
    });
  }
  const wf = workflowsByRoot.get(key);
  if (!Array.isArray(wf.links)) wf.links = [];
  wf.edges = wf.links; //UI 互換
  wf.connections = wf.links; //UI 互換
  return wf;
}

/**
 * 作業ルートを .wheel に正規化
 * @param {string} projectRootDir - プロジェクトのルートパス
 * @returns {string} .wheel で終わる正規化済みのパスを返す
 */
function resolveWorkingRoot(projectRootDir) {
  const r = String(projectRootDir || "");
  return r.endsWith(".wheel") ? r : (r + ".wheel");
}

/**
 * glob → RegExp 変換
 * @param {string} glob - globパターン
 * @returns {RegExp} 与えたglobに対応する正規表現オブジェクトを返す
 */
function globToRegExp(glob) {
  const s = String(glob || "")
    .replace(/[.+^${}()\\[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*")
    .replace(/\?/g, ".");
  return new RegExp("^" + s + "$");
}

/**
 * VFS 実体（UIのファイルツリーはこれを参照）
 * @returns {{files:Set<string>, dirs:Set<string>}} VFS のファイル集合とディレクトリ集合を返す
 */
function ensureSets() {
  return { files: _FILES, dirs: _DIRS };
}

/**
 * パス正規化：連続スラッシュの折畳みと末尾スラッシュの除去
 * @param {string} p - 正規化対象のパス
 * @returns {string} 正規化後のパス文字列を返す
 */
function normPath(p) {
  return String(p || "").replace(/\/+/g, "/")
    .replace(/\/$/, "");
}

/**
 * 親ディレクトリを返す
 * @param {string} p - 対象のパス
 * @returns {string} 親ディレクトリのパスを返す
 */
function parentDir(p) {
  const n = normPath(p);
  const idx = n.lastIndexOf("/");
  return idx > 0 ? n.slice(0, idx) : "";
}

/**
 * VFS にディレクトリを追加（親も保証）
 * @param {string} projectRootDir - プロジェクトのルートパス
 * @param {string} fullPath - 追加するディレクトリのフルパス
 * @returns {void} 返り値なし VFSを更新します。
 */
function addDir(projectRootDir, fullPath) {
  const { dirs } = ensureSets(projectRootDir);
  const d = normPath(fullPath);
  if (!d) return;
  dirs.add(d);
  const par = parentDir(d);
  if (par) dirs.add(par);
}

/**
 * VFS にファイルを追加（親ディレクトリも保証）
 * @param {string} projectRootDir - プロジェクトのルートパス
 * @param {string} fullPath - 追加するファイルのフルパス
 * @returns {void} 返り値なし VFSを更新します。
 */
function addFile(projectRootDir, fullPath) {
  const { files } = ensureSets(projectRootDir);
  const f = normPath(fullPath);
  if (!f) return;
  files.add(f);
  const par = parentDir(f);
  if (par) addDir(projectRootDir, par);
}

/**
 * 指定ディレクトリ直下（1階層）のエントリ（dir/file）を列挙
 * （作業用フォルダ（.wheel 側）とプロジェクト本体（.wheel なし） をマージ）
 * @param {string} projectRootDir - プロジェクトのルートパス
 * @param {string} dirPath - 列挙するディレクトリのフルパス
 * @returns {Array<{name:string,type:"file"|"dir"|"snd"|"sndd",path:string,pattern?:string,islink?:boolean}>} 直下のエントリ一覧を返す
 */
function listEntries(projectRootDir, dirPath) {
  const { files, dirs } = ensureSets(projectRootDir);
  const base = normPath(dirPath);

  const workRoot = normPath(resolveWorkingRoot(projectRootDir));
  const plainRoot = normPath(String(projectRootDir).replace(/\/+$/, "")
    .replace(/\.wheel$/, ""));
  const altBase = (function toAltUsingRoot(p) {
    if (!p) return p;
    if (p.startsWith(workRoot)) return plainRoot + p.slice(workRoot.length);
    if (p.startsWith(plainRoot)) return workRoot + p.slice(plainRoot.length);
    return p;
  })(base);

  const prefixA = base ? (base + "/") : "";
  const prefixB = altBase ? (altBase + "/") : "";
  const seen = new Set();
  let out = [];

  //直下ディレクトリ
  for (const where of [{ set: dirs, prefix: prefixA }, { set: dirs, prefix: prefixB }]) {
    if (!where.prefix) continue;

    for (const d of where.set) {
      if (!d.startsWith(where.prefix)) continue;
      const rest = d.slice(where.prefix.length);
      if (!rest || rest.includes("/")) continue;
      if (seen.has("D:" + rest)) continue;
      out.push({ name: rest, type: "dir", path: base }); //UI 契約：path は親
      seen.add("D:" + rest);
    }
  }

  //直下ファイル
  for (const where of [{ set: files, prefix: prefixA }, { set: files, prefix: prefixB }]) {
    if (!where.prefix) continue;

    for (const f of where.set) {
      if (!f.startsWith(where.prefix)) continue;
      const rest = f.slice(where.prefix.length);
      if (!rest || rest.includes("/")) continue;
      if (seen.has("F:" + rest)) continue;
      out.push({ name: rest, type: "file", path: base }); //UI 契約：path は親
      seen.add("F:" + rest);
    }
  }

  //数値サフィックス集約
  return summarizeNumericFiles(base, summarizeNumericDirs(base, out));
}

/**
 * 同じ位置のパスを、作業用フォルダ（.wheel）⇄プロジェクト本体 の間で相互変換する
 * @param {string} projectRootDir - プロジェクトのルートパス
 * @param {string} p - 変換したい元パス
 * @returns {string|null} 変換後のパスを返す
 */
function mirrorAltPath(projectRootDir, p) {
  const workRoot = normPath(resolveWorkingRoot(projectRootDir));
  const plainRoot = normPath(String(projectRootDir).replace(/\/+$/, "")
    .replace(/\.wheel$/, ""));
  const n = normPath(p);
  if (n.startsWith(workRoot + "/")) return plainRoot + n.slice(workRoot.length);
  if (n.startsWith(plainRoot + "/")) return workRoot + n.slice(plainRoot.length);
  return null;
}

/**
 * ノードIDから .wheel 配下のコンポーネントディレクトリを解決
 * @param {string} projectRootDir - プロジェクトのルートパス
 * @param {any} wf - 対象ワークフロー
 * @param {any} pj - 対象プロジェクトJSON
 * @param {string} nodeId - 対象ノードID
 * @returns {string} 解決されたコンポーネントのディレクトリパスを返す
 */
function getComponentDir(projectRootDir, wf, pj, nodeId) {
  const workRoot = resolveWorkingRoot(projectRootDir);
  const rel = pj && pj.componentPath && pj.componentPath[nodeId];
  if (typeof rel === "string" && rel.length) {
    //NOTE: 既存ロジック踏襲（. の除去）
    return normPath(`${workRoot}/${rel.replace(/^\.\?\//, "")}`);
  }
  //fallback: ノード探索
  const node = (function findNodeById(w, id) {
    if (!w) return null;
    if (w.ID === id) return w;
    const st = Array.isArray(w.descendants) ? [...w.descendants] : [];
    while (st.length) {
      const n = st.shift();
      if (n && n.ID === id) return n;
      if (n && Array.isArray(n.descendants)) st.push(...n.descendants);
    }
    return null;
  })(wf, nodeId);
  const name = node && node.name ? node.name : ("node_" + nodeId);
  return `${workRoot}/${name}`;
}

/**
 * workflow.links から入出力を補完
 * @param {any} wf - 変換対象のワークフローデータ
 * @returns {void} 返り値なし 引数のワークフローを更新します。
 */
function reconcileIOFromLinks(wf) {
  if (!wf || !Array.isArray(wf.links)) return;
  const nodes = Array.isArray(wf.descendants) ? wf.descendants : [];
  const byId = new Map(nodes.map((n)=>{
    return [n.ID, n];
  }));
  nodes.forEach((n)=>{
    n.inputFiles = Array.isArray(n.inputFiles) ? n.inputFiles : [];
    n.outputFiles = Array.isArray(n.outputFiles) ? n.outputFiles : [];
  });
  const ensureOut = (node, name)=>{
    let e = node.outputFiles.find((f)=>{
      return f && f.name === name;
    });
    if (!e) {
      e = { name, dst: [] };
      node.outputFiles.push(e);
    }
    e.dst = Array.isArray(e.dst) ? e.dst : [];
    return e;
  };
  const ensureIn = (node, name)=>{
    let e = node.inputFiles.find((f)=>{
      return f && f.name === name;
    });
    if (!e) {
      e = { name, src: [] };
      node.inputFiles.push(e);
    }
    e.src = Array.isArray(e.src) ? e.src : [];
    return e;
  };
  for (const lk of wf.links) {
    if (!lk || !lk.from || !lk.to) continue;
    const { id: fId, name: fName } = lk.from;
    const { id: tId, name: tName } = lk.to;
    const src = byId.get(fId);
    const dst = byId.get(tId);
    if (!src || !dst) continue;
    const out = ensureOut(src, fName);
    const inn = ensureIn(dst, tName);
    const toRef = { dstNode: tId, dstName: tName };
    const fromRef = { srcNode: fId, srcName: fName };
    if (!out.dst.some((r)=>{
      return r && r.dstNode === toRef.dstNode && r.dstName === toRef.dstName;
    }))
      out.dst.push(toRef);
    if (!inn.src.some((r)=>{
      return r && r.srcNode === fromRef.srcNode && r.srcName === fromRef.srcName;
    }))
      inn.src.push(fromRef);
    //snake_case 同期
    src.output_files = src.outputFiles;
    dst.input_files = dst.inputFiles;
  }
}

/**
 * VFS からファイルとそのミラーを削除
 * @param {string} projectRootDir - プロジェクトのルートパス
 * @param {string} fullPath - 削除するファイルのフルパス
 * @returns {void} 返り値なし VFSを更新します。
 */
function removeFileFromVFS(projectRootDir, fullPath) {
  const { files } = ensureSets(projectRootDir);
  const p = normPath(fullPath);
  if (!p) return;
  files.delete(p);
  const workRoot = normPath(resolveWorkingRoot(projectRootDir));
  const plainRoot = normPath(String(projectRootDir).replace(/\/+$/, "")
    .replace(/\.wheel$/, ""));
  if (p.startsWith(workRoot + "/")) {
    const alt = plainRoot + p.slice(workRoot.length);
    files.delete(alt);
  } else if (p.startsWith(plainRoot + "/")) {
    const alt = workRoot + p.slice(plainRoot.length);
    files.delete(alt);
  }
}

/**
 * ディレクトリ（数値サフィックス）集約（test1,test2→test*）
 * @param {string} base - 親ディレクトリのフルパス
 * @param {Array<{name:string,type:string,path:string}>} items - 集約前の一覧
 * @returns {typeof items} 集約後の一覧（sndd を含む）を返す
 */
function summarizeNumericDirs(base, items) {
  const dirItems = items.filter((e)=>{
    return e && e.type === "dir";
  });
  const groups = new Map();
  for (const d of dirItems) {
    const m = /^(.+?)\d+$/.exec(d.name);
    if (!m) continue;
    const prefix = m[1];
    if (!groups.has(prefix)) groups.set(prefix, []);
    groups.get(prefix).push(d);
  }
  const out = items.filter((e)=>{
    if (!e || e.type !== "dir") return true;
    const m = /^(.+?)\d+$/.exec(e.name);
    if (!m) return true;
    const g = groups.get(m[1]);
    return !(g && g.length >= 2);
  });
  for (const [prefix, arr] of groups.entries()) {
    if (arr.length >= 2) {
      out.push({ name: `${prefix}*`, pattern: `${prefix}\\d+`, type: "sndd", islink: false, path: base });
    }
  }
  return out;
}

/**
 * ファイル（数値サフィックス）集約（test1,test2→test*）
 * @param {string} base - 親ディレクトリのフルパス
 * @param {Array<{name:string,type:string,path:string}>} items - 集約前の一覧
 * @returns {typeof items} 集約後の一覧（snd を含む）を返す
 */
function summarizeNumericFiles(base, items) {
  const fileItems = items.filter((e)=>{
    return e && e.type === "file";
  });
  const groups = new Map();
  for (const f of fileItems) {
    const m = /^(.+?)\d+$/.exec(f.name);
    if (!m) continue;
    const prefix = m[1];
    if (!groups.has(prefix)) groups.set(prefix, []);
    groups.get(prefix).push(f);
  }
  const out = items.filter((e)=>{
    if (!e || e.type !== "file") return true;
    const m = /^(.+?)\d+$/.exec(e.name);
    if (!m) return true;
    const g = groups.get(m[1]);
    return !(g && g.length >= 2);
  });
  for (const [prefix, arr] of groups.entries()) {
    if (arr.length >= 2) {
      out.push({ name: `${prefix}*`, pattern: `${prefix}\\d+`, type: "snd", islink: false, path: base });
    }
  }
  return out;
}

/**
 * .wheel ルートへ正規化
 * @param {string} p - 元のパス
 * @returns {string} .wheel を付与したパスを返す
 */
function toWorkingRoot(p) {
  const n = String(p || "").replace(/\/+$/, "");
  return n.endsWith(".wheel") ? n : (n + ".wheel");
}

/**
 * 末尾スラッシュを除き末端名を返す
 * @param {string} p - 元のパス
 * @returns {string} 末端のパス要素名を返す
 */
function basenameNoSlash(p) {
  return String(p || "").replace(/\/+$/, "")
    .split("/")
    .pop();
}

/**
 * 空の workflow
 * @returns {ReturnType<typeof getOrInitWorkflow>} 初期状態の workflow オブジェクトを返す
 */
function emptyWorkflow() {
  return {
    ID: "root",
    name: "root",
    type: "workflow",
    typeof: "workflow",
    state: "not-started",
    descendants: [],
    links: [],
    edges: [],
    connections: []
  };
}

/**
 * 空の projectJson
 * @returns {ReturnType<typeof getOrInitProjectJson>} 初期状態の projectJson オブジェクトを返す
 */
function emptyProjectJson() {
  return {
    name: "WHEEL_TEST_MOCK",
    description: "TestDescription",
    state: "not-started",
    mtime: "2025-01-01",
    readOnly: false,
    componentPath: { root: "." }
  };
}

/*============================================================================
 * サーバ起動（全 socket.on ハンドラ定義）
 * ==========================================================================*/

/**
 * モックサーバ起動（Cypress task から呼び出し）
 * @param {number} [port] - サーバの待受ポート番号
 * @returns {Promise<null>} 起動完了時に null を解決する Promise を返す
 */
//async function start(port = 3101) {
//if (io) {
//io.close();
//io = undefined;
//}
//io = new Server(port, { cors: { origin: "*", methods: ["GET", "POST"] }, path: "/socket.io/" });
//console.log(`[MockServer] Starting on port ${port}...`);
//await waitForPort(port);

async function start(port = 3101) {
  //既にこのプロセスで起動済みなら no-op
  if (io && __startedHere) {
    return null;
  }
  //すでに他プロセスが LISTEN 中なら、再起動せずに no-op（EADDRINUSEを避ける）
  if (await isPortOpen(port)) {
    console.log(`[MockServer] Port ${port} is already in use; assuming mock server is up. Skip starting.`);
    __startedHere = false;
    return null;
  }
  //新規起動を試みる（万一 EADDRINUSE でも no-op）
  try {
    io = new Server(port, { cors: { origin: "*", methods: ["GET", "POST"] }, path: "/socket.io/" });
    __startedHere = true;
    log(`[MockServer] Starting on port ${port}...`);
    +await waitForPort(port);
  } catch (e) {
    if (e && e.code === "EADDRINUSE") {
      console.warn(`[MockServer] EADDRINUSE on ${port}; assuming another instance is running. Skip.`);
      io = undefined;
      __startedHere = false;
      return null;
    }
    throw e;
  }

  io.on("connection", (socket)=>{
    log(`[MockServer] Connected: ${socket.id}`);

    /**
     * デバッグログ用サニタイザ
     * @param {any} a - ログ出力する値
     * @returns {string} 表示用に短縮・整形された文字列を返す
     */
    function sanitizeArg(a) {
      if (typeof a === "function") return "[Function]";
      if (a === undefined) return "undefined";
      if (a === null) return "null";
      if (typeof a === "string") return a.length > 200 ? a.slice(0, 200) + "...(trunc)" : a;
      if (typeof a === "number" || typeof a === "boolean") return String(a);
      if (typeof a === "object") {
        try {
          const s = JSON.stringify(a);
          return s.length > 400 ? s.slice(0, 400) + "...(trunc)" : s;
        } catch {
          return "[Object]";
        }
      }
      return "[Unknown]";
    }

    //初期状態：RUN を活性化できるように not-started を送る
    socket.emit("projectState", "not-started");

    //受信イベントログ（先頭引数のみ簡易表示）
    if (VERBOSE) {
      const _on = socket.on.bind(socket);
      socket.on = function (evt, handler) {
        return _on(evt, function () {
          const first = (arguments.length > 0) ? arguments[0] : null;
          log("[SIO on]", evt, sanitizeArg(first));
          if (typeof handler === "function") return handler.apply(this, arguments);
        });
      };
    }
    if (VERBOSE) {
      socket.onAny(function () {
        const event = arguments[0];
        const args = Array.prototype.slice.call(arguments, 1).map(sanitizeArg);
        try {
          log("[MockServer][onAny]", event, "argsLen=", args.length, "args=", args);
        } catch (e) {
          log("[MockServer][onAny]", event, "(log error)", String((e && e.message) || e));
        }
      });
    }

    //ファイルアップロード（クライアントエラー回避のためリスンのみ）
    const uploader = new siofu();
    uploader.listen(socket);

    /*----------------------------------------------------------------------
     * Home で使うハンドラ
     * --------------------------------------------------------------------*/

    /**
     * Home: プロジェクト作成（現行 UI では addProject を主に使用）
     * - 互換性のため ACK を true で返すのみ。
     * @param {string} projectRootDir - プロジェクトのルートパス
     * @param {string} name - プロジェクト名
     * @param {string} desc - プロジェクト説明
     * @param {(ok:boolean)=>void} cb - ACK コールバック
     * @returns {void} 返り値なし ACKで通知します。
     */
    socket.on("createProject", (projectRootDir, name, desc, cb)=>{
      console.log(`[MockServer] createProject: ${name}`);
      cb?.(true);
    });

    /**
     * Home: プロジェクト追加
     * - E2E 安定化のため、メモリ状態を全クリアしクリーンスタートにする。
     * - 追加直後に空の Workflow / ProjectJson をキャッシュして初期描画を安定化。
     * - projectList を push。
     * @param {string} projectRootDir - 追加するプロジェクトのルートパス（.wheel でなくてよい）
     * @param {string} description - プロジェクト説明
     * @param {(ok:boolean)=>void} cb - ACK コールバック
     * @returns {void} 返り値なし ACKとpushで通知します。
     */
    socket.on("addProject", (projectRootDir, description, cb)=>{
      try {
        const workRoot = toWorkingRoot(projectRootDir);
        const name = basenameNoSlash(projectRootDir);

        //全クリア（VFS + キャッシュ + STATE）
        STATE.files.clear();
        STATE.dirs.clear();
        STATE.workflows.clear();
        STATE.projectJsons.clear();
        STATE.projectList = [];
        _FILES.clear();
        _DIRS.clear();
        workflowsByRoot.clear();
        projectJsonByRoot.clear();

        //projectList に 1 件だけ掲載
        const rec = {
          id: `mock-${Date.now()}`, name,
          description: description || "", state: "planning",
          ctime: new Date().toISOString()
            .slice(0, 10),
          mtime: new Date().toISOString()
            .slice(0, 10),
          path: workRoot
        };
        STATE.projectList.push(rec);

        //空の WF/PJ を先にキャッシュしておく（初回 push の安定化）
        STATE.workflows.set(workRoot, emptyWorkflow());
        STATE.projectJsons.set(workRoot, emptyProjectJson());
        workflowsByRoot.set(workRoot + "__default__", emptyWorkflow());
        projectJsonByRoot.set(workRoot + "__default__", emptyProjectJson());

        io.emit("projectList", STATE.projectList);
        cb?.(true);
      } catch (e) {
        console.warn("[addProject mini-reset] suppressed:", e?.message);
        io.emit("projectList", STATE.projectList || []);
        cb?.(true);
      }
    });

    /**
     * Home: プロジェクト一覧取得
     * - 現行は STATE.projectList を返却/emit。
     * @param {(list:any[])=>void} cb - 取得コールバック
     * @returns {void} 返り値なし cbとpushで返す
     */
    socket.on("getProjectList", (cb)=>{
      cb?.(STATE.projectList);
      io.emit("projectList", STATE.projectList);
    });

    /**
     * Home: プロジェクト説明更新
     * @param {string} pathOrId - 対象プロジェクトの path または id
     * @param {string} description - 新しい説明
     * @param {(ok:boolean)=>void} cb - ACK
     * @returns {void} プロジェクト一覧をemitProjectListで送信
     */
    socket.on("updateProjectDescription", (pathOrId, description, cb)=>{
      const p = STATE.projectList.find((x)=>{
        return x.path === pathOrId || x.id === pathOrId;
      });
      if (p) {
        p.description = description;
        p.mtime = new Date().toISOString()
          .slice(0, 10);
      }
      cb?.(true);
      emitProjectList(socket);
    });

    /**
     * Home: プロジェクト名変更
     * @param {string} id - プロジェクトID
     * @param {string} newName - 新しい名前
     * @param {string} path - プロジェクトのパス
     * @param {(ok:boolean)=>void} cb - ACK
     * @returns {void} プロジェクト一覧をemitProjectListで送信
     */
    socket.on("renameProject", (id, newName, path, cb)=>{
      const p = STATE.projectList.find((x)=>{
        return x.id === id;
      }) || STATE.projectList.find((x)=>{
        return x.path === path;
      });
      if (p) {
        p.name = newName;
        p.mtime = new Date().toISOString()
          .slice(0, 10);
      }
      cb?.(true);
      emitProjectList(socket);
    });

    /**
     * Home: 一覧から ID 指定で削除
     * @param {string[]} ids - 削除するプロジェクトIDの配列
     * @param {(ok:boolean)=>void} cb - ACK
     * @returns {void} プロジェクト一覧をemitProjectListで送信
     */
    socket.on("removeProjectsFromList", (ids, cb)=>{
      STATE.projectList = STATE.projectList.filter((p)=>{
        return !ids.includes(p.id);
      });
      cb?.(true);
      emitProjectList(socket);
    });

    /**
     * Home: プロジェクト削除
     * @param {string[]} ids - 削除するプロジェクトIDの配列
     * @param {(ok:boolean)=>void} cb - ACK
     * @returns {void} プロジェクト一覧をemitProjectListで送信
     */
    socket.on("removeProjects", (ids, cb)=>{
      STATE.projectList = STATE.projectList.filter((p)=>{
        return !ids.includes(p.id);
      });
      cb?.(true);
      emitProjectList(socket);
    });

    /*----------------------------------------------------------------------
     * Workflow で使うハンドラ（プロジェクト関連 → コンポーネント → 入出力）
     * --------------------------------------------------------------------*/

    /**
     * Workflow（マウント時）: プロジェクト情報
     * - `projectJson` を push、続けて `projectState: not-started` を push。
     * @param {string} projectRootDir - プロジェクトのルートパス
     * @param {(pj:any)=>void} cb - 取得コールバック
     * @returns {void} 返り値なし cbとpushで返す
     */
    socket.on("getProjectJson", (projectRootDir, cb)=>{
      try {
        const pj = getOrInitProjectJson(projectRootDir);
        io.emit("projectJson", pj);
        io.emit("projectState", "not-started");
        cb?.(pj);
      } catch { cb?.(null); }
    });

    /**
     * Workflow（マウント時）: 環境情報（ACK 待ちを解消するため空オブジェクト）
     * @param {...any} args - 最後の引数がコールバック
     * @returns {void} 返り値なし cbで空オブジェクトを返す
     */
    socket.on("getEnv", (...args)=>{
      const cb = args[args.length - 1];
      cb?.({});
    });

    /**
     * Workflow（マウント時）: ワークフロー本体
     * - cb 返却 + push（初期描画の安定化）
     * @param {string} projectRootDir - プロジェクトのルートパス
     * @param {string} rootId - ルートコンポーネントのID
     * @param {(wf:any)=>void} cb - 取得コールバック
     * @returns {void} 返り値なし cbとpushで返す
     */
    socket.on("getWorkflow", (projectRootDir, rootId, cb)=>{
      try {
        const wf = getOrInitWorkflow(projectRootDir, rootId || "root");
        io.emit("workflow", wf);
        cb?.(wf);
      } catch { cb?.(null); }
    });

    /**
     * Workflow（キャンバス）: コンポーネント追加（D&D）
     * - `${type}{連番}` の命名、`projectJson.componentPath` 更新、VFS へ .wheel/foreachN を作成。
     * @param {string} projectRootDir - プロジェクトのルートパス
     * @param {{type?:string,pos?:{x:number,y:number}}} nodeInfo - 追加ノード情報
     * @param {string} rootId - ルートID
     * @param {(ok:boolean)=>void} cb - ACK
     * @returns {void} 返り値なし
     */
    socket.on("createNode", (...args)=>{
      const cb = args[args.length - 1];
      const a = typeof cb === "function" ? args.slice(0, -1) : args;
      const projectRootDir = typeof a[0] === "string" ? a[0] : "__default__";
      const nodeInfo = a[1] && typeof a[1] === "object" ? a[1] : {};
      const rootId = typeof a[2] === "string" ? a[2] : "root";
      const type = typeof nodeInfo.type === "string" ? nodeInfo.type : "node";

      const wf = getOrInitWorkflow(projectRootDir, rootId);
      const sameTypeCount = wf.descendants.filter((n)=>{
        return (n.typeof || n.type) === type;
      }).length;
      const name = `${type}${sameTypeCount}`;
      const newId = `n-${Date.now()}`;
      const pos = nodeInfo.pos || { x: 0, y: 0 };
      const node = {
        ID: newId, name, typeof: type, type,
        pos, position: pos, x: pos.x, y: pos.y,
        descendants: [], indexList: [],
        inputFiles: [], outputFiles: [],
        input_files: [], output_files: []
      };
      //storageコンポーネントはVFS汚染防止のため固有のstoragePath（コンポーネントディレクトリ）を設定
      if (type === "storage") {
        node.storagePath = normPath(`${resolveWorkingRoot(projectRootDir)}/${name}`);
      }
      wf.descendants.push(node);
      _COMPONENT_SNAPSHOTS.set(newId, JSON.stringify(node));
      cb?.(true);

      const pj = getOrInitProjectJson(projectRootDir, rootId);
      pj.componentPath[newId] = `${name}`;
      const workRoot = resolveWorkingRoot(projectRootDir);
      addDir(projectRootDir, `${workRoot}/${name}`);

      //PSコンポーネント作成時はparameterSetting.jsonをVFSに追加
      if (type === "PS") {
        const psFilePath = normPath(`${workRoot}/${name}/parameterSetting.json`);
        addFile(projectRootDir, psFilePath);
        _FILE_CONTENTS.set(psFilePath, JSON.stringify({ version: 2, targetFiles: [], params: [], scatter: [], gather: [] }));
      }

      socket.emit("projectJson", pj);
      io.emit("workflow", wf);
    });

    /**
     * Workflow（プロパティ）: コンポーネント更新（任意プロパティのマージ）
     * - snake_case は受け取らないよう除去。
     * - links をもとに I/O を補完。
     * @param {string} projectRootDir - プロジェクトのルートパス
     * @param {string} nodeId - 対象ノードID
     * @param {object|string} component - マージするプロパティ（JSON 文字列可）
     * @param {string} rootId - ルートID
     * @param {(ok:boolean)=>void} cb - ACK
     * @returns {void} 返り値なし ACKとpushで通知します。
     */
    socket.on("updateComponent", (projectRootDir, nodeId, component, rootId, cb)=>{
      function isValidComponentName(name) {
        const s = String(name ?? "").trim();
        if (!s) return false;
        //少なくとも * を含むようなワイルドカードやパス系は拒否
        return !(/[\\\/:*?"<>|]/.test(s));
      }
      const wf = getOrInitWorkflow(projectRootDir, rootId || "root");
      let compObj = component;
      if (typeof compObj === "string") compObj = JSON.parse(compObj);
      if (compObj && typeof compObj === "object") {
        delete compObj.input_files;
        delete compObj.output_files;
        if ("name" in compObj) {
          const candidate = String(compObj.name ?? "").trim();
          if (!isValidComponentName(candidate)) {
            delete compObj.name; //← 不正名は反映しない
          } else {
            const pj = getOrInitProjectJson(projectRootDir, rootId || "root");
            pj.componentPath[nodeId] = candidate; //← componentPath も同期
            io.emit("projectJson", pj);
          }
        }
      }
      const node = findNodeById(wf, nodeId);
      if (!node) return cb?.(false);
      const merged = { ...node, ...(compObj || {}), ID: nodeId };
      if (!Array.isArray(merged.descendants)) merged.descendants = [];
      const idx = wf.descendants.findIndex((n)=>{ return n && n.ID === nodeId; });
      if (idx !== -1) wf.descendants[idx] = merged; else Object.assign(node, merged);
      cb?.(true);
      reconcileIOFromLinks(wf);
      io.emit("workflow", clone(wf));
    });

    /**
     * Workflow（プロパティ／入出力）: 入力ファイル追加
     * - inputFiles[] を生成・維持。
     * @param {string} projectRootDir - プロジェクトのルートパス
     * @param {string} nodeId - 対象ノードID
     * @param {string} fileName - 入力ファイル名
     * @param {string} rootId - ルートID
     * @param {(ok:boolean)=>void} cb - ACK
     * @returns {void} 返り値なし ACK と push で通知します。
     */
    socket.on("addInputFile", (projectRootDir, nodeId, fileName, rootId, cb)=>{
      const wf = getOrInitWorkflow(projectRootDir, rootId || "root");
      const node = findNodeById(wf, nodeId);
      if (!node) return cb?.(false);

      node.inputFiles = Array.isArray(node.inputFiles) ? node.inputFiles : [];
      let ent = node.inputFiles.find((f)=>{
        return f && f.name === fileName;
      });
      if (!ent) {
        ent = { name: fileName, src: [] };
        node.inputFiles.push(ent);
      }
      node.input_files = node.inputFiles;
      cb?.(true);
      io.emit("workflow", clone(wf));
    });

    /**
     * Workflow（プロパティ／入出力）: 出力ファイル追加
     * - outputFiles[] を生成し、VFS に .wheel/foreachN 配下へファイルも反映。
     * @param {string} projectRootDir - プロジェクトのルートパス
     * @param {string} nodeId - 対象ノードID
     * @param {string} fileName - 出力ファイル名
     * @param {string} rootId - ルートID
     * @param {(ok:boolean)=>void} cb - ACK
     * @returns {void} 返り値なし ACK と push で通知します。
     */
    socket.on("addOutputFile", (projectRootDir, nodeId, fileName, rootId, cb)=>{
      const wf = getOrInitWorkflow(projectRootDir, rootId || "root");
      const node = findNodeById(wf, nodeId);
      if (!node) return cb?.(false);

      node.outputFiles = Array.isArray(node.outputFiles) ? node.outputFiles : [];
      if (!node.outputFiles.some((f)=>{
        return f && f.name === fileName;
      }))
        node.outputFiles.push({ name: fileName, dst: [] });
      node.output_files = node.outputFiles;

      const pj = getOrInitProjectJson(projectRootDir, rootId || "root");
      const compRel = pj && pj.componentPath && pj.componentPath[nodeId];
      const workRoot = resolveWorkingRoot(projectRootDir);
      const compName = compRel
        ? String(compRel).replace(/^\.\?\//, "")
        : (findNodeById(getOrInitWorkflow(projectRootDir, rootId || "root"), nodeId)?.name || "component");
      addFile(projectRootDir, workRoot + "/" + compName + "/" + fileName);

      cb?.(true);
      io.emit("workflow", clone(wf));
    });

    /**
     * Workflow（プロパティ／入出力）: 入力ファイル名の改名
     * - inputFiles[i].name を変更し、links 側のラベルも追随。
     * @param {string} projectRootDir - プロジェクトのルートパス
     * @param {string} nodeId - 対象ノードID
     * @param {number} index - 変更対象の行インデックス
     * @param {string} newName - 新しい名前
     * @param {string} rootId - ルートID
     * @param {(ok:boolean)=>void} cb - ACK
     * @returns {void} 返り値なし ACK と push で通知します。
     */
    socket.on("renameInputFile", (projectRootDir, nodeId, index, newName, rootId, cb)=>{
      try {
        const wf = getOrInitWorkflow(projectRootDir, rootId || "root");
        const node = findNodeById(wf, nodeId);
        if (!node) return cb?.(false);

        node.inputFiles = Array.isArray(node.inputFiles) ? node.inputFiles : [];
        const i = Number(index);
        if (!Number.isInteger(i) || i < 0 || i >= node.inputFiles.length) return cb?.(false);

        const oldName = node.inputFiles[i]?.name || "";
        const nextName = String(newName || "");
        const current = node.inputFiles[i] || {};
        node.inputFiles[i] = { name: nextName, src: Array.isArray(current.src) ? current.src : [] };
        node.inputFiles = node.inputFiles.filter((ent, idx)=>{
          return (idx === i) || (ent && ent.name !== oldName);
        });
        node.input_files = node.inputFiles;

        if (Array.isArray(wf.links)) {
          wf.links.forEach((lk)=>{
            if (lk?.to?.id === nodeId && lk?.to?.name === oldName) lk.to.name = nextName;
            if (lk?.target?.id === nodeId && lk?.target?.name === oldName) lk.target.name = nextName;
          });
        }
        reconcileIOFromLinks(wf);
        cb?.(true);
        io.emit("workflow", clone(wf));
      } catch { cb?.(false); }
    });

    /**
     * Workflow（プロパティ／入出力）: 出力ファイル削除
     * - outputFiles から除去、links から該当参照を除去、VFS からも削除。
     * @param {string} projectRootDir - プロジェクトのルートパス
     * @param {string} nodeId - 対象ノードID
     * @param {number|string} arg3 - 削除対象（index または name）
     * @param {string|Function} arg4 - rootId またはコールバック
     * @param {(ok:boolean)=>void} [maybeCb] - ACK
     * @returns {void} 返り値なし ACK と push で通知します。
     */
    socket.on("removeOutputFile", (projectRootDir, nodeId, arg3, arg4, maybeCb)=>{
      try {
        const rootId = typeof arg4 === "string" ? arg4 : "root";
        const cb = typeof maybeCb === "function" ? maybeCb : (typeof arg4 === "function" ? arg4 : null);
        const wf = getOrInitWorkflow(projectRootDir, rootId);
        const node = (function find(w, id) {
          if (!w) return null;
          if (w.ID === id) return w;
          const st = Array.isArray(w.descendants) ? [...w.descendants] : [];
          while (st.length) {
            const n = st.shift();
            if (n?.ID === id) return n;
            if (Array.isArray(n?.descendants)) st.push(...n.descendants);
          }
          return null;
        })(wf, nodeId);
        if (!node) return cb?.(false);

        node.outputFiles = Array.isArray(node.outputFiles) ? node.outputFiles : [];
        let removed = null;
        if (typeof arg3 === "number") {
          const i = arg3;
          if (Number.isInteger(i) && i >= 0 && i < node.outputFiles.length) removed = node.outputFiles.splice(i, 1)[0] || null;
        } else if (typeof arg3 === "string") {
          const before = node.outputFiles.length;
          node.outputFiles = node.outputFiles.filter((f)=>{
            return f && f.name !== arg3;
          });
          if (node.outputFiles.length !== before) removed = { name: arg3 };
        }
        node.output_files = node.outputFiles;

        if (removed?.name && Array.isArray(wf.links)) {
          wf.links = wf.links.filter((lk)=>{
            return !(lk?.from?.id === nodeId && lk?.from?.name === removed.name);
          });
        }
        if (removed?.name) {
          const pj = getOrInitProjectJson(projectRootDir, rootId);
          const compRel = pj?.componentPath?.[nodeId];
          const workRoot = resolveWorkingRoot(projectRootDir);
          const compName = compRel ? String(compRel).replace(/^\.\?\//, "") : (node.name || ("node_" + nodeId));
          const compDir = normPath(workRoot + "/" + compName);
          removeFileFromVFS(projectRootDir, compDir + "/" + removed.name);
        }
        cb?.(!!removed);
        io.emit("workflow", JSON.parse(JSON.stringify(wf)));
      } catch {
        if (typeof maybeCb === "function") maybeCb(false);
        else if (typeof arg4 === "function") arg4(false);
      }
    });

    /**
     * Workflow（キャンバス）: ファイルリンク（出力→入力）
     * - glob の場合は to.name を "./" に正規化。
     * - links/I-O を同期して push。
     * @param {string} projectRootDir - プロジェクトのルートパス
     * @param {string} sourceNodeId - 出力元ノードID
     * @param {string} sourceFileName - 出力元ファイル名（glob 可）
     * @param {string} targetNodeId - 入力先ノードID
     * @param {string} targetFileName - 入力先ファイル名
     * @param {string} rootId - ルートID
     * @param {(ok:boolean)=>void} cb - ACK
     * @returns {void} 返り値なし ACK と push で通知します。
     */
    socket.on(
      "addFileLink",
      function (projectRootDir, sourceNodeId, sourceFileName, targetNodeId, targetFileName, rootId, cb) {
        try {
          const wf = getOrInitWorkflow(projectRootDir, rootId || "root");
          const src = (wf.descendants || []).find((n)=>{
            return n && n.ID === sourceNodeId;
          });
          const dst = (wf.descendants || []).find((n)=>{
            return n && n.ID === targetNodeId;
          });

          const isGlob = /[*?]/.test(String(sourceFileName || ""));
          const tgtName = isGlob ? "./" : String(targetFileName || "");

          if (src) {
            src.outputFiles = Array.isArray(src.outputFiles) ? src.outputFiles : [];
            let of = src.outputFiles.find((f)=>{
              return f && f.name === sourceFileName;
            });
            if (!of) {
              of = { name: sourceFileName, dst: [] };
              src.outputFiles.push(of);
            }
            of.dst = Array.isArray(of.dst) ? of.dst : [];
            src.output_files = src.outputFiles;
          }
          if (dst) {
            dst.inputFiles = Array.isArray(dst.inputFiles) ? dst.inputFiles : [];
            let inf = dst.inputFiles.find((f)=>{
              return f && f.name === tgtName;
            });
            if (!inf) {
              inf = { name: tgtName, src: [] };
              dst.inputFiles.push(inf);
            }
            inf.src = Array.isArray(inf.src) ? inf.src : [];
            dst.input_files = dst.inputFiles;
          }
          if (src && sourceFileName) {
            const of = src.outputFiles.find((f)=>{
              return f && f.name === sourceFileName;
            });
            const toRef = { dstNode: targetNodeId, dstName: tgtName };
            if (!of.dst.some((r)=>{
              return r && r.dstNode === toRef.dstNode && r.dstName === toRef.dstName;
            })) of.dst.push(toRef);
          }
          if (dst && tgtName) {
            const inf = dst.inputFiles.find((f)=>{
              return f && f.name === tgtName;
            });
            const fromRef = { srcNode: sourceNodeId, srcName: sourceFileName };
            if (!inf.src.some((r)=>{
              return r && r.srcNode === fromRef.srcNode && r.srcName === fromRef.srcName;
            })) inf.src.push(fromRef);
          }

          wf.links = Array.isArray(wf.links) ? wf.links : [];
          const exists = wf.links.some((e)=>{
            return e && e.from && e.to
              && e.from.id === sourceNodeId && e.to.id === targetNodeId
              && e.from.name === sourceFileName && e.to.name === tgtName;
          }
          );
          if (!exists) {
            const link = {
              id: "e-" + Date.now(),
              from: { id: sourceNodeId, name: sourceFileName },
              to: { id: targetNodeId, name: tgtName },
              type: "file"
            };
            link.source = link.from;
            link.target = link.to;
            wf.links.push(link);
          }
          cb?.(true);
          reconcileIOFromLinks(wf);
          io.emit("workflow", clone(wf));
        } catch (e) {
          console.log("[MockServer] addFileLink error:", e && e.message);
          cb?.(false);
        }
      }
    );

    /*----------------------------------------------------------------------
     * ファイル操作（File Browser）
     * --------------------------------------------------------------------*/

    /**
     * FileBrowser: ディレクトリ直下列挙（mode=underComponent）
     * @param {string} projectRootDir - プロジェクトのルートパス
     * @param {{path?:string,mode?:string}} opt - オプション（path, mode）
     * @param {(list:any[])=>void} cb - 取得コールバック
     * @returns {void} 返り値なし cb で一覧を返す
     */
    socket.on("getFileList", (...args)=>{
      const projectRootDir = args[0];
      const opt = args[1] && typeof args[1] === "object" ? args[1] : {};
      const cb = args[2];
      let result = [];
      try {
        if (opt && opt.mode === "underComponent" && typeof opt.path === "string") {
          result = listEntries(projectRootDir, opt.path);
        } else {
          result = [];
        }
      } catch {
        result = [];
      }
      cb?.(result);
    });

    /**
     * FileBrowser: 新規ファイル作成
     * @param {string} projectRootDir - プロジェクトのルートパス
     * @param {string} filePath - 作成するファイルのフルパス
     * @param {(ok:boolean)=>void} cb - ACK
     * @returns {void} 返り値なし ACK で通知します。
     */
    socket.on("createNewFile", (projectRootDir, filePath, cb)=>{
      try {
        if (typeof filePath === "string" && filePath) {
          addFile(projectRootDir, filePath);
          const workRoot = resolveWorkingRoot(projectRootDir);
          const plainRoot = String(projectRootDir).replace(/\/+$/, "");
          const p = normPath(filePath);
          let alt = null;
          if (p.startsWith(workRoot + "/")) alt = plainRoot + p.slice(workRoot.length);
          else if (p.startsWith(plainRoot + "/")) alt = workRoot + p.slice(plainRoot.length);
          if (alt) addFile(projectRootDir, alt);
        }
        cb?.(true);
      } catch { cb?.(false); }
    });

    /**
     * FileBrowser: 新規ディレクトリ作成
     * - ACK 形式は本番相当（配列で { dirname, parent }）。
     * @param {string} projectRootDir - プロジェクトのルートパス
     * @param {string} dirFullPath - 作成するディレクトリのフルパス
     * @param {(ack:any)=>void} cb - ACK
     * @returns {void} 返り値なし ACK で通知します。
     */
    socket.on("createNewDir", (projectRootDir, dirFullPath, cb)=>{
      try {
        const d = normPath(dirFullPath);
        if (!d) return cb?.(false);
        addDir(projectRootDir, d);
        const alt = mirrorAltPath(projectRootDir, d);
        if (alt) addDir(projectRootDir, alt);
        const parent = parentDir(d);
        cb?.([{ dirname: d, parent }]);
      } catch { cb?.(false); }
    });

    /**
     * ファイルを開く（テキストエディタ・PSエディタ用）
     * - パスが parameterSetting.json の場合は parameterSettingFile イベントを emit。
     * - その他は file イベントを emit。
     * - targetFiles に列挙された各ファイルも順に file イベントで emit。
     * @param {string} projectRootDir - プロジェクトのルートパス
     * @param {string} filename - 開くファイルのフルパス
     * @param {boolean} forceNormal - true の場合は必ず file イベントとして扱う
     * @param {(ok:boolean)=>void} cb - ACK
     * @returns {void} 返り値なし ACK と push で通知します。
     */
    socket.on("openFile", (projectRootDir, filename, forceNormal, cb)=>{
      try {
        const fp = normPath(filename);
        const content = _FILE_CONTENTS.get(fp) ?? "";
        const base = basenameNoSlash(fp);
        const dir = parentDir(fp);
        let parsed = null;
        if (!forceNormal) {
          try {
            parsed = JSON.parse(content);
          } catch { /*not JSON */ }
        }
        if (!forceNormal && parsed && Array.isArray(parsed.targetFiles)) {
          socket.emit("parameterSettingFile", { content, filename: base, dirname: dir, isParameterSettingFile: true });

          for (const tf of parsed.targetFiles) {
            const tfName = typeof tf === "string" ? tf : (tf && tf.targetName);
            if (!tfName) continue;
            const tfPath = tfName.startsWith("/") ? normPath(tfName) : normPath(`${dir}/${tfName}`);
            const tfContent = _FILE_CONTENTS.get(tfPath) ?? "";
            socket.emit("file", { content: tfContent, filename: basenameNoSlash(tfPath), dirname: parentDir(tfPath) });
          }
        } else {
          socket.emit("file", { content, filename: base, dirname: dir });
        }
        cb?.(true);
      } catch (e) {
        warn("[MockServer] openFile error:", e?.message || e);
        cb?.(false);
      }
    });

    /**
     * ファイルを保存（テキストエディタ・PSエディタ用）
     * - VFS にコンテンツを保存し、ファイルパスを登録する。
     * @param {string} projectRootDir - プロジェクトのルートパス
     * @param {string} filename - ファイル名
     * @param {string} dirname - ディレクトリパス
     * @param {string} content - 保存するコンテンツ
     * @param {(ok:boolean)=>void} cb - ACK
     * @returns {void} 返り値なし ACK で通知します。
     */
    socket.on("saveFile", (projectRootDir, filename, dirname, content, cb)=>{
      try {
        const absPath = normPath(`${dirname}/${filename}`);
        _FILE_CONTENTS.set(absPath, content);
        addFile(projectRootDir, absPath);
        cb?.(true);
      } catch (e) {
        warn("[MockServer] saveFile error:", e?.message || e);
        cb?.(false);
      }
    });

    /**
     * コンポーネント削除
     * - 更新後の workflow / projectJson を push
     * @param {string} projectRootDir
     * @param {string} nodeId
     * @param {string} rootId
     * @param {(ok:boolean)=>void} cb
     * @returns {void}
     */
    socket.on("removeNode", (projectRootDir, nodeId, rootId, cb)=>{
      try {
        const wf = getOrInitWorkflow(projectRootDir, rootId || "root");
        if (!wf || !Array.isArray(wf.descendants)) return cb?.(false);
        //対象ノードを検索
        const idx = wf.descendants.findIndex((n)=>{
          return n && n.ID === nodeId;
        });
        if (idx === -1) return cb?.(false);
        //ノード削除
        const removed = wf.descendants.splice(idx, 1)[0];
        //リンク（from/to）を削除
        if (Array.isArray(wf.links)) {
          wf.links = wf.links.filter((lk)=>{
            const fId = lk?.from?.id ?? lk?.source?.id;
            const tId = lk?.to?.id ?? lk?.target?.id;
            return fId !== nodeId && tId !== nodeId;
          });
        } else {
          wf.links = [];
        }
        //互換エイリアス
        wf.edges = wf.links;
        wf.connections = wf.links;
        //projectJson の componentPath からも削除
        const pj = getOrInitProjectJson(projectRootDir, rootId || "root");
        if (pj && pj.componentPath && nodeId in pj.componentPath) {
          delete pj.componentPath[nodeId];
          io.emit("projectJson", pj);
        }
        cb?.(true);
        io.emit("workflow", clone(wf));
      } catch (e) {
        console.warn("[MockServer] removeNode error:", e?.message || e);
        cb?.(false);
      }
    });

    /*----------------------------------------------------------------------
     * 実行系（Run/Clean）
     * --------------------------------------------------------------------*/

    /**
     * Workflow: コンポーネント単体クリーン
     * - コンポーネントの状態を作成時のスナップショットに戻し、更新workflowをpush。
     * @param {string} projectRootDir - プロジェクトのルートパス
     * @param {string} nodeId - クリーン対象のコンポーネントID
     * @param {(ok:boolean)=>void} cb - ACK
     * @returns {void} 返り値なし ACK と push で通知します。
     */
    socket.on("cleanComponent", (projectRootDir, nodeId, cb)=>{
      try {
        const wf = getOrInitWorkflow(projectRootDir, "root");
        const snapshot = _COMPONENT_SNAPSHOTS.get(nodeId);
        if (!snapshot) return cb?.(false);
        const original = JSON.parse(snapshot);
        const idx = wf.descendants.findIndex((n)=>{ return n && n.ID === nodeId; });
        if (idx === -1) return cb?.(false);
        const current = wf.descendants[idx];
        wf.descendants[idx] = { ...current, name: original.name };
        const pj = getOrInitProjectJson(projectRootDir, "root");
        pj.componentPath[nodeId] = original.name;
        io.emit("projectJson", pj);
        cb?.(true);
        io.emit("workflow", clone(wf));
      } catch (e) {
        console.warn("[MockServer] cleanComponent error:", e?.message || e);
        cb?.(false);
      }
    });

    /**
     * Workflow: プロジェクト操作（Run/Clean）
     * - runProject: projectJson を running/readOnly=true → 完了で finished/readOnly=false、成果物をVFSに合成。
     * - cleanProject: workflow を空に戻す（必要に応じてVFSクリアを拡張可）。
     * @param {string} projectRootDir - プロジェクトのルートパス
     * @param {"runProject"|"cleanProject"} operation - 実行またはクリーン操作
     * @param {(ok:boolean)=>void} cb - ACK
     * @returns {void} 返り値なし ACK と push で通知します。
     */
    socket.on("projectOperation", (projectRootDir, operation, cb)=>{
      cb?.(true);

      if (operation === "runProject") {
        //開始：実行中ロック
        const pj = getOrInitProjectJson(projectRootDir, "root");
        pj.state = "running";
        pj.readOnly = true;
        io.emit("projectJson", pj);
        io.emit("projectState", "running");

        setTimeout(()=>{
          try {
            const wf = getOrInitWorkflow(projectRootDir, "root");
            const pj = getOrInitProjectJson(projectRootDir, "root");
            const nodes = Array.isArray(wf.descendants) ? wf.descendants : [];

            const getDir = (nodeId)=>{
              return getComponentDir(projectRootDir, wf, pj, nodeId).replace(/\/+$/, "");
            };
            const { files } = ensureSets(projectRootDir);

            for (const dstNode of nodes) {
              const inputs = Array.isArray(dstNode.inputFiles) ? dstNode.inputFiles : [];
              const dstDir = getDir(dstNode.ID);
              for (const ent of inputs) {
                if (!ent || !ent.name) continue;
                const froms = (wf.links || [])
                  .filter((lk)=>{ return lk?.to?.id === dstNode.ID && lk?.to?.name === ent.name; })
                  .map((lk)=>{ return lk.from; });
                if (froms.length === 0) {
                  addFile(projectRootDir, dstDir + "/" + ent.name.replace(/\/$/, ""));
                  continue;
                }
                for (const from of froms) {
                  const srcDir = getDir(from.id);
                  const pat = /[*?]/.test(String(from.name)) ? globToRegExp(from.name) : null;

                  if (!pat) {
                  //ent.name が "/" 終了ならディレクトリに格納、それ以外は単一ファイル
                    const endsWithSlash = /\/$/.test(String(ent.name));
                    const baseName = String(ent.name).replace(/\/$/, "");
                    if (endsWithSlash) {
                      const destBase = dstDir + "/" + baseName;
                      addDir(projectRootDir, destBase); //ディレクトリを作る
                      //1件のファイル名（リンク元のベース名）で中身を作る
                      const srcFileBase = String(from.name).replace(/^.*\//, "");
                      addFile(projectRootDir, destBase + "/" + srcFileBase);
                    } else {
                    //単一ファイルとして作成
                      addFile(projectRootDir, dstDir + "/" + baseName);
                    }
                    continue;
                  }

                  const baseName = ent.name.replace(/\/$/, "");
                  const destBase = dstDir + "/" + baseName;
                  addDir(projectRootDir, destBase);

                  for (const f of files) {
                    if (!f.startsWith(srcDir + "/")) continue;
                    const rel = f.slice(srcDir.length + 1);
                    if (!rel || rel.includes("/")) continue;
                    if (!pat.test(rel)) continue;
                    addFile(projectRootDir, destBase + "/" + rel);
                  }
                }
              }
            }
          } catch (e) {
            console.log("[MockServer] simulate outputs error:", e && e.message);
          }

          //終了：ロック解除

          const pj = getOrInitProjectJson(projectRootDir, "root");
          pj.state = "finished";
          pj.readOnly = false;
          io.emit("projectJson", pj);

          io.emit("projectState", "finished");
        }, 200);
      }

      if (operation === "cleanProject") {
        io.emit("projectState", "preparing");
        const wf = { ID: "root", name: "root", typeof: "workflow", descendants: [], links: [] };
        wf.edges = wf.links;
        wf.connections = wf.links;
        io.emit("workflow", wf);
      }
    });

    /*----------------------------------------------------------------------
     * 補助スタブ（ホスト/スケジューラ）
     * --------------------------------------------------------------------*/

    /**
     * Host リスト取得（スタブ）
     * @param {(list:any[])=>void} cb - 取得コールバック
     * @returns {void} 返り値なし cbで空配列を返す
     */
    socket.on("getHostList", (cb)=>{
      return cb?.([]);
    });

    /**
     * ジョブスケジューラリスト取得（スタブ）
     * @param {(list:any[])=>void} cb - 取得コールバック
     * @returns {void} 返り値なし cbで空配列を返す
     */
    socket.on("getJobSchedulerList", (cb)=>{
      return cb?.([]);
    });

    /**
     * ノードID検索（DFS）
     * @param {any} wf - 検索対象のワークフロー
     * @param {string} id - 探索するノードID
     * @returns {any|null} 見つかったノードを返す
     */
    function findNodeById(wf, id) {
      if (!wf) return null;
      if (wf.ID === id) return wf;
      const stack = Array.isArray(wf.descendants) ? [...wf.descendants] : [];
      while (stack.length) {
        const n = stack.shift();
        if (!n) continue;
        if (n.ID === id) return n;
        if (Array.isArray(n.descendants)) stack.push(...n.descendants);
      }
      return null;
    }

    /**
     * JSON 経由の簡易ディープコピー（emit 用）
     * @param {any} obj - 変換対象オブジェクト
     * @returns {any} ディープコピー結果を返す
     */
    function clone(obj) {
      try {
        return JSON.parse(JSON.stringify(obj));
      } catch { return obj; }
    }
  });

  console.log(`[MockServer] Listening on port ${port}`);
  console.log(`[MockServer] Running on port: ${port}`);
  return null;
}

/*============================================================================
 * サーバ停止/起動補助
 * ==========================================================================*/
/**
 * モックサーバ停止
 * @returns {null} 常にnullを返す
 */
function stop() {
  console.log("[MockServer] stop() called. io is", io ? "alive" : "null");
  //このプロセスが立てたサーバだけ停止（他プロセスのものは閉じない）
  if (io && __startedHere) {
    io.close();
    io = undefined;
    __startedHere = false;
    console.log("[MockServer] Stopped (owned by this process)");
  } else {
    console.log("[MockServer] Skip stop: not owner or already down");
  }
  return null;
}

/**
 * 指定ポートが開くまで待機（起動直後の接続安定化）
 * @param {number} port - 待機対象ポート番号
 * @param {{timeoutMs?:number, intervalMs?:number}} [opts] - タイムアウト/リトライ設定
 * @returns {Promise<void>} ポートがオープンしたら解決するPromiseを返す
 */
function waitForPort(port, { timeoutMs = 5000, intervalMs = 100 } = {}) {
  const start = Date.now();
  return new Promise((resolve, reject)=>{
    const tryConnect = ()=>{
      const socket = new net.Socket();
      socket.once("connect", ()=>{
        socket.destroy();
        resolve();
      });
      socket.once("error", ()=>{
        socket.destroy();
        if (Date.now() - start > timeoutMs) reject(new Error(`Timeout waiting for port ${port}`));
        else setTimeout(tryConnect, intervalMs);
      });
      socket.connect(port, "127.0.0.1");
    };
    tryConnect();
  });
}

/**
 * Home 指定ソケットへ projectList を emit
 * @param {import("socket.io").Socket} socket - 送信先ソケット
 * @returns {void} 返り値なし projectListを送信
 */
function emitProjectList(socket) {
  console.log("[MockServer] emit projectList", STATE.projectList.length);
  socket.emit("projectList", STATE.projectList);
}

module.exports = { start, stop };
