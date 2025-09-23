/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <versatile-dialog
    v-model="openDialog"
    max-width="60vw"
    title="change project/component status"
    @ok="$emit('ok');openDialog=false;"
    @cancel="$emit('cancel');openDialog=false;"
  >
    <template #message>
      <v-card-title>
        are you sure you want to change project/component state and read-only mode
      </v-card-title>
      <v-card-content>
        <v-table>
          <thead>
            <th class="text-left">
              component
            </th>
            <th class="text-left">
              state
            </th>
          </thead>
          <tbody>
            <tr
              v-for="item in targets"
              :key="item.ID"
            >
              <td>{{ item.path }}</td>
              <td>{{ item.state }}</td>
            </tr>
          </tbody>
        </v-table>
      </v-card-content>
    </template>
  </versatile-dialog>
</template>
<script>

import versatileDialog from "../components/versatileDialog.vue";
export default {
  name: "RewindStateDialog",
  components: {
    versatileDialog
  },
  props: {
    modelValue: {
      type: Boolean,
      required: true
    },
    targets: {
      type: Array,
      required: true
    }
  },
  emits: [
    "update:modelValue",
    "ok",
    "cancel"
  ],
  computed: {
    openDialog: {
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
