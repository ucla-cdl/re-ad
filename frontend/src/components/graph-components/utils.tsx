import { getSimpleBezierPath, useNodes, useReactFlow, Position } from '@xyflow/react';
import { usePaperContext } from '../../contexts/PaperContext';
 
// this helper function returns the intersection point
// of the line between the center of the intersectionNode and the target node
function getNodeIntersection(intersectionNode: any, targetNode: any) {
  // https://math.stackexchange.com/questions/1724792/an-algorithm-for-finding-the-intersection-point-between-a-center-of-vision-and-a
  const { width: intersectionNodeWidth, height: intersectionNodeHeight } =
    intersectionNode.measured;
  const intersectionNodePosition = intersectionNode.internals.positionAbsolute;
  const targetPosition = targetNode.internals.positionAbsolute;
 
  const w = intersectionNodeWidth / 2;
  const h = intersectionNodeHeight / 2;
 
  const x2 = intersectionNodePosition.x + w;
  const y2 = intersectionNodePosition.y + h;
  const x1 = targetPosition.x + targetNode.measured.width / 2;
  const y1 = targetPosition.y + targetNode.measured.height / 2;
 
  const xx1 = (x1 - x2) / (2 * w) - (y1 - y2) / (2 * h);
  const yy1 = (x1 - x2) / (2 * w) + (y1 - y2) / (2 * h);
  const a = 1 / (Math.abs(xx1) + Math.abs(yy1));
  const xx3 = a * xx1;
  const yy3 = a * yy1;
  const x = w * (xx3 + yy3) + x2;
  const y = h * (-xx3 + yy3) + y2;
 
  return { x, y };
}
 
// returns the position (top,right,bottom or right) passed node compared to the intersection point
function getEdgePosition(node: any, intersectionPoint: any) {
  const n = { ...node.internals.positionAbsolute, ...node };
  const nx = Math.round(n.x);
  const ny = Math.round(n.y);
  const px = Math.round(intersectionPoint.x);
  const py = Math.round(intersectionPoint.y);
 
  if (px <= nx + 1) {
    return Position.Left;
  }
  if (px >= nx + n.measured.width - 1) {
    return Position.Right;
  }
  if (py <= ny + 1) {
    return Position.Top;
  }
  if (py >= n.y + n.measured.height - 1) {
    return Position.Bottom;
  }
 
  return Position.Top;
}
 
// returns the parameters (sx, sy, tx, ty, sourcePos, targetPos) you need to create an edge
export function getEdgeParams(source: any, target: any) {
  const sourceIntersectionPoint = getNodeIntersection(source, target);
  const targetIntersectionPoint = getNodeIntersection(target, source);
 
  const sourcePos = getEdgePosition(source, sourceIntersectionPoint);
  const targetPos = getEdgePosition(target, targetIntersectionPoint);
 
  return {
    sx: sourceIntersectionPoint.x,
    sy: sourceIntersectionPoint.y,
    tx: targetIntersectionPoint.x,
    ty: targetIntersectionPoint.y,
    sourcePos,
    targetPos,
  };
}

 
export function ConnectionLineComponent({ toX, toY }: { toX: number, toY: number }) {
  const { getInternalNode } = useReactFlow();
  const { selectedHighlightIds } = usePaperContext();

  const nodes = useNodes();
  const selectedNodes = nodes.filter((node) => selectedHighlightIds.includes(node.id));
 
  const handleBounds = selectedNodes.flatMap((userNode) => {
    const node = getInternalNode(userNode.id);
 
    // we only want to draw a connection line from a source handle
    if (!node?.internals?.handleBounds?.source) {
      return [];
    }
 
    return node.internals.handleBounds.source?.map((bounds) => ({
      id: node.id,
      positionAbsolute: node.internals.positionAbsolute,
      bounds,
    }));
  });
 
  return handleBounds.map(({ id, positionAbsolute, bounds }) => {
    const fromHandleX = bounds.x + bounds.width / 2;
    const fromHandleY = bounds.y + bounds.height / 2;
    const fromX = positionAbsolute.x + fromHandleX;
    const fromY = positionAbsolute.y + fromHandleY;
    const [d] = getSimpleBezierPath({
      sourceX: fromX,
      sourceY: fromY,
      targetX: toX,
      targetY: toY,
    });
 
    return (
      <g key={`${id}-${bounds.id}`}>
        <path fill="none" strokeWidth={1} stroke="#b1b1b7" d={d} />
        {/* <circle
          cx={toX}
          cy={toY}
          fill="#fff"
          r={3}
          stroke="black"
          strokeWidth={1.5}
        /> */}
      </g>
    );
  });
};
