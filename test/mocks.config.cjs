// test/mocks.config.cjs
module.exports = {
  server: {
    host: "127.0.0.1",
    port: 3102,
  },
  files: { path: "mocks" },
  // 対話CLI
  plugins: {
    inquirerCli: {
      enabled: false,
    },
  },
  mock: {
    collections: {
      selected: "base",
    },
  },
  // logレベル
  log: "silly",
};
