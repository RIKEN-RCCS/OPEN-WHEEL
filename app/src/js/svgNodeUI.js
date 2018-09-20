import SVG from 'svgjs/dist/svg.js';
import 'svg.draggable.js/dist/svg.draggable.js';
import '../css/workflow.css';

import config from './config';
import * as parts from './svgParts';

/**
 * svg node
 */
//export default class{
export class SvgNodeUI {
  /**
   * create new instance
   * @param svg  svg.js's instance
   * @param sio  socket.io's instance
   * @param node any node instance to draw
   */
  constructor(svg, sio, node) {
    /** svg.js's instance*/
    this.svg = svg;
    this.sio = sio;

    /** cable instance container */
    this.nextLinks = [];
    this.elseLinks = [];
    this.previousLinks = [];
    this.outputFileLinks = [];
    this.inputFileLinks = [];
    this.inputParentFileLinks = [];

    /** svg representation of this node */
    this.group = svg.group();
    this.group.data({ "ID": node.ID, "type": node.type, "name": node.name }).draggable().addClass('node');

    // draw node
    const [box, textHeight] = parts.createBox(svg, node.pos.x, node.pos.y, node.type, node.name, node.inputFiles, node.outputFiles, node.state, node.descendants, node.numTotal, node.numFinished, node.numFailed, node.host, node.useJobScheduler);
    const boxBbox = box.bbox();
    const boxX = box.x();
    const boxY = box.y();
    this.group.add(box);
    this.group.data({ "boxBbox": boxBbox });

    const upper = parts.createUpper(svg, boxX, boxY, boxBbox.width / 2, 0, node.name);
    upper.data({ "type": '.upperPlug', "ID": node.ID });
    this.group.add(upper);

    const numLower = node.type === 'if' ? 3 : 2;
    let tmp = null;
    if (numLower === 2) {
      [this.lowerPlug, tmp] = parts.createLower(svg, boxX, boxY, boxBbox.width / numLower, boxBbox.height, config.plug_color.flow, sio, node.name);
    } else {
      [this.lowerPlug, tmp] = parts.createLower(svg, boxX, boxY, boxBbox.width / numLower * 2, boxBbox.height, config.plug_color.flow, sio, node.name);
    }
    this.lowerPlug.data({ "next": node.next });
    this.group.add(this.lowerPlug).add(tmp);

    this.connectors = [];
    node.outputFiles.forEach((output, fileIndex) => {
      let [plug, cable] = parts.createConnector(svg, boxX, boxY, boxBbox.width, textHeight * fileIndex, sio, node.name);
      plug.data({ "name": output.name, "dst": output.dst });
      this.group.add(plug);
      this.group.add(cable);
      this.connectors.push(plug);
    });

    node.inputFiles.forEach((input, fileIndex) => {
      const receptor = parts.createReceptor(svg, boxX, boxY, 0, textHeight * fileIndex);
      receptor.data({ "ID": node.ID, "name": input.name });
      this.group.add(receptor);
    });

    if (numLower === 3) {
      [this.lower2Plug, tmp] = parts.createLower(svg, boxX, boxY, boxBbox.width / numLower, boxBbox.height, config.plug_color.elseFlow, sio, node.name)
      this.lower2Plug.addClass('elsePlug').data({ "else": node.else });
      this.group.add(this.lower2Plug).add(tmp);
    }

    if (node != null && node.jsonFile != null) {
      this.group.data({ "path": node.path, "jsonFile": node.jsonFile });
    }

    // difference between box origin and mouse pointer
    let diffX = 0;
    let diffY = 0;
    // mouse pointer coordinate on dragstart
    let startX = 0;
    let startY = 0;
    // register drag and drop behavior
    this.group
      .on('dragstart', (e) => {
        diffX = e.detail.p.x - e.target.instance.select('.' + `${node.name}` + '_box').first().x();
        diffY = e.detail.p.y - e.target.instance.select('.' + `${node.name}` + '_box').first().y()
        startX = e.detail.p.x;
        startY = e.detail.p.y;
      })
      .on('dragmove', (e) => {
        let dx = e.detail.p.x - startX;
        let dy = e.detail.p.y - startY;
        this.reDrawLinks(dx, dy);
      })
      .on('dragend', (e) => {
        let x = e.detail.p.x;
        let y = e.detail.p.y;
        if (x !== startX || y !== startY) {
          sio.emit('updateNode', node.ID, 'pos', { 'x': x - diffX, 'y': y - diffY });
        }
      });
  }

  /**
   * draw cables between Lower-Upper and Connector-Receptor respectively
   */
  drawLinks() {
    let boxBbox = this.group.data('boxBbox');
    let upperPlugs = this.svg.select('.upperPlug');
    let srcPlug = this.lowerPlug;
    srcPlug.data('next').forEach((dstIndex) => {
      let dstPlug = upperPlugs.members.find((plug) => {
        return plug.data('ID') === dstIndex;
      });
      const cable = new parts.SvgCable(this.svg, config.plug_color.flow, 'DU', srcPlug.cx(), srcPlug.cy(), dstPlug.cx(), dstPlug.cy());
      cable._draw(cable.startX, cable.startY, cable.endX, cable.endY, boxBbox);
      cable.cable.data('dst', dstIndex);
      this.nextLinks.push(cable);

      dstPlug.on('click', (e) => {
        this.sio.emit('removeLink', { src: this.group.data('ID'), dst: dstIndex, isElse: false });
      });
    });
    if (this.hasOwnProperty('lower2Plug')) {
      let srcPlug = this.lower2Plug;
      srcPlug.data('else').forEach((dstIndex) => {
        let dstPlug = upperPlugs.members.find((plug) => {
          return plug.data('ID') === dstIndex;
        });
        const cable = new parts.SvgCable(this.svg, config.plug_color.elseFlow, 'DU', srcPlug.cx(), srcPlug.cy(), dstPlug.cx(), dstPlug.cy());
        cable._draw(cable.startX, cable.startY, cable.endX, cable.endY, boxBbox);
        cable.cable.data('dst', dstIndex);
        this.elseLinks.push(cable);
        dstPlug.on('click', (e) => {
          this.sio.emit('removeLink', { src: this.group.data('ID'), dst: dstIndex, isElse: true });
        });
      });
    }
    let receptorPlugs = this.svg.select('.receptorPlug');

    this.connectors.forEach((srcPlug) => {
      srcPlug.data('dst').forEach((dst) => {
        let dstPlug = receptorPlugs.members.find((plug) => {
          return plug.data('ID') === dst.dstNode && plug.data('name') === dst.dstName;
        });

        const cable = new parts.SvgCable(this.svg, config.plug_color.file, 'RL', srcPlug.cx(), srcPlug.cy(), dstPlug.cx(), dstPlug.cy());
        cable._draw(cable.startX, cable.startY, cable.endX, cable.endY, boxBbox);
        cable.cable.data('dst', dst.dstNode);
        this.outputFileLinks.push(cable);

        dstPlug.on('click', (e) => {
          this.sio.emit('removeFileLink', this.group.data('ID'), srcPlug.data('name'), dst.dstNode, dst.dstName);
        });
      });
    });
  }
  /**
   * redraw cables between Lower-Upper and Connector-Receptor respectively
   * @param offsetX x coordinate difference from dragstart
   * @param offsetY y coordinate difference from dragstart
   */
  reDrawLinks(offsetX, offsetY) {
    let boxBbox = this.group.data('boxBbox');
    this.nextLinks.forEach((v) => {
      v.dragStartPoint(offsetX, offsetY, boxBbox);
    });
    this.elseLinks.forEach((v) => {
      v.dragStartPoint(offsetX, offsetY, boxBbox);
    });
    this.outputFileLinks.forEach((v) => {
      v.dragStartPoint(offsetX, offsetY, boxBbox);
    });
    this.previousLinks.forEach((v) => {
      v.dragEndPoint(offsetX, offsetY, boxBbox);
    });
    this.inputFileLinks.forEach((v) => {
      v.dragEndPoint(offsetX, offsetY, boxBbox);
    });
    this.inputParentFileLinks.forEach((v) => {
      v.dragEndPoint(offsetX, offsetY, boxBbox);
    });

  }

  /**
   * delete svg element of this node
   */
  remove() {
    this.group.remove();
    this.nextLinks.forEach((v) => {
      v.cable.remove();
    });
    this.elseLinks.forEach((v) => {
      v.cable.remove();
    });
    this.outputFileLinks.forEach((v) => {
      v.cable.remove();
    });
    this.previousLinks.forEach((v) => {
      v.cable.remove();
    });
    this.inputFileLinks.forEach((v) => {
      v.cable.remove();
    });
  }

  /**
   * register callback function to 'mousedown' event
   */
  onMousedown(callback) {
    this.group.on('mousedown', callback);
    return this;
  }

  /**
   * register callback function to 'dblclick' event
   */
  onDblclick(callback) {
    this.group.on('dblclick', callback);
    return this;
  }

  onClick(callback) {
    this.group.on('click', callback);
    return this;
  }
}

/**
 * svg parent node
 */
export class SvgParentNodeUI {
  /**
   * create new instance
   * @param svg  svg.js's instance
   * @param sio  socket.io's instance
   * @param parentnode parent inputFiles instance to draw
   */
  constructor(svg, sio, parentnode) {
    /** svg.js's instance*/
    this.svg = svg;
    this.sio = sio;

    /** cable instance container */
    this.outputFileLinks = [];
    this.inputFileLinks = [];

    /** svg representation of this node */
    this.group = svg.group();
    this.group.data({ "ID": 'parent', "type": parentnode.type }).addClass('parentnode');

    // draw input output file name
    let fileNameXpos = 0;
    let fileNameYpos = 0;
    const [box, textHeight] = parts.createFilesNameBox(svg, fileNameXpos, fileNameYpos, parentnode.type, parentnode.name, parentnode.outputFiles, parentnode.inputFiles);
    const boxBbox = box.bbox();
    const boxX = box.x();
    const boxY = box.y();
    this.group.add(box);
    this.group.data({ "boxBbox": boxBbox });

    // draw connector
    this.connectors = [];
    parentnode.inputFiles.forEach((input, fileIndex) => {
      //ファイル名の最大値程度
      let connectorXpos = 240;
      //コネクター間の幅、コネクターの高さ
      let connectorYpos = 32;
      const connectorHeight = 32;
      const connectorInterval = connectorHeight * 1.5;
      let [plug, cable] = parts.createParentConnector(svg, connectorXpos, connectorYpos, 0, connectorInterval * fileIndex, sio);
      plug.data({ "name": input.name, "forwardTo": input.forwardTo });
      // let dstArray = [];
      // if (input.srcName === null) {
      //   dstArray = [];
      // } else {
      //   dstArray = [input.srcNode, input.srcName];
      // }
      // plug.data({ "name": input.name, "dst": dstArray });
      this.group.add(plug);
      this.group.add(cable);
      this.connectors.push(plug);
    });

    // draw receptor
    parentnode.outputFiles.forEach((output, fileIndex) => {
      const recepterHeight = 32;
      const recepterInterval = recepterHeight * 1.5;
      //-425 = -(108 +32 +221)
      //     = -(ヘッダ + 初期位置補正 + 位置調整)
      let recepterPosY = window.innerHeight - 361;
      const propertyAreaWidth = 272;
      let recepterPosX = window.innerWidth - propertyAreaWidth;
      const receptor = parts.createParentReceptor(svg, recepterPosX, recepterPosY, 0, recepterInterval * fileIndex);
      receptor.data({ "ID": parentnode.ID, "name": output.name });

      this.group.add(receptor);
    });

    // difference between box origin and mouse pointer
    let diffX = 0;
    let diffY = 0;
    // mouse pointer coordinate on dragstart
    let startX = 0;
    let startY = 0;
    // register drag and drop behavior
    this.group
      .on('dragstart', (e) => {
        diffX = e.detail.p.x - e.target.instance.select('.box').first().x();
        diffY = e.detail.p.y - e.target.instance.select('.box').first().y()
        startX = e.detail.p.x;
        startY = e.detail.p.y;
      })
      .on('dragmove', (e) => {
        let dx = e.detail.p.x - startX;
        let dy = e.detail.p.y - startY;
        this.reDrawParentLinks(dx, dy)
      })
      .on('dragend', (e) => {
        let x = e.detail.p.x;
        let y = e.detail.p.y;
        if (x !== startX || y !== startY) {
          this.sio.emit('updateNode', parentnode.ID, 'pos', { 'x': x - diffX, 'y': y - diffY });
        }
      });
  }

  /**
   * draw Connector-Receptor
   */
  drawParentLinks() {
    let boxBbox = this.group.data('boxBbox');
    let receptorPlugs = this.svg.select('.receptorPlug');
    this.connectors.forEach((srcPlug) => {

      srcPlug.data('forwardTo').forEach((dst) => {

        let dstPlug = receptorPlugs.members.find((plug) => {
          return plug.data('ID') === dst.dstNode && plug.data('name') === dst.dstName;
        });
        const cable = new parts.SvgCable(this.svg, config.plug_color.file, 'RL', srcPlug.cx(), srcPlug.cy(), dstPlug.cx(), dstPlug.cy());
        cable._draw(cable.startX, cable.startY, cable.endX, cable.endY, boxBbox);
        cable.cable.data('dst', dst.dstNode);
        this.outputFileLinks.push(cable);

        dstPlug.on('click', (e) => {
          this.sio.emit('removeFileLink', this.group.data('ID'), srcPlug.data('name'), dst.dstNode, dst.dstName);
        });
      });
    });
  }
  /**
   * redraw cables between Lower-Upper and Connector-Receptor respectively
   * @param offsetX x coordinate difference from dragstart
   * @param offsetY y coordinate difference from dragstart
   */
  reDrawParentLinks(offsetX, offsetY) {
    let boxBbox = this.group.data('boxBbox');
    this.outputFileLinks.forEach((v) => {
      v.dragStartPoint(offsetX, offsetY, boxBbox);
    });
    this.inputFileLinks.forEach((v) => {
      v.dragEndPoint(offsetX, offsetY, boxBbox);
    });
  }

  /**
 * delete svg element of this node
 */
  remove() {
    this.group.remove();
    this.outputFileLinks.forEach((v) => {
      v.cable.remove();
    });
    this.inputFileLinks.forEach((v) => {
      v.cable.remove();
    });
  }
  /**
 * register callback function to 'mousedown' event
 */
  onMousedown(callback) {
    this.group.on('mousedown', callback);
    return this;
  }

}
