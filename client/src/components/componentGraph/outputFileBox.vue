<template>
  <g>
    <text-box
      :center="fsenderPos"
      :text="outputFilename"
      text-anchor="end"
    />
    <fsender
      v-if="outputFilename"
      :start="fsenderPos"
      :box-height="boxHeight"
      :component-id="componentId"
      :output-filename="outputFilename"
    />
  </g>
</template>
<script>
"use strict";
import Fsender from "../../components/componentGraph/fsender.vue";
import TextBox from "../../components/componentGraph/textBox.vue";
import { calcFsenderPos } from "../../lib/utils.js";

export default {
  name: "OutputFileBox",
  components: {
    Fsender,
    TextBox
  },
  props: {
    center: {
      required: true,
      type: Object
    },
    index: {
      required: true,
      type: Number
    },
    componentId: {
      required: true,
      type: String
    },
    outputFilename: {
      type: String,
      default: ""
    },
    boxHeight: {
      required: true,
      type: Number
    }
  },
  computed: {
    fsenderPos() {
      return calcFsenderPos(this.center, this.index);
    }
  }
};
</script>
