/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <v-dialog
    v-model="dialog"
    :activator="activator"
    :max-width="maxWidth"
    persistent
  >
    <v-card>
      <v-card-title>
        {{ title }}
      </v-card-title>
      <v-card-text>
        <slot name="message">
          {{ message }}
        </slot>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <div
          v-for="item in buttons"
          :key="item.label"
        >
          <v-btn
            :prepend-icon="item.icon"
            :text="item.label"
            @click="$emit(item.label)"
          />
        </div>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script>
export default {
  name: "VersatileDialog",
  props: {
    activator: {
      type: [String, Object],
      default: undefined
    },
    modelValue: {
      type: Boolean,
      required: true
    },
    persistent: {
      type: Boolean,
      default: true
    },
    buttons: {
      type: Array,
      default: function () {
        return [
          { icon: "mdi-check", label: "ok" },
          { icon: "mdi-close", label: "cancel" }
        ];
      }
    },
    title: {
      type: String,
      default: ""
    },
    message: {
      type: String,
      default: ""
    },
    maxWidth: {
      type: [String, Number],
      default: undefined
    }
  },
  emits: ["update:modelValue"],
  computed: {
    dialog: {
      get() {
        return this.modelValue;
      },
      set(v) {
        this.$emit("update:modelValue", v);
      }
    }
  }

};
</script>
