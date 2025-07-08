import { Handle, NodeProps, Node, Position } from "@xyflow/react";
import { Box, Typography } from "@mui/material";
import "../../styles/GraphNode.css";
import { usePaperContext } from "../../contexts/PaperContext";

export default function OverviewNode({ data }: NodeProps<Node>) {
    const { id, readRecordId, label, content, type, notes } = data as { id: string, readRecordId: string, label: string, content: string, type: string, notes: string };
    const { readRecords, displayedReads, selectedHighlightIds } = usePaperContext();
    const { color } = readRecords[readRecordId];
    const isDisplayed = displayedReads.includes(readRecordId);

    return (
        <Box
            className={`graph-node overview-node ${selectedHighlightIds.includes(id) ? "selected" : ""}`}
            id={`node-${id}`}
            sx={{ backgroundColor: isDisplayed ? color : "#e6e6e6" }}
        >
            <Handle 
                type="target" 
                position={Position.Top} 
                style={{
                    width: '10px',
                    height: '10px',
                    background: '#fff',
                    border: '2px solid #1a192b',
                    borderRadius: '50%',
                    cursor: 'pointer',
                }}
            />
            <Typography variant="body1">{label}</Typography>
            {type === "area" &&
                <>
                    <img src={content} alt="Node Content" style={{ maxWidth: "100%", maxHeight: "100px" }} />
                    <br />
                </>
            }
            <Typography variant="caption">{notes}</Typography>
            <Handle 
                type="source" 
                position={Position.Bottom} 
                style={{
                    width: '10px',
                    height: '10px',
                    background: '#fff',
                    border: '2px solid #1a192b',
                    borderRadius: '50%',
                    cursor: 'pointer',
                }}
            />
        </Box>
    );
}
