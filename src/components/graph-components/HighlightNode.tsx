import { Box, Typography } from "@mui/material";
import { Position, Handle, NodeProps, Node, useConnection } from "@xyflow/react";
import "../../styles/GraphNode.css";
import { usePaperContext } from "../../contexts/PaperContext";

export default function HighlightNode({ data }: NodeProps<Node>) {
  const { id, readPurposeId, label, type, content } = data as {
    id: string;
    readPurposeId: string;
    label: string;
    type: string;
    content: string;
  };
  const { selectedHighlightIds, getNodeColor } = usePaperContext();
  const color = getNodeColor(readPurposeId);

  const connection = useConnection();
  const isSelected = selectedHighlightIds.includes(id);
  const isTarget = connection.inProgress && !isSelected && connection.toNode?.id === id;

  return (
    <Box
      className={`graph-node highlight-node ${isSelected ? "selected" : ""} ${isTarget ? "target" : ""}`}
      id={`node-${id}`}
      sx={{
        backgroundColor: color
      }}
    >
      <Box sx={{ width: "100%", m: 1 }}>
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
          type="source"
          isConnectableStart={false}
        />

        <Typography variant="body1">{label}</Typography>
        {type === "area" && <img src={content} alt="Node Content" style={{ maxWidth: "100%", maxHeight: "100px" }} />}
      </Box>
    </Box>
  );
}
