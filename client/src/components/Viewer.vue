/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <v-app>
    <v-app-bar
      app
      extended
    >
      <a href="home"> <v-img :src="imgLogo" /></a>
      <span
        class="text-lowercase text-decoration-none text-h5 white--text ml-4"
      >
        viewer
      </span>
      <v-spacer />
    </v-app-bar>
    <v-main>
      <vue-viewer
        ref="viewer"
        :options="options"
        :images="images"
        class="viewer"
        @inited="inited"
      >
        <template #default="scope">
          <img
            v-for="src in scope.images"
            :key="src.url"
            class="thumbnail-img"
            :src="src.url"
            :data-src="src.url"
            :alt="title"
          >
        </template>
      </vue-viewer>
    </v-main>
    <v-footer app />
  </v-app>
</template>

<script>
  "use strict";
  import "viewerjs/dist/viewer.css";
  import imgLogo from "@/assets/wheel_logomark.png";
  import { component as vueViewer}  from "v-viewer";
  import SIO from "@/lib/socketIOWrapper.js";
  import { readCookie } from "@/lib/utility.js";

  export default{
    name: "Viewer",
    components:{
      vueViewer
    },
    data(){
      return {
        imgLogo,
        items:[],
        options:
          {
            navbar: false,
            "url":"data-src"
          }
      };
    },
    computed: {
      images(){
        return this.items;
      }
    },
    mounted(){
      // dirをcookieから取得
      const dir=readCookie("dir");
      const projectRootDir=readCookie("rootDir");
      if(typeof dir !== "string" || typeof projectRootDir !== "string"){
        return;
      }
      const baseURL=readCookie("socketIOPath");
      SIO.init(null, baseURL);
      SIO.onGlobal("resultFiles", (results)=>{
        this.items=results;
      });
      SIO.emitGlobal("getResultFiles", projectRootDir, dir, SIO.generalCallback);
    },
    methods:{
      inited (viewer) {
        this.$viewer = viewer;
      },
      show () {
        this.$viewer.show();
      }
    }
  };
</script>
<style>
  .viewer {
    background-color: #1E1E1E;
  }
  .thumbnail-img{
    border: 2px solid white;
    box-sizing: border-box;
    height: 240px;
    cursor: pointer;
    margin: 5px;
  }
</style>
