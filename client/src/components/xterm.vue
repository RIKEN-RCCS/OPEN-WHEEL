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
import { Terminal } from "xterm";
import "../../node_modules/xterm/css/xterm.css";
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
    return {
      term: new Terminal({
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
      })
    };
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
  methods: {
    fit() {
      debug(`current size: cols=${this.term.cols}, rows=${this.term.rows}`);
      const height = this.$el.clientHeight > 0 ? this.$el.clientHeight : this.canvasHeight * 0.4;
      const width = this.$el.clientWidth > 0 ? this.$el.clientWidth : this.canvasWidth;
      debug(`area size: width=${width}, height=${height}`);
      const fontSize = window.getComputedStyle(this.$el, null).getPropertyValue("font-size")
        .replace("px", "");
      debug(`fontsize = ${fontSize}`);
      const rows = Math.floor(height / fontSize);
      const cols = Math.floor(width / fontSize);
      this.term.resize(cols, rows);
      debug(`new size: cols=${this.term.cols}, rows=${this.term.rows}`);
    }
  },
  computed: {
    ...mapState(["canvasWidth", "canvasHeight"])
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
  beforeDestroy() {
    window.removeEventListener("resize", this.fit.bind(this));
  }
};
</script>
