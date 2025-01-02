/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <div>
    <v-icon
      v-if="canEdit"
      :disabled="disabled"
      small
      class="mr-2"
      icon="mdi-pencil"
      data-cy="action_row-edit-btn"
      @click="$emit('edit', item)"
    />
    <v-icon
      v-if="canDelete"
      :disabled="disabled"
      small
      icon="mdi-delete"
      @click="$emit('delete',item)"
      icon=mdi-delete
      data-cy="action_row-delete-btn"
    />
  </div>
</template>
<script>
export default {
  name: "ActionRow",
  props: {
    item: {
      type: [Object, String],
      required: true
    },
    canEdit: {
      type: Boolean,
      default: true
    },
    canDelete: {
      type: Boolean,
      default: true
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  emits: ["edit", "delete"]
};
</script>
