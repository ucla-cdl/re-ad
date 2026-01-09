import { EdgeProps, BaseEdge, EdgeLabelRenderer, getBezierPath } from "@xyflow/react";

export default function ChronologicalEdge({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    markerEnd,
}: EdgeProps) {
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    return (
        <>
            <BaseEdge path={edgePath} markerEnd={markerEnd} style={{ stroke: 'black', strokeWidth: 1, strokeDasharray: '5,5' }} />
            <EdgeLabelRenderer>
                <div
                    className="nodrag nopan"
                    style={{
                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                    }}
                >
                </div>
            </EdgeLabelRenderer>
        </>
    );
}
