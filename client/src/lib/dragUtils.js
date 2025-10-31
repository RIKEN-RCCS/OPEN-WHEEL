'use strict';

function getSVGPoint(e, element) {
  const svg = element.closest('svg');
  if (!svg) return null;
  const CTM = svg.getScreenCTM();
  if (!CTM) return null;
  const inverseCTM = CTM.inverse();
  const svgPoint = svg.createSVGPoint();
  svgPoint.x = e.clientX;
  svgPoint.y = e.clientY;
  return svgPoint.matrixTransform(inverseCTM);
}

export function startDrag(e, center) {
  const startPoint = getSVGPoint(e, e.currentTarget);
  if (!startPoint) return null;

  return {
    startX: startPoint.x,
    startY: startPoint.y,
    startScreenX: e.screenX,
    startScreenY: e.screenY,
    oldCenter: { ...center },
    isDragging: true
  };
}

export function calcDrag(e, dragData) {
  if (!dragData || !dragData.isDragging) return null;
  const point = getSVGPoint(e, e.currentTarget);
  if (!point) return null;

  const dx = point.x - dragData.startX;
  const dy = point.y - dragData.startY;
  return {
    newX: dragData.oldCenter.x + dx,
    newY: dragData.oldCenter.y + dy
  };
}
