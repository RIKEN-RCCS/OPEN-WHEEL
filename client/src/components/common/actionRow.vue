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
      @click="$emit('edit', item)"
      icon="mdi-pencil"
      data-cy="action_row-edit-btn"
    />
    <v-icon
      v-if="canDelete"
      :disabled="disabled"
      small
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
    item: [Object, String],
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
  }
};
</script>
