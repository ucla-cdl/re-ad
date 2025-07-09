import React, { useEffect } from 'react';
import { usePaperContext } from '../contexts/PaperContext';
import { Box, Typography, Button } from '@mui/material';
import * as d3 from "d3";
import { UPDATE_INTERVAL, useReadingAnalyticsContext } from '../contexts/ReadingAnalyticsContext';

export const HighlightTimeline: React.FC = () => {
    const { pdfViewerRef, highlights, readPurposes } = usePaperContext();

    const { readSessions } = useReadingAnalyticsContext();

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
            .text("Paper Position (%)")
            .attr("transform", `translate(${margin.top}, ${margin.left + chartWidth / 2}) rotate(-90)`)
            .attr("text-anchor", "middle");

        // draw the chart
        const chart = svg.append("g")
            .attr("transform", `translate(${margin.left + titleOffset}, ${margin.top + titleOffset})`)
            .attr("width", chartWidth)
            .attr("height", chartHeight);

        if (!pdfViewerRef.current) {
            return;
        }

        // Normalize the page height by the current scale
        const pdfPageHeight = pdfViewerRef.current.getPageView(0).height / pdfViewerRef.current.currentScale;
        const pdfTotalHeight = pdfViewerRef.current.pagesCount * pdfPageHeight;

        const sessions = Object.values(readSessions).sort((a, b) => a.startTime - b.startTime);
        const totalDuration = sessions.reduce((acc, session) => acc + session.duration, 0);
        
        const xScale = d3.scaleLinear()
            .domain([0, totalDuration])
            .range([0, chartWidth]);

        const xAxis = d3.axisTop(xScale)
            .tickFormat((d) => {
                const milliseconds = d as number;
                const minutes = (milliseconds) / (1000 * 60);
                return `${minutes.toFixed(1)}`;
            });

        chart.append("g")
            .call(xAxis);

        const yScale = d3.scaleLinear()
            .domain([0, 100])
            .range([0, chartHeight]);

        const yAxis = d3.axisLeft(yScale)
            .tickSizeOuter(0)
            .tickFormat((d) => `${d}%`);

        chart.append("g")
            .call(yAxis);

        const line = d3.line()
            .x((d) => xScale(d[0]))
            .y((d) => yScale(d[1]));

        let durationIntercept = 0;
        sessions.forEach(session => {
            const scrollSequence = session.scrollSequence.map((scrollPosition, index) => {
                const timestamp = index * UPDATE_INTERVAL + durationIntercept;
                const normalizedY = (scrollPosition / pdfTotalHeight) * 100;
                return [timestamp, normalizedY];
            }) as [number, number][];

            chart.append("path")
                .attr("d", line(scrollSequence))
                .attr("fill", "none")
                .attr("stroke", readPurposes[session.readPurposeId].color)
                .attr("stroke-width", 3);
            
            highlights.filter(highlight => highlight.sessionId === session.id).forEach(highlight => {
                const relativeTime = highlight.timestamp - session.startTime + durationIntercept;
                const absoluteY = (highlight.position.boundingRect.pageNumber - 1) * pdfPageHeight + highlight.position.boundingRect.y1;
                const normalizedY = (absoluteY / pdfTotalHeight) * 100;

                chart.append("circle")
                    .attr("cx", xScale(relativeTime))
                    .attr("cy", yScale(normalizedY))
                    .attr("r", 3)
                    .attr("fill", readPurposes[highlight.readPurposeId].color)
                    .attr("stroke", "black")
                    .attr("stroke-width", 0.5);
            });

            durationIntercept += session.duration;
        });
    }

    return (
        <Box sx={{ p: 2, width: '100%', height: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
            <Typography variant="h5" sx={{ mb: 2, color: 'text.secondary' }}>
                Highlight Timeline
            </Typography>

            <Box id="highlight-timeline-container" sx={{ width: '100%', height: '60%' }} />
        </Box>
    );
}; 