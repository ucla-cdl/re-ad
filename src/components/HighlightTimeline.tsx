import React, { useEffect } from 'react';
import { usePaperContext } from '../contexts/PaperContext';
import { Box, Typography, IconButton } from '@mui/material';
import { CloudDownload, CloudUpload } from "@mui/icons-material";
import Tooltip from '@mui/material/Tooltip';
import * as d3 from "d3";
import { exportGraph, importGraph } from '../utils/graphIO';
import { useReadingAnalyticsContext } from '../contexts/ReadingAnalyticsContext';

export const HighlightTimeline: React.FC = () => {
    // TODO: move the import export to the context file
    const { pdfViewer, highlights, readRecords, nodes, edges, setHighlights, setNodes, setEdges, setReadRecords, paperUrl } = usePaperContext();

    const { readingSessions } = useReadingAnalyticsContext();

    useEffect(() => {
        drawTimelineGraph();
    }, []);

    const drawTimelineGraph = () => {
        const container = d3.select("#highlight-timeline-container");
        if (!container) return;
        const node = container.node() as HTMLElement;
        if (!node) return;
        const containerWidth = node.clientWidth;
        const containerHeight = node.clientHeight;

        const margin = { top: 20, right: 20, bottom: 20, left: 20 };
        const titleOffset = 35;

        const chartWidth = containerWidth - margin.left - margin.right - titleOffset;
        const chartHeight = containerHeight - margin.top - margin.bottom - titleOffset;

        container.selectAll("svg").remove();
        const svg = container.append("svg")
            .attr("width", containerWidth)
            .attr("height", containerHeight);

        // draw x axis title
        svg.append("text")
            .attr("x", margin.left + chartWidth / 2)
            .attr("y", margin.top)
            .text("Time (minutes)");

        // draw y axis title
        svg.append("text")
            .text("Page Number")
            .attr("transform", `translate(${margin.top}, ${margin.left + chartWidth / 2}) rotate(-90)`)
            .attr("text-anchor", "middle");

        // draw the chart
        const chart = svg.append("g")
            .attr("transform", `translate(${margin.left + titleOffset}, ${margin.top + titleOffset})`)
            .attr("width", chartWidth)
            .attr("height", chartHeight);

        const sessions = Object.values(readingSessions).sort((a, b) => a.startTime - b.startTime);
        const startTime = sessions[0].startTime;
        const endTime = sessions[sessions.length - 1].startTime + sessions[sessions.length - 1].duration;

        if (!pdfViewer) {
            return;
        }

        // TODO: the height might be different for each page OR the scale might be different -- need to figure out for robust visualization
        const pdfPageHeight = pdfViewer.getPageView(0).height;
        const pdfTotalHeight = pdfViewer.pagesCount * pdfPageHeight;

        const xScale = d3.scaleLinear()
            .domain([startTime, endTime])
            .range([0, chartWidth]);

        const xAxis = d3.axisTop(xScale)
            .tickFormat((d) => {
                const milliseconds = d as number;
                const minutes = (milliseconds - startTime) / (1000 * 60);
                return `${minutes.toFixed(1)}`;
            });

        chart.append("g")
            .call(xAxis);

        const yScale = d3.scaleLinear()
            .domain([0, pdfTotalHeight])
            .range([0, chartHeight]);

        const yAxis = d3.axisLeft(yScale)
            .tickSizeOuter(0)
            .tickFormat((d) => {
                const position = d as number;
                const pageNumber = Math.floor(position / pdfPageHeight);
                return `${pageNumber}`;
            });

        chart.append("g")
            .call(yAxis);

        const line = d3.line()
            .x((d) => xScale(d[0]))
            .y((d) => yScale(d[1]));

        sessions.forEach(session => {
            chart.append("path")
                .attr("d", line(session.scrollSequence))
                .attr("fill", "none")
                .attr("stroke", readRecords[session.readId].color)
                .attr("stroke-width", 3);
        });

        highlights.forEach(highlight => {
            const yPosition = (highlight.position.boundingRect.pageNumber - 1) * pdfPageHeight + highlight.position.boundingRect.y1;
            chart.append("circle")
                .attr("cx", xScale(highlight.timestamp))
                .attr("cy", yScale(yPosition))
                .attr("r", 3)
                .attr("fill", readRecords[highlight.readRecordId].color)
                .attr("stroke", "black")
                .attr("stroke-width", 0.5);
        });
    }

    const handleExportGraph = () => {
        exportGraph({
            highlights,
            nodes,
            edges,
            readRecords,
            pdfUrl: paperUrl
        });
    };

    const handleImportGraph = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            importGraph(file, setGraphState);
        }
    };

    const setGraphState = (data: any) => {
        setHighlights(data.highlights || []);
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
        setReadRecords(data.readRecords || {});
    };

    return (
        <Box sx={{ p: 2, width: '100%', height: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
            <Typography variant="h5" sx={{ mb: 2, color: 'text.secondary' }}>
                Highlight Timeline
            </Typography>

            <Box id="highlight-timeline-container" sx={{ width: '100%', height: '60%' }} />

            <Box sx={{ mx: 2, display: 'flex', gap: 1 }}>
                <Tooltip title="Export Graph">
                    <IconButton onClick={handleExportGraph}>
                        <CloudDownload />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Import Graph">
                    <IconButton component="label">
                        <CloudUpload />
                        <input type="file" accept="application/json" hidden onChange={handleImportGraph} />
                    </IconButton>
                </Tooltip>
            </Box>
        </Box>
    );
}; 