/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <div class="xterm_mount_point text-left" />
</template>
<script>
import { mapState } from "vuex";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "../../../node_modules/@xterm/xterm/css/xterm.css";
import Debug from "debug";
const debug = Debug("wheel:workflow:xterm");

export default {
  name: "Xterm",
  props: {
    clear: {
      type: Number,
      default: 0
    },
    log: {
      type: String,
      default: ""
    }
  },
  data: ()=>{
    const term = new Terminal({
      bellStyle: "none",
      convertEol: true,
      disableStdin: true,
      logLevel: "info",
      cursorBlink: false,
      cursorStyle: "bar",
      cursorWidth: 1,
      cursorInactiveStyle: "none",
      logger: {
        trace: debug,
        debug: debug,
        info: debug,
        warn: debug,
        error: debug
      }
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    return {
      term,
      fitAddon
    };
  },
  computed: {
    ...mapState(["canvasWidth", "canvasHeight"])
  },
  watch: {
    clear() {
      this.term.clear();
    },
    log(log) {
      if (log.endsWith("\n")) {
        this.term.write(log);
        return;
      }
      this.term.writeln(log);
    }
  },
  mounted() {
    this.term.open(this.$el);
    //following watch call back will fire immediately after canvasWidth and canvasHeight is set in graphView's mounted hook
    const unwatch = this.$watch("canvasHeight", ()=>{
      this.fit();
      unwatch();
    });
    window.addEventListener("resize", this.fit.bind(this));
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.fit.bind(this));
  },
  methods: {
    fit() {
      this.fitAddon.fit();
    }
  }
};
</script>
