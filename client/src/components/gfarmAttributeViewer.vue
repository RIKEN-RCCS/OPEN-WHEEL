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

            <!-- Component detail card: every property present on the component is
                 shown here generically (no fixed field list) - nested
                 objects/arrays are expanded with indentation so arbitrarily-shaped
                 data (including future properties) is always visible. -->
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
                  <v-table
                    v-if="selectedComponentRows.length > 0"
                    density="compact"
                    data-cy="gfarm_attribute_viewer-props-table"
                  >
                    <tbody>
                      <tr
                        v-for="(row, index) in selectedComponentRows"
                        :key="index"
                      >
                        <td
                          class="text-caption font-weight-bold"
                          :style="{ paddingLeft: `${row.depth * 16 + 8}px` }"
                        >
                          {{ row.key }}
                        </td>
                        <td>
                          <code v-if="row.isLeaf">{{ row.value }}</code>
                        </td>
                      </tr>
                    </tbody>
                  </v-table>
                  <v-alert
                    v-else
                    type="info"
                    density="compact"
                    text="This component has no additional properties."
                  />
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
 * Group an element's direct children by tag name, preserving document order.
 * @param {Element} el - XML element
 * @returns {Map<string, Element[]>} - tag name -> elements with that tag
 */
function groupChildrenByTag(el) {
  const byTag = new Map();
  for (const child of el.children) {
    if (!byTag.has(child.tagName)) {
      byTag.set(child.tagName, []);
    }
    byTag.get(child.tagName).push(child);
  }
  return byTag;
}

/**
 * Parse a single XML element's value generically, with no fixed field list:
 * an element with its own child elements becomes a nested object
 * (recursively); an element with only text content becomes that text. A tag
 * that occurs multiple times among its siblings becomes an array - this
 * mirrors the server's export convention (arrays are repeated same-named
 * sibling elements, not wrapped in a container).
 * @param {Element} el - XML element
 * @returns {object|string} - nested object, or text content
 */
function parseElementValue(el) {
  if (el.children.length === 0) {
    return el.textContent;
  }
  const obj = {};
  for (const [tag, elements] of groupChildrenByTag(el)) {
    obj[tag] = elements.length > 1
      ? elements.map((e)=>{ return parseElementValue(e); })
      : parseElementValue(elements[0]);
  }
  return obj;
}

/**
 * Parse a <component> XML element into a plain JS object for the tree: type/
 * name/id come from attributes, "children" is handled specially since it
 * represents workflow nesting rather than a literal component property, and
 * every other child element becomes a generic entry in `props` - scalar,
 * nested object, or array - with no allowlist of known field names.
 * @param {Element} el - XML component element
 * @returns {object} - { id, name, type, isUploader, props, children? }
 */
function parseComponentElement(el) {
  const id = el.getAttribute("id");
  const type = el.getAttribute("type");
  const name = el.getAttribute("name");
  const isUploader = ["hpciss", "hpcisstar"].includes(type);

  const props = {};
  let children = [];
  for (const [tag, elements] of groupChildrenByTag(el)) {
    if (tag === "children") {
      children = [...elements[0].querySelectorAll(":scope > component")].map((c)=>{
        return parseComponentElement(c);
      });
      continue;
    }
    props[tag] = elements.length > 1
      ? elements.map((e)=>{ return parseElementValue(e); })
      : parseElementValue(elements[0]);
  }

  const node = { id, name, type, isUploader, props };
  if (children.length > 0) {
    node.children = children;
  }
  return node;
}

/**
 * Flatten a component's generic props object into a display-ready, indented
 * row list, so the template can render an arbitrarily-shaped property tree
 * (any nesting of objects/arrays) without needing Vue template recursion.
 * @param {object} props - tag name -> string|object|array
 * @param {number} depth - current nesting depth, for indentation
 * @returns {{key: string, value: (string|null), depth: number, isLeaf: boolean}[]} - flattened rows
 */
function flattenProps(props, depth = 0) {
  const rows = [];
  for (const [key, value] of Object.entries(props)) {
    if (Array.isArray(value)) {
      const allScalar = value.every((v)=>{
        return typeof v === "string";
      });
      if (allScalar) {
        rows.push({ key, value: value.join(", "), depth, isLeaf: true });
      } else {
        value.forEach((item, index)=>{
          rows.push({ key: `${key} [${index}]`, value: null, depth, isLeaf: false });
          rows.push(...flattenProps(typeof item === "string" ? { value: item } : item, depth + 1));
        });
      }
    } else if (value && typeof value === "object") {
      rows.push({ key, value: null, depth, isLeaf: false });
      rows.push(...flattenProps(value, depth + 1));
    } else {
      rows.push({ key, value, depth, isLeaf: true });
    }
  }
  return rows;
}

/**
 * Collect every string value reachable from a component's props (recursing
 * through nested objects/arrays), for full-text search - so search still
 * covers arbitrary/future properties, not just a fixed short list of fields.
 * @param {object} props - tag name -> string|object|array
 * @returns {string[]} - all leaf string values found
 */
function collectSearchableStrings(props) {
  const out = [];
  for (const value of Object.values(props)) {
    if (typeof value === "string") {
      out.push(value);
    } else if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string") {
          out.push(item);
        } else if (item && typeof item === "object") {
          out.push(...collectSearchableStrings(item));
        }
      }
    } else if (value && typeof value === "object") {
      out.push(...collectSearchableStrings(value));
    }
  }
  return out;
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
    const searchable = [item.name, item.type, ...collectSearchableStrings(item.props)];
    const matchesSelf = searchable
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
          return parseComponentElement(el);
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
    selectedComponentRows() {
      if (!this.selectedComponent) {
        return [];
      }
      return flattenProps(this.selectedComponent.props);
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
