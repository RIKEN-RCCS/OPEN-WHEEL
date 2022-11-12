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
      template: "public/index.html",
      title: "workflow",
      filename: "workflow.html",
    },
    viewer: {
      entry: "src/viewer.js",
      template: "public/index.html",
      title: "viewer",
      filename: "viewer.html",
    },
    home:{
      entry: "src/home.js",
      template: "public/index.html",
      title: "home",
      filename: "home.html",
    },
    remotehost:{
      entry: "src/remotehost.js",
      template: "public/index.html",
      title: "remotehost",
      filename: "remotehost.html",
    }
  },
};
