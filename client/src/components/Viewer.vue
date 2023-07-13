/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <v-app>
    <application-tool-bar
      title="viewer"
      @navIconClick="drawer=!drawer"
    />
    <nav-drawer
      v-model="drawer"
    />
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
    <v-footer/>
  </v-app>
</template>

<script>
  "use strict";
  import "viewerjs/dist/viewer.css";
  import applicationToolBar from "@/components/common/ApplicationToolBar.vue";
  import NavDrawer from "@/components/common/NavigationDrawer.vue";
  import { component as vueViewer}  from "v-viewer";
  import SIO from "@/lib/socketIOWrapper.js";
  import { readCookie } from "@/lib/utility.js";

  export default{
    name: "Viewer",
    components:{
      applicationToolBar,
      NavDrawer,
      vueViewer
    },
    data(){
      return {
        drawer:false,
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
      // get viewer directory name from cookie
      const dir=readCookie("dir");
      //projectRootDir is not set in sessionStorage useually,
      //because viewer window opens in another window.
      //But while reloading page, projectRootDir in Cookie can be changed.
      //So, we read it from sessionStorage here
      let projectRootDir = sessionStorage.getItem("projectRootDir")
      if(! projectRootDir){
        projectRootDir = readCookie("rootDir");
        sessionStorage.setItem("projectRootDir", projectRootDir);
      }
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
