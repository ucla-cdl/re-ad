import { Box, Typography } from "@mui/material";
import { Position, Handle, NodeProps, Node, useConnection } from "@xyflow/react";
import { usePaperContext } from "../../contexts/PaperContext";
import "../../styles/GraphNode.css";

export default function PurposeNode({ data }: NodeProps<Node>) {
  const { id, readPurposeId, label } = data as {
    id: string;
    readPurposeId: string;
    label: string;
  };
  const { readPurposes, displayedReads, selectedHighlightIds } = usePaperContext();
  const { color } = readPurposes[readPurposeId] || { color: "#e6e6e6" };
  const isDisplayed = displayedReads.includes(readPurposeId);

  const connection = useConnection();
  const isSelected = selectedHighlightIds.includes(id);
  const isTarget = connection.inProgress && !isSelected && connection.toNode?.id === id;

  return (
    <Box
      className={`graph-node purpose-node ${isSelected ? "selected" : ""} ${isTarget ? "target" : ""}`}
      id={`node-${id}`}
      sx={{ backgroundColor: isDisplayed ? `${color}` : "#e6e6e6" }}
    >
      <Box sx={{ width: "100%", m: 1, mb: 2 }}>
        <Handle
          className="connection-handle"
          id={`relational-handle-${id}-source`}
          position={Position.Right}
          isConnectableStart={isSelected}
          type="source"
        />
        <Handle
          className="connection-handle"
          id={`relational-handle-${id}-target`}
          position={Position.Left}
          type="target"
          isConnectableStart={false}
        />

        <Handle
          className="connection-handle"
          id={`chronological-handle-${id}-target`}
          position={Position.Top}
          type="target"
          isConnectableStart={false}
        />
        <Handle
          className="connection-handle"
          id={`chronological-handle-${id}-source`}
          position={Position.Bottom}
          type="source" isConnectableStart={false}
        />

        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{label}</Typography>
      </Box>
    </Box>
  );
}
