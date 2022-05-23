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
        viwer
      </p>
      <v-spacer />
    </v-app-bar>
    <v-main>
      <ul id="list">
        <li
          v-for="item in items"
          :key="item.url"
        />
      </ul>
    </v-main>
    <v-footer app />
  </v-app>
</template>

<script>
  "use strict";
  import Viewer from "viwerjs/dist/viewer.min.js ";

  export default{
    name: "Viewer",
    data(){
      return {
        items:[]
      };
    },
    mounted(){
      const viewer = new Viewer(document.getElementById("list"), {
        inline: true,
        viewed() {
          viewer.zoomTo(1);
        }
      });
    }
  };
</script>
<style>
  @import "viewerjs/dist/viewer.min.css";
</style>
