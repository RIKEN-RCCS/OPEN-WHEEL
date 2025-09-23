/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */
<template>
  <div
    :ref="(el) =>{setItemWidth(el)}"
  >
    <v-btn
      variant="text"
      block
      class="justify-start"
      :data-cy="`${dataCyPrefix}-btn`"
      @click="newVal = currentValue"
    >
      {{ currentValue }}
      <v-dialog
        activator="parent"
        location-strategy="connected"
        location="bottom start"
        origin="auto"
        :width="width"
      >
        <template #default="{isActive}">
          <v-card
            v-if="textArea"
          >
            <v-card-text>
              <v-textarea
                v-model="newVal"
                :rules="rules"
                :bg-color="inputBackgroundColor"
                :data-cy="`${dataCyPrefix}-textarea`"
                clearable
              />
            </v-card-text>
            <v-card-actions>
              <v-btn
                :data-cy="`${dataCyPrefix}_textarea_ok-btn`"
                @click="isActive.value=false;$emit('confirmed', newVal)"
              >
                OK
              </v-btn>
              <v-btn
                :data-cy="`${dataCyPrefix}_textarea_cancel-btn`"
                @click="isActive.value=false"
              >
                Cancel
              </v-btn>
            </v-card-actions>
          </v-card>
          <v-text-field
            v-else
            v-model="newVal"
            :rules="rules"
            clearable
            :data-cy="`${dataCyPrefix}-text_field`"
            :bg-color="inputBackgroundColor"
            @keyup.enter="isActive.value=false;$emit('confirmed', newVal)"
          />
        </template>
      </v-dialog>
    </v-btn>
  </div>
</template>

<script>
const inputBackgroundColor = "rgba(68,68,73,0.9)";

export default {
  name: "InlineEditor",
  props: {
    currentValue: {
      type: String,
      required: true
    },
    dataCyPrefix: {
      type: String,
      default: "inline-editor"
    },
    textArea: {
      type: Boolean,
      default: false
    },
    additionalRules: {
      type: Array,
      default: ()=>{ return []; }
    }
  },
  emits:
    ["confirmed"],
  data: ()=>{
    return {
      inputBackgroundColor,
      newVal: null,
      width: "100%",
      rules: []
    };
  },
  mounted() {
    if (this.additionalRules) {
      this.rules.push(...this.additionalRules);
    }
  },
  methods: {
    setItemWidth(el) {
      if (el) {
        this.width = el.offsetWidth;
      }
    }
  }
};
</script>
