/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */

import { expect } from "chai";
import sinon from "sinon";
import { gatherComponentMetadata, componentMetadataToXml, _internal } from "../../../app/core/projectMetadataExporter.js";

const PROJECT_ROOT = "/dummy/project";

/**
 * Build a minimal component object for testing.
 * @param {string} id - component ID
 * @param {string} type - component type
 * @param {string} name - component name
 * @param {string} parent - parent component ID
 * @param {object} extras - additional fields
 * @returns {object} - component JSON
 */
function makeComponent(id, type, name, parent, extras = {}) {
  return { ID: id, type, name, parent, env: {}, inputFiles: [], outputFiles: [], ...extras };
}

describe("#gatherComponentMetadata", ()=>{
  let getAllComponentIDsStub;
  let readComponentJsonByIDStub;

  beforeEach(()=>{
    getAllComponentIDsStub = sinon.stub(_internal, "getAllComponentIDs");
    readComponentJsonByIDStub = sinon.stub(_internal, "readComponentJsonByID");
  });

  afterEach(()=>{
    sinon.restore();
  });

  it("should return empty components array when project has no components", async ()=>{
    getAllComponentIDsStub.resolves([]);

    const result = await gatherComponentMetadata(PROJECT_ROOT);

    expect(result).to.deep.equal({ components: [] });
    expect(getAllComponentIDsStub.calledOnceWithExactly(PROJECT_ROOT)).to.be.true;
  });

  it("should build a flat list for single root component with no children", async ()=>{
    const wf = makeComponent("wf-1", "workflow", "root", "this is root");
    getAllComponentIDsStub.resolves(["wf-1"]);
    readComponentJsonByIDStub.withArgs(PROJECT_ROOT, "wf-1").resolves(wf);

    const result = await gatherComponentMetadata(PROJECT_ROOT);

    expect(result.components).to.have.length(1);
    expect(result.components[0].ID).to.equal("wf-1");
    expect(result.components[0].type).to.equal("workflow");
    expect(result.components[0].children).to.be.undefined;
  });

  it("should nest child components under their parent", async ()=>{
    const wf = makeComponent("wf-1", "workflow", "root", "this is root");
    const task = makeComponent("task-1", "task", "myTask", "wf-1", { script: "run.sh" });
    getAllComponentIDsStub.resolves(["wf-1", "task-1"]);
    readComponentJsonByIDStub.withArgs(PROJECT_ROOT, "wf-1").resolves(wf);
    readComponentJsonByIDStub.withArgs(PROJECT_ROOT, "task-1").resolves(task);

    const result = await gatherComponentMetadata(PROJECT_ROOT);

    expect(result.components).to.have.length(1);
    const rootNode = result.components[0];
    expect(rootNode.ID).to.equal("wf-1");
    expect(rootNode.children).to.have.length(1);
    expect(rootNode.children[0].ID).to.equal("task-1");
    expect(rootNode.children[0].script).to.equal("run.sh");
    expect(rootNode.children[0].children).to.be.undefined;
  });

  it("should support multi-level nesting", async ()=>{
    const wf = makeComponent("wf-1", "workflow", "root", "this is root");
    const subwf = makeComponent("wf-2", "workflow", "sub", "wf-1");
    const task = makeComponent("task-1", "task", "leaf", "wf-2");
    getAllComponentIDsStub.resolves(["wf-1", "wf-2", "task-1"]);
    readComponentJsonByIDStub.withArgs(PROJECT_ROOT, "wf-1").resolves(wf);
    readComponentJsonByIDStub.withArgs(PROJECT_ROOT, "wf-2").resolves(subwf);
    readComponentJsonByIDStub.withArgs(PROJECT_ROOT, "task-1").resolves(task);

    const result = await gatherComponentMetadata(PROJECT_ROOT);

    expect(result.components).to.have.length(1);
    const level1 = result.components[0];
    expect(level1.children).to.have.length(1);
    const level2 = level1.children[0];
    expect(level2.ID).to.equal("wf-2");
    expect(level2.children).to.have.length(1);
    expect(level2.children[0].ID).to.equal("task-1");
  });

  it("should include all inputFile fields including mandatory", async ()=>{
    const wf = makeComponent("wf-1", "workflow", "root", "this is root", {
      inputFiles: [{ name: "input.dat", mandatory: true, src: [] }]
    });
    getAllComponentIDsStub.resolves(["wf-1"]);
    readComponentJsonByIDStub.resolves(wf);

    const result = await gatherComponentMetadata(PROJECT_ROOT);

    const inputFile = result.components[0].inputFiles[0];
    expect(inputFile.name).to.equal("input.dat");
    expect(inputFile.mandatory).to.be.true;
  });
});

describe("#componentMetadataToXml", ()=>{
  it("should produce XML with declaration and workflow root element", ()=>{
    const metadata = { components: [] };
    const xml = componentMetadataToXml(metadata);
    expect(xml).to.include("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
    expect(xml).to.include("<workflow>");
    expect(xml).to.include("</workflow>");
  });

  it("should render component element with type, name, and id attributes", ()=>{
    const metadata = {
      components: [makeComponent("id-1", "task", "myTask", "this is root")]
    };
    const xml = componentMetadataToXml(metadata);
    expect(xml).to.include("<component type=\"task\" name=\"myTask\" id=\"id-1\">");
    expect(xml).to.include("</component>");
  });

  it("should escape XML special characters in field values", ()=>{
    const metadata = {
      components: [makeComponent("id-1", "task", "a&b<c>d", "this is root", { description: "\"quoted' & <escaped>" })]
    };
    const xml = componentMetadataToXml(metadata);
    expect(xml).to.include("name=\"a&amp;b&lt;c&gt;d\"");
    expect(xml).to.include("&quot;quoted&apos; &amp; &lt;escaped&gt;");
  });

  it("should render inputFiles with mandatory attribute", ()=>{
    const metadata = {
      components: [makeComponent("id-1", "task", "t", "this is root", {
        inputFiles: [
          { name: "required.dat", mandatory: true, src: [] },
          { name: "optional.dat", mandatory: false, src: [] }
        ]
      })]
    };
    const xml = componentMetadataToXml(metadata);
    expect(xml).to.include("<inputFile name=\"required.dat\" mandatory=\"true\"");
    expect(xml).to.include("<inputFile name=\"optional.dat\" mandatory=\"false\"");
  });

  it("should render outputFiles element", ()=>{
    const metadata = {
      components: [makeComponent("id-1", "task", "t", "this is root", {
        outputFiles: [{ name: "result.dat", dst: [] }]
      })]
    };
    const xml = componentMetadataToXml(metadata);
    expect(xml).to.include("<outputFile name=\"result.dat\"");
  });

  it("should render env variables", ()=>{
    const metadata = {
      components: [makeComponent("id-1", "task", "t", "this is root", {
        env: { MY_VAR: "hello", OTHER: "world" }
      })]
    };
    const xml = componentMetadataToXml(metadata);
    expect(xml).to.include("<variable name=\"MY_VAR\">hello</variable>");
    expect(xml).to.include("<variable name=\"OTHER\">world</variable>");
  });

  it("should nest child components inside <children> element", ()=>{
    const child = makeComponent("child-1", "task", "childTask", "parent-1");
    const parent = makeComponent("parent-1", "workflow", "parentWf", "this is root", {
      children: [child]
    });
    const metadata = { components: [parent] };
    const xml = componentMetadataToXml(metadata);
    expect(xml).to.include("<children>");
    expect(xml).to.include("</children>");
    expect(xml).to.include("name=\"childTask\"");
    //child should appear inside parent
    const childrenStart = xml.indexOf("<children>");
    const childrenEnd = xml.indexOf("</children>");
    const childStart = xml.indexOf("name=\"childTask\"");
    expect(childStart).to.be.greaterThan(childrenStart);
    expect(childStart).to.be.lessThan(childrenEnd);
  });

  it("should render src elements inside inputFile when src is non-empty", ()=>{
    const metadata = {
      components: [makeComponent("id-1", "task", "t", "this is root", {
        inputFiles: [{ name: "in.dat", mandatory: false, src: [{ srcNode: "node-A", srcName: "out.dat" }] }]
      })]
    };
    const xml = componentMetadataToXml(metadata);
    expect(xml).to.include("<src srcNode=\"node-A\" srcName=\"out.dat\"");
  });

  it("should render script field when present", ()=>{
    const metadata = {
      components: [makeComponent("id-1", "task", "t", "this is root", { script: "run.sh" })]
    };
    const xml = componentMetadataToXml(metadata);
    expect(xml).to.include("<script>run.sh</script>");
  });

  it("should not render null or undefined scalar fields", ()=>{
    const metadata = {
      components: [makeComponent("id-1", "task", "t", "this is root", { script: null, checker: undefined })]
    };
    const xml = componentMetadataToXml(metadata);
    expect(xml).to.not.include("<script>");
    expect(xml).to.not.include("<checker>");
  });
});
