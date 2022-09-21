module.exports = {
  lintOnSave: false,
  transpileDependencies: [
    "vuetify",
  ],
  outputDir: "../server/app/public/",
  publicPath: "./",
  pages: {
    workflow: {
      entry: "src/workflow.js",
      title: "workflow",
      filename: "workflow.html",
    },
    viewer: {
      entry: "src/viewer.js",
      title: "viewer",
      filename: "viewer.html",
    },
    home:{
      entry: "src/home.js",
      title: "home",
      filename: "home.html",
    },
    remotehost:{
      entry: "src/remotehost.js",
      title: "remotehost",
      filename: "remotehost.html",
    }
  },
};
