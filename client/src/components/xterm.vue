/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <div class="xterm_mount_point text-left" />
</template>
<script>
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "@/../node_modules/xterm/css/xterm.css";
export default {
  name: "Xterm",
  props: {
    clear: {
      type: Number,
      default: 0
    },
    log:{
      type: String,
      default: ""
    }
  },
  data: ()=>{
    return {
      term: new Terminal({
        bellStyle: "none",
        convertEol: true,
        disableStdin: true,
        logLevel: "info",
      }),
      fitAddon:  new FitAddon(),
    };
  },
  watch: {
    clear: function () {
      this.term.clear();
    },
    log: function(log){
      this.term.writeln(log);
    }
  },
  mounted: function () {
    this.term.loadAddon(this.fitAddon);
    this.term.open(this.$el);
    window.addEventListener("resize", this.fit2);

    const unwatch=this.$watch(()=>{
      return this.term._core._renderService.dimensions;
    },
    ()=>{
      this.fit2();

      if(unwatch){
        unwatch();
      }
    },
    {deep:true});
  },
  beforeDestroy: function () {
    window.removeEventListener("resize", this.fit2);
  },
  methods: {
    fit2: function(){
      try{
        this.fitAddon.fit();
      } catch(err) {
        if(err.message !== "This API only accepts integers"){
          throw err;
        }
      }
    },
  },
};
</script>
