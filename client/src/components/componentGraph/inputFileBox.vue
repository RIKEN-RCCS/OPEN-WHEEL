<template>
  <g>
    <freciever
      v-if="inputFilename"
      :center="frecieverPos"
      :component-id="componentId"
      :input-filename="inputFilename"
      @drop="onDrop"
      @click="onClick"
    />
    <text-box
      :center="frecieverPos"
      :text="inputFilename"
    />
  </g>
</template>
<script>
"use strict";
import { mapState } from "vuex";
import Freciever from "../../components/componentGraph/freciever.vue";
import TextBox from "../../components/componentGraph/textBox.vue";
import { calcFreceiverPos } from "../../lib/utils.js";

export default {
  name: "InputFileBox",
  components: {
    Freciever,
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
    inputFilename: {
      type: String,
      default: ""
    }
  },
  emits: [
    "addFileLink",
    "removeFileLink"
  ],
  computed: {
    ...mapState(["projectRootDir", "currentComponent"]),
    frecieverPos() {
      return calcFreceiverPos(this.center, this.index);
    }
  },
  methods: {
    onDrop(e) {
      this.$emit("addFileLink", e.detail.componentID, e.detail.srcName, this.inputFilename);
    },
    onClick() {
      this.$emit("removeFileLink", this.inputFilename);
    }
  }
};
</script>
