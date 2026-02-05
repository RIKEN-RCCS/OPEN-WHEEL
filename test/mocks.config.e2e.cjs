// test/mocks.config.e2e.cjs
module.exports = {
  server: { port: 3102 },
  files: { path: "mocks" },

  // 対話CLIを有効
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
  log: "debug",
};
