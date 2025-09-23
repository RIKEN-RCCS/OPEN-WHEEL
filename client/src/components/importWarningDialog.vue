/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <versatile-dialog
    v-model="openDialog"
    max-width="60vw"
    title="IMPORTED PROJECT WARNING"
    @ok="ok"
    @cancel="cancel"
  >
    <template #message>
      <v-alert
        type="warning"
        :text="importWarningMessage"
        class="multi-line"
      />
    </template>
  </versatile-dialog>
</template>
<script>
import versatileDialog from "../components/versatileDialog.vue";

export default {
  name: "ImportWarningDialog",
  components: {
    versatileDialog
  },
  props: {
    modelValue: {
      type: Boolean,
      required: true
    }
  },
  emits: [
    "update:modelValue",
    "ok"
  ],
  data: function () {
    return {
      importWarningMessage: `Depending on the contents of the project, there is a possibility of data loss or serious and irreversible damage to the system.
  Also, due to differences in the environment (installed software, user settings such as environment variables, etc.) from when the project was created, the imported project may not work properly as-is.

  Before executing the project, please check the shell scripts set in all task, if, and while components and the values that can be rewritten in the parameter settings of the PS component.`
    };
  },
  computed: {
    openDialog: {
      get() {
        return this.modelValue;
      },
      set(v) {
        this.$emit("update:modelValue", v);
      }
    }
  },
  methods: {
    ok() {
      this.openDialog = false;
      this.$emit("ok");
    },
    cancel() {
      this.openDialog = false;
    }
  }
};
</script>
<style>
.multi-line {
  white-space: pre-line;
}
</style>
