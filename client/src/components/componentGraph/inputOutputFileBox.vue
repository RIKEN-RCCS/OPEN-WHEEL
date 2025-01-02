<template>
  <g>
    <rect
      :x="x"
      :y="y"
      :width="width"
      :height="height"
      :fill="componentBackgroundColor"
    />
    <input-file-box
      v-if="hasInputFileBox"
      :center="center"
      :index="index"
      :component-id="componentId"
      :input-filename="inputFilename"
      @add-file-link="onAddFileLink"
      @remove-file-link="onRemoveFileLink"
    />
    <output-file-box
      v-if="hasOutputFileBox"
      :center="center"
      :index="index"
      :box-height="boxHeight"
      :component-id="componentId"
      :output-filename="outputFilename"
    />
  </g>
</template>
<script>
"use strict";
import InputFileBox from "../../components/componentGraph/inputFileBox.vue";
import OutputFileBox from "../../components/componentGraph/outputFileBox.vue";
import { boxWidth, textHeight, componentBackgroundColor } from "../../lib/constants.json";

export default {
  name: "InputOutputFileBox",
  components: {
    InputFileBox,
    OutputFileBox
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
    outputFilename: {
      type: String,
      default: null
    },
    inputFilename: {
      type: String,
      default: null
    },
    componentId: {
      required: true,
      type: String
    },
    boxHeight: {
      required: true,
      type: Number
    }
  },
  emits: [
    "addFileLink",
    "removeFileLink"
  ],
  data() {
    return {
      width: boxWidth,
      height: textHeight,
      componentBackgroundColor: componentBackgroundColor
    };
  },
  computed: {
    hasInputFileBox() {
      return this.inputFilename !== null;
    },
    hasOutputFileBox() {
      return this.outputFilename !== null;
    },
    x() {
      return this.center.x - boxWidth / 2;
    },
    y() {
      return this.center.y + textHeight * (this.index + 1) - textHeight / 2;
    }
  },
  methods: {
    onAddFileLink(srcNode, srcName, inputFilename) {
      this.$emit("addFileLink", srcNode, srcName, inputFilename);
    },
    onRemoveFileLink(inputFilename) {
      this.$emit("removeFileLink", inputFilename);
    }
  }
};
</script>
