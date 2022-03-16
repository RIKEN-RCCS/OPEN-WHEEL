<template>
  <div class="xterm_mount_point" />
</template>
<script>
  import { Terminal } from "xterm";
  import {FitAddon } from "xterm-addon-fit";
  import "@/../node_modules/xterm/css/xterm.css";
  import SIO from "@/lib/socketIOWrapper.js";
  export default {
    name: "Xterm",
    props: {
      clear: {
        type: Number,
        default: 0
      },
      eventNames: {
        type: Array,
        default: ()=>{return [];}
      },
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
    },
    mounted: function () {
      this.term.loadAddon(this.fitAddon);
      this.term.open(this.$el);
      window.addEventListener("resize", this.fit2);

      for (const event of this.eventNames) {
        SIO.onGlobal(event, (data)=>{
          this.term.writeln(data);
          this.$emit("newlog");
        });
      }
      const unwatch=this.$watch(()=>{
        return this.term._core._renderService.dimensions;
      },
        (newVal, oldVal)=>{
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
