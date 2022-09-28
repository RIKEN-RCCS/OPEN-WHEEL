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
      <a
        href="/home"
        class="text-uppercase text-decoration-none text-h4 white--text"
      > WHEEL </a>
      <v-spacer />
      <p>
        viewer
      </p>
      <v-spacer />
    </v-app-bar>
    <v-main>
      <v-viewer
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
            class="borderd-img"
            :src="src.url"
            :data-src="src.url"
            :alt="title"
          >
        </template>
      </v-viewer>
    </v-main>
    <v-footer app />
  </v-app>
</template>

<script>
  "use strict";
  import "viewerjs/dist/viewer.css";
  import { component as VViewer }  from "v-viewer";
  import SIO from "@/lib/socketIOWrapper.js";
  import { readCookie } from "@/lib/utility.js";

  export default{
    name: "Viewer",
    components:{
     VViewer
    },
    data(){
      return {
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
  .borderd-img{
    border: 2px solid white;
    box-sizing: border-box;
  }
</style>
