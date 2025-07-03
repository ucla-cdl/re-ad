import { Box, Checkbox, FormControlLabel } from "@mui/material";
import { ReadingState, UserData, UserRole, useStorageContext } from "../contexts/StorageContext";
import { useEffect, useState } from "react";
import * as d3 from "d3";
import { usePaperContext } from "../contexts/PaperContext";

export const MultiAnalysisPanel = () => {
    const { getAllUsers, getMultipleReadingStateData } = useStorageContext();
    const { paperId, pdfViewerRef } = usePaperContext();

    const [studentsDict, setStudentsDict] = useState<Record<string, UserData>>({});
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [multipleReadingStateData, setMultipleReadingStateData] = useState<Record<string, ReadingState>>({});
    const [maxDuration, setMaxDuration] = useState(0);

    useEffect(() => {
        if (!paperId) return;
        fetchAllStudents();
    }, []);

    useEffect(() => {
        if (Object.keys(multipleReadingStateData).length === 0) return;
        drawTimelineGraph();
    }, [multipleReadingStateData]);

    useEffect(() => {
        if (Object.keys(studentsDict).length === 0) return;
        Object.keys(studentsDict).forEach(studentId => {
            toggleTimelineColor(studentId, selectedStudentIds.includes(studentId));
        });
    }, [selectedStudentIds]);

    const fetchAllStudents = async () => {
        const students = await getAllUsers(UserRole.STUDENT);
        setStudentsDict(students.reduce((acc, student) => {
            acc[student.id] = student;
            return acc;
        }, {} as Record<string, UserData>));
        const studentIds = students.map((student) => student.id);
        const multipleReadingStateData = await getMultipleReadingStateData(studentIds, paperId!);
        let maxDuration = 0;
        multipleReadingStateData.forEach((readingState) => {
            const sessions = Object.values(readingState.state.readingSessions);
            const totalDuration = sessions.reduce((acc, session) => acc + session.duration, 0);
            maxDuration = Math.max(maxDuration, totalDuration);
        });
        setMaxDuration(maxDuration);
        setMultipleReadingStateData(multipleReadingStateData.reduce((acc, readingState) => {
            acc[readingState.userId] = readingState;
            return acc;
        }, {} as Record<string, ReadingState>));
    }

    const handleStudentSelection = (studentId: string) => {
        setSelectedStudentIds((prev) => {
            if (prev.includes(studentId)) {
                return prev.filter((id) => id !== studentId);
            }
            return [...prev, studentId];
        });
    }

    const drawTimelineGraph = () => {
        const container = d3.select("#timeline-container");
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

        if (!pdfViewerRef.current) {
            return;
        }
        // TODO: the height might be different for each page OR the scale might be different -- need to figure out for robust visualization
        const pdfPageHeight = pdfViewerRef.current.getPageView(0).height;
        const pdfTotalHeight = pdfViewerRef.current.pagesCount * pdfPageHeight;

        const xScale = d3.scaleLinear()
            .domain([0, maxDuration])
            .range([0, chartWidth]);

        const xAxis = d3.axisTop(xScale)
            .tickSizeOuter(0)
            .tickFormat((d) => {
                const milliseconds = d as number;
                const minutes = (milliseconds) / (1000 * 60);
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

        Object.values(multipleReadingStateData).forEach((readingState) => {
            const g = chart.append("g")
                .attr("id", `reading-session-${readingState.userId}`)
                .attr("class", "reading-session");

            const highlights = readingState.state.highlights;
            const sessions = Object.values(readingState.state.readingSessions);
            let durationIntercept = 0;
            sessions.forEach(session => {
                const scrollSequence = session.scrollSequence.map(scroll => [scroll[0] - session.startTime + durationIntercept, scroll[1]]) as [number, number][];
                g.append("path")
                    .attr("id", `reading-session-path-${session.sessionId}`)
                    .attr("d", line(scrollSequence))
                    .attr("fill", "none")
                    .attr("stroke", "grey")
                    .attr("stroke-width", 2);

                highlights.filter(highlight => highlight.sessionId === session.sessionId).forEach(highlight => {
                    const relativeTime = highlight.timestamp - session.startTime + durationIntercept;
                    const yPosition = (highlight.position.boundingRect.pageNumber - 1) * pdfPageHeight + highlight.position.boundingRect.y1;
                    g.append("circle")
                        .attr("class", `highlight-circle-${highlight.readRecordId}`)
                        .attr("cx", xScale(relativeTime))
                        .attr("cy", yScale(yPosition))
                        .attr("r", 3)
                        .attr("fill", "none")
                        .attr("stroke", "none")
                        .attr("stroke-width", 0.5);
                });

                durationIntercept += session.duration;
            });
        });
    }

    const toggleTimelineColor = (studentId: string, isSelected: boolean) => {
        const readingState = multipleReadingStateData[studentId];
        if (!readingState) return;
        
        const readRecords = readingState.state.readRecords;
        if (isSelected) {
            const g = d3.select(`#reading-session-${studentId}`);
            g.selectAll("path").each((_d, i, nodes) => {
                const path = d3.select(nodes[i]);
                const sessionId = path.attr("id").split("reading-session-path-")[1];
                const readId = readingState.state.readingSessions[sessionId].readId;
                path.attr("stroke", readRecords[readId].color);
            });
            g.selectAll("circle").each((_d, i, nodes) => {
                const circle = d3.select(nodes[i]);
                const readId = circle.attr("class").split("highlight-circle-")[1];
                circle
                    .attr("fill", readRecords[readId].color)
                    .attr("stroke", "black");
            });
        } else {
            const g = d3.select(`#reading-session-${studentId}`);
            g.selectAll("path")
                .attr("stroke", "grey");
            g.selectAll("circle")
                .attr("fill", "none")
                .attr("stroke", "none");
        }
    }

    return (
        <Box sx={{ p: 2, width: '100%', height: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
            <Box sx={{ mb: 2, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                {Object.values(studentsDict).map((student) => (
                    <FormControlLabel
                        key={student.id}
                        control={<Checkbox
                            checked={selectedStudentIds.includes(student.id)}
                            onChange={() => handleStudentSelection(student.id)}
                        />}
                        label={student.name}
                        sx={{ width: '100%' }}
                    />
                ))}
            </Box>

            <Box id="timeline-container" sx={{ width: '100%', height: '60%' }} />
        </Box>
    );
};