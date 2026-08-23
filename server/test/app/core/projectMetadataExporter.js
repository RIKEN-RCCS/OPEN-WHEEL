/*
 * Copyright (c) Center for Computational Science, RIKEN All rights reserved.
 * Copyright (c) Research Institute for Information Technology(RIIT), Kyushu University. All rights reserved.
 * See License in the project root for the license information.
 */

import { expect } from "chai";
import sinon from "sinon";
import { XMLParser } from "fast-xml-parser";
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
  let getComponentDirStub;
  let pathExistsStub;
  let readFileStub;
  let warnStub;

  beforeEach(()=>{
    getAllComponentIDsStub = sinon.stub(_internal, "getAllComponentIDs");
    readComponentJsonByIDStub = sinon.stub(_internal, "readComponentJsonByID");
    //safe no-op defaults so tests that don't care about script content never
    //touch the real filesystem/logger; individual tests override as needed
    getComponentDirStub = sinon.stub(_internal, "getComponentDir").resolves(null);
    pathExistsStub = sinon.stub(_internal.fs, "pathExists").resolves(false);
    readFileStub = sinon.stub(_internal.fs, "readFile").resolves("");
    warnStub = sinon.stub();
    sinon.stub(_internal, "getLogger").returns({ warn: warnStub });
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

  it("should embed a task's script content when the script file exists", async ()=>{
    const task = makeComponent("task-1", "task", "t", "this is root", { script: "run.sh" });
    getAllComponentIDsStub.resolves(["task-1"]);
    readComponentJsonByIDStub.withArgs(PROJECT_ROOT, "task-1").resolves(task);
    getComponentDirStub.withArgs(PROJECT_ROOT, "task-1", true).resolves("/dummy/project/task-1");
    pathExistsStub.withArgs("/dummy/project/task-1/run.sh").resolves(true);
    readFileStub.withArgs("/dummy/project/task-1/run.sh", "utf8").resolves("#!/bin/bash\necho hello\n");

    const result = await gatherComponentMetadata(PROJECT_ROOT);

    expect(result.components[0].scriptContent).to.equal("#!/bin/bash\necho hello\n");
  });

  it("should not embed script content when the script file does not exist", async ()=>{
    const task = makeComponent("task-1", "task", "t", "this is root", { script: "missing.sh" });
    getAllComponentIDsStub.resolves(["task-1"]);
    readComponentJsonByIDStub.withArgs(PROJECT_ROOT, "task-1").resolves(task);
    getComponentDirStub.withArgs(PROJECT_ROOT, "task-1", true).resolves("/dummy/project/task-1");
    pathExistsStub.withArgs("/dummy/project/task-1/missing.sh").resolves(false);

    const result = await gatherComponentMetadata(PROJECT_ROOT);

    expect(result.components[0].scriptContent).to.be.undefined;
    expect(readFileStub.called).to.be.false;
  });

  it("should embed an if component's condition script content when it resolves to a file", async ()=>{
    const ifComp = makeComponent("if-1", "if", "cond", "this is root", { condition: "check.sh" });
    getAllComponentIDsStub.resolves(["if-1"]);
    readComponentJsonByIDStub.withArgs(PROJECT_ROOT, "if-1").resolves(ifComp);
    getComponentDirStub.withArgs(PROJECT_ROOT, "if-1", true).resolves("/dummy/project/if-1");
    pathExistsStub.withArgs("/dummy/project/if-1/check.sh").resolves(true);
    readFileStub.withArgs("/dummy/project/if-1/check.sh", "utf8").resolves("exit 0\n");

    const result = await gatherComponentMetadata(PROJECT_ROOT);

    expect(result.components[0].scriptContent).to.equal("exit 0\n");
  });

  it("should not treat a while component's raw JS expression condition as a file", async ()=>{
    const whileComp = makeComponent("while-1", "while", "loop", "this is root", { condition: "i < 10" });
    getAllComponentIDsStub.resolves(["while-1"]);
    readComponentJsonByIDStub.withArgs(PROJECT_ROOT, "while-1").resolves(whileComp);
    getComponentDirStub.withArgs(PROJECT_ROOT, "while-1", true).resolves("/dummy/project/while-1");
    //pathExists defaults to false in beforeEach - a raw JS expression never resolves to a real file

    const result = await gatherComponentMetadata(PROJECT_ROOT);

    expect(result.components[0].scriptContent).to.be.undefined;
    expect(result.components[0].condition).to.equal("i < 10");
    expect(readFileStub.called).to.be.false;
  });

  it("should not attempt script content for component types other than task/if/while", async ()=>{
    const wf = makeComponent("wf-1", "workflow", "root", "this is root", { script: "run.sh" });
    getAllComponentIDsStub.resolves(["wf-1"]);
    readComponentJsonByIDStub.withArgs(PROJECT_ROOT, "wf-1").resolves(wf);

    const result = await gatherComponentMetadata(PROJECT_ROOT);

    expect(result.components[0].scriptContent).to.be.undefined;
    expect(getComponentDirStub.called).to.be.false;
  });

  it("should not throw and should skip script content when getComponentDir rejects", async ()=>{
    const task = makeComponent("task-1", "task", "t", "this is root", { script: "run.sh" });
    getAllComponentIDsStub.resolves(["task-1"]);
    readComponentJsonByIDStub.withArgs(PROJECT_ROOT, "task-1").resolves(task);
    getComponentDirStub.withArgs(PROJECT_ROOT, "task-1", true).rejects(new Error("ENOENT"));

    const result = await gatherComponentMetadata(PROJECT_ROOT);

    expect(result.components[0].scriptContent).to.be.undefined;
    expect(warnStub.calledOnce).to.be.true;
  });

  it("should not throw and should skip script content when readFile rejects", async ()=>{
    const task = makeComponent("task-1", "task", "t", "this is root", { script: "run.sh" });
    getAllComponentIDsStub.resolves(["task-1"]);
    readComponentJsonByIDStub.withArgs(PROJECT_ROOT, "task-1").resolves(task);
    getComponentDirStub.withArgs(PROJECT_ROOT, "task-1", true).resolves("/dummy/project/task-1");
    pathExistsStub.withArgs("/dummy/project/task-1/run.sh").resolves(true);
    readFileStub.withArgs("/dummy/project/task-1/run.sh", "utf8").rejects(new Error("EACCES"));

    const result = await gatherComponentMetadata(PROJECT_ROOT);

    expect(result.components[0].scriptContent).to.be.undefined;
    expect(warnStub.calledOnce).to.be.true;
  });
});

describe("#componentMetadataToXml", ()=>{
  it("should produce XML with declaration and workflow root element", async ()=>{
    const metadata = { components: [] };
    const xml = await componentMetadataToXml(metadata);
    expect(xml).to.include("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
    expect(xml).to.include("<workflow>");
    expect(xml).to.include("</workflow>");
  });

  it("should render component element with type, name, and id attributes", async ()=>{
    const metadata = {
      components: [makeComponent("id-1", "task", "myTask", "this is root")]
    };
    const xml = await componentMetadataToXml(metadata);
    expect(xml).to.include("<component type=\"task\" name=\"myTask\" id=\"id-1\">");
    expect(xml).to.include("</component>");
  });

  it("should escape XML special characters in attribute and element values", async ()=>{
    const metadata = {
      components: [makeComponent("id-1", "task", "a&b<c>d", "this is root", { description: "\"quoted' & <escaped>" })]
    };
    const xml = await componentMetadataToXml(metadata);
    expect(xml).to.include("name=\"a&amp;b&lt;c&gt;d\"");
    expect(xml).to.include("&quot;quoted&apos; &amp; &lt;escaped&gt;");
  });

  //there is no allowlist any more - every property present on a component is
  //exported, including ones that used to be silently dropped: previous/next
  //(execution-order graph edges), if's "else" (false-branch target), pos/parent
  //(previously deemed "internal"), and dispatcher/executer runtime fields like
  //jobID/rt/dispatchedTime.
  it("should render previous/next/else/pos/parent and dispatcher/executer runtime fields", async ()=>{
    const metadata = {
      components: [makeComponent("id-1", "if", "branch", "root-1", {
        previous: ["a", "b"],
        next: ["c"],
        else: ["d"],
        pos: { x: 10, y: 20 },
        jobID: "12345",
        rt: 0,
        dispatchedTime: "2026-01-01T00:00:00Z"
      })]
    };
    const xml = await componentMetadataToXml(metadata);
    expect(xml).to.include("<parent>root-1</parent>");
    expect(xml).to.include("<previous>a</previous>");
    expect(xml).to.include("<previous>b</previous>");
    expect(xml).to.include("<next>c</next>");
    expect(xml).to.include("<else>d</else>");
    expect(xml).to.include("<x>10</x>");
    expect(xml).to.include("<y>20</y>");
    expect(xml).to.include("<jobID>12345</jobID>");
    expect(xml).to.include("<rt>0</rt>");
    expect(xml).to.include("<dispatchedTime>2026-01-01T00:00:00Z</dispatchedTime>");
  });

  //arrays are no longer wrapped in a singular/plural container - each item
  //becomes a sibling element using the property's own name, generically, with
  //no per-field special-casing
  it("should render an array property as repeated sibling elements, generically, with no wrapper", async ()=>{
    const metadata = {
      components: [makeComponent("id-1", "task", "t", "this is root", {
        inputFiles: [
          { name: "required.dat", mandatory: true },
          { name: "optional.dat", mandatory: false }
        ]
      })]
    };
    const xml = await componentMetadataToXml(metadata);
    expect(xml).to.not.include("<inputFile ");
    expect(xml).to.include("<inputFiles>\n      <name>required.dat</name>\n      <mandatory>true</mandatory>\n    </inputFiles>");
    expect(xml).to.include("<inputFiles>\n      <name>optional.dat</name>\n      <mandatory>false</mandatory>\n    </inputFiles>");
  });

  it("should render outputFiles the same generic way", async ()=>{
    const metadata = {
      components: [makeComponent("id-1", "task", "t", "this is root", {
        outputFiles: [{ name: "result.dat" }]
      })]
    };
    const xml = await componentMetadataToXml(metadata);
    expect(xml).to.include("<outputFiles>\n      <name>result.dat</name>\n    </outputFiles>");
  });

  //nested sub-objects (inputFile.src, outputFile.dst) are no longer
  //special-cased attribute-bearing elements - they fall out of the same
  //generic object-nesting as everything else
  it("should render nested sub-objects (e.g. inputFile.src) as nested elements", async ()=>{
    const metadata = {
      components: [makeComponent("id-1", "task", "t", "this is root", {
        inputFiles: [{ name: "in.dat", mandatory: false, src: [{ srcNode: "node-A", srcName: "out.dat" }] }]
      })]
    };
    const xml = await componentMetadataToXml(metadata);
    expect(xml).to.include("<src>\n        <srcNode>node-A</srcNode>\n        <srcName>out.dat</srcName>\n      </src>");
  });

  //env's shape changed from <variable name="X">value</variable> to one
  //element per key, consistent with how every other object now serializes
  it("should render env as one element per variable, not <variable name=...>", async ()=>{
    const metadata = {
      components: [makeComponent("id-1", "task", "t", "this is root", {
        env: { MY_VAR: "hello", OTHER: "world" }
      })]
    };
    const xml = await componentMetadataToXml(metadata);
    expect(xml).to.not.include("<variable");
    expect(xml).to.include("<MY_VAR>hello</MY_VAR>");
    expect(xml).to.include("<OTHER>world</OTHER>");
  });

  it("should nest child components inside <children><component> elements", async ()=>{
    const child = makeComponent("child-1", "task", "childTask", "parent-1");
    const parent = makeComponent("parent-1", "workflow", "parentWf", "this is root", {
      children: [child]
    });
    const metadata = { components: [parent] };
    const xml = await componentMetadataToXml(metadata);
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

  it("should render script field when present", async ()=>{
    const metadata = {
      components: [makeComponent("id-1", "task", "t", "this is root", { script: "run.sh" })]
    };
    const xml = await componentMetadataToXml(metadata);
    expect(xml).to.include("<script>run.sh</script>");
  });

  it("should not render null or undefined fields", async ()=>{
    const metadata = {
      components: [makeComponent("id-1", "task", "t", "this is root", { script: null, checker: undefined })]
    };
    const xml = await componentMetadataToXml(metadata);
    expect(xml).to.not.include("<script>");
    expect(xml).to.not.include("<checker>");
  });

  it("should render memo field when present on an hpciss component", async ()=>{
    const metadata = {
      components: [makeComponent("id-1", "hpciss", "t", "this is root", { memo: "some free text" })]
    };
    const xml = await componentMetadataToXml(metadata);
    expect(xml).to.include("<memo>some free text</memo>");
  });

  it("should not render memo field when null", async ()=>{
    const metadata = {
      components: [makeComponent("id-1", "hpciss", "t", "this is root", { memo: null })]
    };
    const xml = await componentMetadataToXml(metadata);
    expect(xml).to.not.include("<memo>");
  });

  it("should render condition field for if/while components", async ()=>{
    const metadata = {
      components: [makeComponent("id-1", "while", "loop", "this is root", { condition: "i < 10" })]
    };
    const xml = await componentMetadataToXml(metadata);
    expect(xml).to.include("<condition>i &lt; 10</condition>");
  });

  //the CDATA special-case now generalizes to any string containing a newline,
  //not just scriptContent
  it("should wrap any multiline string value in a CDATA section, not just scriptContent", async ()=>{
    const metadata = {
      components: [makeComponent("id-1", "task", "t", "this is root", {
        script: "run.sh",
        scriptContent: "#!/bin/bash\necho \"hi\" && exit 0\n",
        description: "line1\nline2"
      })]
    };
    const xml = await componentMetadataToXml(metadata);
    const parsed = new XMLParser().parse(xml);
    expect(parsed.workflow.component.scriptContent).to.equal("#!/bin/bash\necho \"hi\" && exit 0\n");
    expect(parsed.workflow.component.description).to.equal("line1\nline2");
    expect(xml).to.include("<![CDATA[");
  });

  //unlike the old hand-rolled fallback-to-escaping, the CDATA terminator is
  //now handled by splitting across adjacent CDATA sections, so the content
  //stays inside proper CDATA (round-trippable) instead of losing that treatment
  it("should split, not escape-fallback, when scriptContent contains the CDATA terminator", async ()=>{
    const metadata = {
      components: [makeComponent("id-1", "task", "t", "this is root", {
        script: "run.sh",
        scriptContent: "echo ]]> weird\nsecond line"
      })]
    };
    const xml = await componentMetadataToXml(metadata);
    const parsed = new XMLParser().parse(xml);
    expect(parsed.workflow.component.scriptContent).to.equal("echo ]]> weird\nsecond line");
  });

  it("should not render scriptContent element when absent", async ()=>{
    const metadata = {
      components: [makeComponent("id-1", "task", "t", "this is root", { script: "run.sh" })]
    };
    const xml = await componentMetadataToXml(metadata);
    expect(xml).to.not.include("<scriptContent>");
  });

  it("should sanitize a property key that isn't a valid XML element name instead of silently dropping it", async ()=>{
    const metadata = {
      components: [makeComponent("id-1", "task", "t", "this is root", { "weird key!": "value" })]
    };
    const xml = await componentMetadataToXml(metadata);
    expect(xml).to.include("<weird_key_>value</weird_key_>");
  });
});
