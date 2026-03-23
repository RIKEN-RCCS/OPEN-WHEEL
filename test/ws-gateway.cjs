const http = require("http");
const querystring = require("querystring");

// logging switch
const GW_VERBOSE = process.env.GW_DEBUG === "1";
const gwlog = (...a) => {
  if (GW_VERBOSE) console.log(...a);
};
const gwerr = (...a) => console.error(...a);

// http-proxy:HTTPとWebSocket両方を中継できるプロキシ
const httpProxy = require("http-proxy");
// Gateway の待受ポート
const GW_PORT = Number(process.env.GW_PORT || 3001);
// 静的配信・画面（SPA）などを提供する real-app
const REAL_APP = process.env.REAL_APP || "http://localhost:8089";
// Socket.IO モックサーバ（通常 3101）
const MOCK_SIO = process.env.MOCK_SIO || "http://localhost:3101";
// HTTPモックサーバ（通常 3102）
const MOCK_HTTP = process.env.MOCK_HTTP || "http://localhost:3102";

// Proxy インスタンス生成
const proxy = httpProxy.createProxyServer({
  xfwd: true,
  ws: true,
  changeOrigin: true,
});

// エラー時に落ちないためのerror handler
proxy.on("error", (err, req, res) => {
  gwerr("[GW][proxy error]", err.message, "url=", req?.url);
  // HTTP (res is ServerResponse)
  if (res && typeof res.writeHead === "function") {
    if (!res.headersSent) {
      res.writeHead(502, { "Content-Type": "text/plain" });
    }
    res.end("Bad Gateway");
    return;
  }
  // WS upgrade (res is actually a net.Socket)
  if (res && typeof res.destroy === "function") {
    try {
      res.destroy();
    }
    catch {
      // ignore: socket may already be closed/destroyed
    }
  }
});

/**
 * 静的配信（HTML/アセット/アップロード補助）に該当するリクエストか判定する。
 * @param {string} url リクエストURL（例: "/assets/app.js?x=1"）。クエリは判定から除外される。
 * @returns {boolean} 静的リクエストなら true、それ以外は false。
 */
function isStaticRequest(url) {
  if (!url) return false;

  // query付きでも判定できるようにする
  const path = url.split("?")[0];
  if (path === "/") return true;
  if (path.startsWith("/assets/")) return true;
  if (path.startsWith("/siofu/")) return true;
  if (path.endsWith(".html")) return true;
  return false;
}

// HTTP リクエスト（GET/POST）の処理
const server = http.createServer((req, res) => {
  const url = req.url || "";
  // POST /workflowを303でworkflow.htmlへ既存の安定化策）
  if (req.method === "POST" && (url === "/workflow" || url.startsWith("/workflow?"))) {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      const parsed = querystring.parse(body);
      const project = typeof parsed.project === "string" ? parsed.project : "";
      const cookies = [
        `rootDir=${encodeURIComponent(project)}; Path=/; SameSite=Lax`,
        `root=${encodeURIComponent("root")}; Path=/; SameSite=Lax`,
      ];
      res.statusCode = 303;
      res.setHeader("Set-Cookie", cookies);
      res.setHeader("Location", "/workflow.html");
      res.end();
    });
    return;
  }

  // GET /workflowもworkflow.html に寄せる
  if (req.method === "GET" && (url === "/workflow" || url.startsWith("/workflow?"))) {
    req.url = "/workflow.html";
  }

  const isSocket = url.startsWith("/socket.io");
  const target = isSocket
    ? MOCK_SIO
    : (isStaticRequest(url) ? REAL_APP : MOCK_HTTP);
  gwlog(`[GW][http] ${req.method} ${url} -> ${target}`);
  proxy.web(req, res, { target });
});

// WebSocket upgrade の処理
server.on("upgrade", (req, socket, head) => {
  const url = req.url || "";
  const target = url.startsWith("/socket.io") ? MOCK_SIO : REAL_APP;
  gwlog(`[GW][upgrade] ${url} -> ${target}`);
  proxy.ws(req, socket, head, { target });
});

// 起動ログ：どの経路に流れるかが一目で分かるように出す
server.listen(GW_PORT, () => {
  gwlog(`[GW] listening on http://localhost:${GW_PORT}`);
  gwlog(`[GW] /socket.io -> ${MOCK_SIO}`);
  gwlog(`[GW] static -> ${REAL_APP} (/, *.html, /assets/*)`);
  gwlog(`[GW] http-api -> ${MOCK_HTTP} (others)`);
});
