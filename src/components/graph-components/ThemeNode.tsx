import { Box, Typography } from "@mui/material";
import { Position, Handle, NodeProps, Node, useConnection } from "@xyflow/react";
import { usePaperContext } from "../../contexts/PaperContext";
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import "../../styles/GraphNode.css";

export default function ThemeNode({ data }: NodeProps<Node>) {
  const { id, readRecordId, label } = data as {
    id: string;
    readRecordId: string;
    label: string;
  };
  const { readRecords, displayedReads, selectedHighlightIds } = usePaperContext();
  const { color } = readRecords[readRecordId] || { color: "#e6e6e6" };
  const isDisplayed = displayedReads.includes(readRecordId);

  const connection = useConnection();
  const isTarget = connection.inProgress && connection.fromNode.id !== id;

  return (
    <Box
      className={`theme-node ${selectedHighlightIds.includes(id) ? "selected" : ""}`}
      id={`node-${id}`}
      sx={{ backgroundColor: isDisplayed ? `${color}` : "#e6e6e6" }}
    >
      <Box sx={{ width: "100%", m: 1, mb: 2 }}>
        {!connection.inProgress && (
          <Handle
            className="connection-handle"
            id={`relational-handle-${id}-source`}
            position={Position.Right}
            type="source"
          />
        )}
        {(!connection.inProgress || isTarget) && (
          <Handle
            className="connection-handle"
            id={`relational-handle-${id}-target`}
            position={Position.Left}
            type="target"
            isConnectableStart={false}
          />
        )}

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

      <DragIndicatorIcon className="drag-handle__custom" />
    </Box>
  );
}
