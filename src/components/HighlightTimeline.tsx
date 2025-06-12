import React, { useContext } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, Scatter } from 'recharts';
import { PaperContext } from '../contexts/PaperContext';
import { Box, Typography, IconButton } from '@mui/material';
import { CloudDownload, CloudUpload } from "@mui/icons-material";
import Tooltip from '@mui/material/Tooltip';
import { exportGraph, importGraphs } from '../utils/graphIO';
import { UserContext } from '../contexts/UserContext';

export const HighlightTimeline: React.FC = () => {
    const paperContext = useContext(PaperContext);
    const userContext = useContext(UserContext);
    if (!userContext) {
        throw new Error("UserContext not found");
    }
    const { userId } = userContext;
    if (!paperContext) {
        throw new Error("PaperContext not found");
    }
    const { highlights, readRecords, nodes, edges, setHighlights, setNodes, setEdges, setReadRecords, paperUrl } = paperContext;

    // Add debugging
    console.log('Highlights:', highlights);
    console.log('ReadRecords:', readRecords);

    // Transform highlights data for the chart
    const chartData = highlights.map(highlight => {
        console.log('Processing highlight:', highlight);  // Add debugging
        return {
            timestamp: new Date(highlight.timestamp).toLocaleTimeString(),
            pageNumber: highlight.position.boundingRect.pageNumber,
            relativeY: highlight.position.boundingRect.y1, // Add relative y-coordinate
            absoluteY: ((highlight.position.boundingRect.pageNumber-1)*1200 + highlight.position.boundingRect.y1)/1200,
            type: highlight.type,
            readType: readRecords[highlight.readRecordId]?.title,
            color: readRecords[highlight.readRecordId]?.color || "inherit"
        };
    });

    console.log('Chart Data:', chartData);  // Add debugging

    const handleExportGraph = () => {
        exportGraph({
            highlights,
            nodes,
            edges,
            readRecords,
            pdfUrl: paperUrl,
            userId
        });
    };

    const handleImportGraphs = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            importGraphs(files, setGraphState, () => {}); // no-op for PDF setter in this component
        }
    };

    const setGraphState = (data: any) => {
        setHighlights(data.highlights || []);
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
        setReadRecords(data.readRecords || {});
    };

    return (
        <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
            <Typography variant="h5" sx={{ mb: 2, color: 'text.secondary' }}>
                Highlight Timeline
            </Typography>
            <LineChart width={800} height={400} data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                    dataKey="timestamp"
                    label={{ value: 'Time', position: 'insideTop' }}
                    orientation="top"
                />
                <YAxis
                    dataKey="absoluteY"
                    label={{ value: 'Page Number', angle: -90, position: 'insideLeft' }}
                    reversed={true}
                />
                <RechartsTooltip />
                <Legend />
                <Line
                    type="monotone"
                    dataKey="absoluteY"
                    stroke="black"
                    dot={{ stroke: 'blue', fill: 'blue' }}
                />
            </LineChart>
            <Box sx={{ mx: 2, display: 'flex', gap: 1 }}>
                <Tooltip title="Export Graph">
                    <IconButton onClick={handleExportGraph}>
                        <CloudDownload />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Import Graph">
                    <IconButton component="label">
                        <CloudUpload />
                        <input type="file" accept="application/zip" multiple hidden onChange={handleImportGraphs} />
                    </IconButton>
                </Tooltip>
            </Box>
        </Box>
    );
}; 