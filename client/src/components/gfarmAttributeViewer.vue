<!--
 Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 See License in the project root for the license information.
-->
<template>
  <v-dialog
    :model-value="modelValue"
    max-width="85vw"
    scrollable
    data-cy="gfarm_attribute_viewer-dialog"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon
          class="mr-2"
          icon="mdi-database-search"
        />
        {{ filename }}
        <v-spacer />
        <v-btn
          icon="mdi-close"
          variant="text"
          data-cy="gfarm_attribute_viewer-close-btn"
          @click="$emit('update:modelValue', false)"
        />
      </v-card-title>

      <v-divider />

      <v-card-text style="height: 75vh; overflow: hidden;">
        <v-row
          class="fill-height"
          no-gutters
        >
          <!-- Left column: search + component tree -->
          <v-col
            cols="4"
            class="pr-2 d-flex flex-column"
            style="height: 100%;"
          >
            <v-text-field
              v-model="searchQuery"
              class="mb-2 flex-grow-0"
              prepend-inner-icon="mdi-magnify"
              label="search components"
              density="compact"
              variant="outlined"
              clearable
              hide-details
            />
            <div style="overflow-y: auto; flex: 1 1 0;">
              <my-treeview
                v-if="treeItems.length > 0"
                data-cy="gfarm_attribute_viewer-tree"
                :items="filteredTreeItems"
                :open-all="!!searchQuery"
                activatable
                item-key="id"
                :get-node-icon="getNodeIcon"
                :get-leaf-icon="getLeafIcon"
                @update:active="onSelectComponent"
              >
                <template #label="{ item }">
                  <span :class="{ 'uploader-highlight': item.isUploader }">
                    <v-icon
                      v-if="item.isUploader"
                      size="small"
                      class="mr-1"
                      icon="mdi-upload-circle"
                      color="teal"
                    />
                    {{ item.name }}
                    <v-chip
                      size="x-small"
                      class="ml-1"
                    >
                      {{ item.type }}
                    </v-chip>
                  </span>
                </template>
              </my-treeview>
              <v-alert
                v-else-if="xml && treeItems.length === 0"
                type="warning"
                density="compact"
                text="No components found in attribute data."
              />
              <v-alert
                v-else-if="!xml"
                type="info"
                density="compact"
                text="No attribute data available for this file."
              />
            </div>
          </v-col>

          <v-divider vertical />

          <!-- Right column: breadcrumb + detail card -->
          <v-col
            cols="8"
            class="pl-3 d-flex flex-column"
            style="height: 100%;"
          >
            <!-- Provenance breadcrumb -->
            <v-breadcrumbs
              v-if="breadcrumbItems.length > 0"
              :items="breadcrumbItems"
              class="pa-0 mb-3 flex-grow-0"
              density="compact"
            >
              <template #divider>
                <v-icon icon="mdi-chevron-right" />
              </template>
              <template #title="{ item }">
                <span
                  :class="{ 'font-weight-bold text-teal': item.isUploader }"
                >{{ item.title }}</span>
              </template>
            </v-breadcrumbs>

            <!-- Component detail card -->
            <div style="overflow-y: auto; flex: 1 1 0;">
              <v-card
                v-if="selectedComponent"
                variant="outlined"
                data-cy="gfarm_attribute_viewer-detail"
              >
                <v-card-title class="text-body-1">
                  <v-chip
                    size="small"
                    class="mr-2"
                    :color="typeColor(selectedComponent.type)"
                  >
                    {{ selectedComponent.type }}
                  </v-chip>
                  {{ selectedComponent.name }}
                </v-card-title>
                <v-divider />
                <v-card-text>
                  <v-table density="compact">
                    <tbody>
                      <tr v-if="selectedComponent.description">
                        <td class="text-caption font-weight-bold">
                          description
                        </td>
                        <td>{{ selectedComponent.description }}</td>
                      </tr>
                      <tr v-if="selectedComponent.host">
                        <td class="text-caption font-weight-bold">
                          host
                        </td>
                        <td>{{ selectedComponent.host }}</td>
                      </tr>
                      <tr v-if="selectedComponent.script">
                        <td class="text-caption font-weight-bold">
                          script
                        </td>
                        <td>
                          <code>{{ selectedComponent.script }}</code>
                        </td>
                      </tr>
                      <tr v-if="selectedComponent.checker">
                        <td class="text-caption font-weight-bold">
                          checker
                        </td>
                        <td>
                          <code>{{ selectedComponent.checker }}</code>
                        </td>
                      </tr>
                      <tr v-if="selectedComponent.storagePath">
                        <td class="text-caption font-weight-bold">
                          storage path
                        </td>
                        <td>
                          <code>{{ selectedComponent.storagePath }}</code>
                        </td>
                      </tr>
                      <tr v-if="selectedComponent.state">
                        <td class="text-caption font-weight-bold">
                          state
                        </td>
                        <td>{{ selectedComponent.state }}</td>
                      </tr>
                    </tbody>
                  </v-table>

                  <!-- inputFiles -->
                  <div
                    v-if="selectedComponent.inputFiles && selectedComponent.inputFiles.length > 0"
                    class="mt-3"
                  >
                    <div class="text-caption font-weight-bold mb-1">
                      input files
                    </div>
                    <v-table density="compact">
                      <thead>
                        <tr>
                          <th>name</th>
                          <th>mandatory</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="f in selectedComponent.inputFiles"
                          :key="f.name"
                        >
                          <td>{{ f.name }}</td>
                          <td>
                            <v-icon
                              v-if="f.mandatory"
                              icon="mdi-check"
                              color="error"
                              size="small"
                            />
                          </td>
                        </tr>
                      </tbody>
                    </v-table>
                  </div>

                  <!-- outputFiles -->
                  <div
                    v-if="selectedComponent.outputFiles && selectedComponent.outputFiles.length > 0"
                    class="mt-3"
                  >
                    <div class="text-caption font-weight-bold mb-1">
                      output files
                    </div>
                    <v-table density="compact">
                      <thead>
                        <tr>
                          <th>name</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="f in selectedComponent.outputFiles"
                          :key="f.name"
                        >
                          <td>{{ f.name }}</td>
                        </tr>
                      </tbody>
                    </v-table>
                  </div>

                  <!-- env vars -->
                  <div
                    v-if="selectedComponent.env && Object.keys(selectedComponent.env).length > 0"
                    class="mt-3"
                  >
                    <div class="text-caption font-weight-bold mb-1">
                      environment variables
                    </div>
                    <v-table density="compact">
                      <thead>
                        <tr>
                          <th>name</th>
                          <th>value</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="(value, key) in selectedComponent.env"
                          :key="key"
                        >
                          <td>{{ key }}</td>
                          <td>{{ value }}</td>
                        </tr>
                      </tbody>
                    </v-table>
                  </div>
                </v-card-text>
              </v-card>
              <v-alert
                v-else
                type="info"
                density="compact"
                text="Select a component from the tree to view its details."
              />
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
import myTreeview from "./common/myTreeview.vue";

const typeColorMap = {
  task: "#3B55B3",
  workflow: "#803DB3",
  storage: "#00b8a0",
  hpciss: "#00b8a0",
  hpcisstar: "#00b8a0",
  source: "#00bff0",
  viewer: "#00b050",
  if: "#5B5B5F",
  for: "#247780",
  while: "#247780",
  foreach: "#247780",
  parameterStudy: "#666622"
};

/**
 * Parse a <component> XML element into a plain JS object for the tree.
 * @param {Element} el - XML component element
 * @param {string} uploaderType - type string of the uploading component ("hpciss" or "hpcisstar")
 * @returns {object} - component data object with optional children array
 */
function parseComponentElement(el, uploaderType) {
  const id = el.getAttribute("id");
  const type = el.getAttribute("type");
  const name = el.getAttribute("name");
  const isUploader = type === uploaderType || (uploaderType && ["hpciss", "hpcisstar"].includes(type));

  const getText = (tag)=>{
    const child = el.querySelector(`:scope > ${tag}`);
    return child ? child.textContent || null : null;
  };

  const inputFiles = [...el.querySelectorAll(":scope > inputFiles > inputFile")].map((f)=>{
    return {
      name: f.getAttribute("name"),
      mandatory: f.getAttribute("mandatory") === "true"
    };
  });

  const outputFiles = [...el.querySelectorAll(":scope > outputFiles > outputFile")].map((f)=>{
    return {
      name: f.getAttribute("name")
    };
  });

  const envEntries = [...el.querySelectorAll(":scope > env > variable")].map((v)=>{
    return [v.getAttribute("name"), v.textContent];
  });
  const env = Object.fromEntries(envEntries);

  const childEls = [...el.querySelectorAll(":scope > children > component")];
  const children = childEls.map((c)=>{
    return parseComponentElement(c, uploaderType);
  });

  const node = {
    id,
    name,
    type,
    isUploader,
    description: getText("description"),
    host: getText("host"),
    script: getText("script"),
    checker: getText("checker"),
    storagePath: getText("storagePath"),
    state: getText("state"),
    inputFiles,
    outputFiles,
    env
  };
  if (children.length > 0) {
    node.children = children;
  }
  return node;
}

/**
 * Filter a component tree to include only nodes that match the query or have matching descendants.
 * @param {object[]} items - tree items
 * @param {string} query - lowercase search string
 * @returns {object[]} - filtered tree
 */
function filterTree(items, query) {
  const result = [];
  for (const item of items) {
    const matchesSelf = [item.name, item.type, item.script, item.host, item.description]
      .some((v)=>{ return v && v.toLowerCase().includes(query); });
    const filteredChildren = item.children ? filterTree(item.children, query) : [];
    if (matchesSelf || filteredChildren.length > 0) {
      result.push({ ...item, children: filteredChildren.length > 0 ? filteredChildren : item.children });
    }
  }
  return result;
}

/**
 * Collect ancestor chain from root to the first hpciss/hpcisstar node.
 * @param {object[]} items - tree items
 * @param {string[]} path - accumulated ancestor names
 * @returns {string[]|null} - path to uploader, or null if not found
 */
function findUploaderPath(items, path = []) {
  for (const item of items) {
    const current = [...path, item.name];
    if (item.isUploader) {
      return current;
    }
    if (item.children) {
      const found = findUploaderPath(item.children, current);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

export default {
  name: "GfarmAttributeViewer",
  components: { myTreeview },
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    xml: {
      type: String,
      default: null
    },
    filename: {
      type: String,
      default: ""
    }
  },
  emits: ["update:modelValue"],
  data() {
    return {
      searchQuery: "",
      selectedComponent: null
    };
  },
  computed: {
    treeItems() {
      if (!this.xml) {
        return [];
      }
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(this.xml, "application/xml");
        const parseError = doc.querySelector("parsererror");
        if (parseError) {
          return [];
        }
        const rootComponents = [...doc.querySelectorAll("workflow > component")];
        return rootComponents.map((el)=>{
          return parseComponentElement(el, null);
        });
      } catch {
        return [];
      }
    },
    filteredTreeItems() {
      if (!this.searchQuery) {
        return this.treeItems;
      }
      return filterTree(this.treeItems, this.searchQuery.toLowerCase());
    },
    breadcrumbItems() {
      const uploaderPath = findUploaderPath(this.treeItems);
      if (!uploaderPath) {
        return [];
      }
      const items = uploaderPath.map((name, index)=>{
        return {
          title: name,
          isUploader: index === uploaderPath.length - 1
        };
      });
      items.push({ title: this.filename, isUploader: false });
      return items;
    }
  },
  watch: {
    xml() {
      this.selectedComponent = null;
      this.searchQuery = "";
    }
  },
  methods: {

    /**
     * Handle component selection from tree.
     * @param {object|null} item - selected tree item
     */
    onSelectComponent(item) {
      this.selectedComponent = item;
    },

    /**
     * Return icon for tree nodes (non-leaf/directory type).
     * @param {boolean} isOpen - whether the node is expanded
     * @returns {string} - mdi icon name
     */
    getNodeIcon(isOpen) {
      return isOpen ? "mdi-folder-open-outline" : "mdi-folder-outline";
    },

    /**
     * Return icon for tree leaf nodes.
     * @param {object} item - tree item
     * @returns {string} - mdi icon name
     */
    getLeafIcon(item) {
      if (["hpciss", "hpcisstar"].includes(item.type)) {
        return "mdi-database-arrow-up";
      }
      if (item.type === "task") {
        return "mdi-script-text-outline";
      }
      return "mdi-cog-outline";
    },

    /**
     * Return a color for a given component type.
     * @param {string} type - component type string
     * @returns {string} - hex color or "grey"
     */
    typeColor(type) {
      return typeColorMap[type] || "grey";
    }
  }
};
</script>

<style scoped>
.uploader-highlight {
  color: #00b8a0;
  font-weight: 600;
}
</style>
