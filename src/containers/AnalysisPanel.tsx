import { Box, Checkbox, FormControlLabel } from "@mui/material";
import { PaperData, ReadHighlight, ReadSession, UserData, UserRole, useStorageContext } from "../contexts/StorageContext";
import { useEffect, useState } from "react";
import * as d3 from "d3";
import { UPDATE_INTERVAL, usePaperContext } from "../contexts/PaperContext";

export const AnalysisPanel = () => {
    const { userData, getUserById, getAllUsers, getSessionsByUsersAndPapers, getHighlightsByUsersAndPapers, getAllPapersData } = useStorageContext();

    const [usersDict, setUsersDict] = useState<Record<string, UserData>>({});
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [papersDict, setPapersDict] = useState<Record<string, PaperData>>({});
    const [selectedPaperIds, setSelectedPaperIds] = useState<string[]>([]);
    const [userPaperReadSessions, setUserPaperReadSessions] = useState<Record<string, ReadSession[]>>({});
    const [userPaperHighlights, setUserPaperHighlights] = useState<Record<string, ReadHighlight[]>>({});
    const [maxDuration, setMaxDuration] = useState(0);

    const [showHighlights, setShowHighlights] = useState(false);
    const HIGHLIGHT_COLOR = "red";

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (Object.keys(userPaperReadSessions).length === 0) return;
        drawTimelineGraph();
    }, [userPaperReadSessions]);

    useEffect(() => {
        updateTimelineChart();
    }, [selectedUserIds, selectedPaperIds, showHighlights]);

    const fetchData = async () => {
        if (!userData) return;
        let userIds: string[] = [];
        if (userData.role === UserRole.STUDENT) {
            setUsersDict({
                [userData.id]: userData,
            });
            setSelectedUserIds([userData.id]);
            userIds = [userData.id];
        }
        else {
            const users = await getAllUsers(UserRole.STUDENT);
            setUsersDict(users.reduce((acc, user) => {
                acc[user.id] = user;
                return acc;
            }, {} as Record<string, UserData>));
            setSelectedUserIds(users.map((user) => user.id));
            userIds = users.map((user) => user.id);
        }

        const papers = await getAllPapersData();
        setPapersDict(papers.reduce((acc, paper) => {
            acc[paper.id] = paper;
            return acc;
        }, {} as Record<string, PaperData>));
        const paperIds = papers.map((paper) => paper.id);
        setSelectedPaperIds(paperIds);

        const sessionsByUserAndPaper = await getSessionsByUsersAndPapers(userIds, paperIds);
        const highlightsByUserAndPaper = await getHighlightsByUsersAndPapers(userIds, paperIds);
        let maxDuration = 0;
        Object.values(sessionsByUserAndPaper).forEach((sessions) => {
            const totalDuration = sessions.reduce((acc, session) => acc + session.duration, 0);
            maxDuration = Math.max(maxDuration, totalDuration);
        });
        setMaxDuration(maxDuration);
        setUserPaperReadSessions(sessionsByUserAndPaper);
        setUserPaperHighlights(highlightsByUserAndPaper);
    }

    const handleUserSelection = (userId: string) => {
        setSelectedUserIds((prev) => {
            if (prev.includes(userId)) {
                return prev.filter((id) => id !== userId);
            }
            return [...prev, userId];
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
            .text("Paper Position (%)")
            .attr("transform", `translate(${margin.top}, ${margin.left + chartWidth / 2}) rotate(-90)`)
            .attr("text-anchor", "middle");

        // draw the chart
        const chart = svg.append("g")
            .attr("transform", `translate(${margin.left + titleOffset}, ${margin.top + titleOffset})`)
            .attr("width", chartWidth)
            .attr("height", chartHeight);

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

        Object.entries(userPaperReadSessions).forEach(([key, sessions]) => {
            const [userId, paperId] = key.split("_");

            const timelineGroup = chart.append("g")
                .attr("id", `reading-timeline-${userId}-${paperId}`)
                .attr("class", "reading-timeline");

            let durationIntercept = 0;

            const highlights = userPaperHighlights[`${userId}_${paperId}`] || [];

            sessions.forEach(session => {
                const scrollSequence = session.scrollSequence.map((scrollPosPercentage, index) => {
                    const timestamp = index * UPDATE_INTERVAL + durationIntercept;
                    return [timestamp, scrollPosPercentage * 100];
                }) as [number, number][];

                const sessionGroup = timelineGroup.append("g")
                    .attr("id", `reading-session-${session.id}`)
                    .attr("class", "reading-session");

                sessionGroup.append("path")
                    .attr("id", `reading-session-path-${session.id}`)
                    .attr("d", line(scrollSequence))
                    .attr("fill", "none")
                    .attr("stroke", "grey")
                    .attr("stroke-width", 2);

                highlights.filter(highlight => highlight.sessionId === session.id).forEach(highlight => {
                    const relativeTime = highlight.timestamp - session.startTime + durationIntercept;
                    sessionGroup.append("circle")
                        .attr("class", `highlight-circle-${highlight.readPurposeId}`)
                        .attr("cx", xScale(relativeTime))
                        .attr("cy", yScale(highlight.posPercentage * 100))
                        .attr("r", 3)
                        .attr("fill", showHighlights ? HIGHLIGHT_COLOR : "none")
                        .attr("stroke", "none")
                        .attr("stroke-width", 0.5);
                });

                durationIntercept += session.duration;
            });
        });
    }

    const updateTimelineChart = () => {
        if (Object.keys(usersDict).length === 0 || Object.keys(papersDict).length === 0) return;

        Object.entries(userPaperReadSessions).forEach(([key, _sessions]) => {
            const [userId, paperId] = key.split("_");
            updateVisibility(userId, paperId, selectedUserIds.includes(userId) && selectedPaperIds.includes(paperId));
        });
    }

    const updateVisibility = (userId: string, paperId: string, isShown: boolean) => {
        const g = d3.select(`#reading-timeline-${userId}-${paperId}`);
        if (!g) return;

        if (isShown) {
            g.selectAll("path").each((_d, i, nodes) => {
                const path = d3.select(nodes[i]);
                path.attr("stroke", "grey");
            });
            g.selectAll("circle").each((_d, i, nodes) => {
                const circle = d3.select(nodes[i]);
                circle
                    .attr("fill", showHighlights ? HIGHLIGHT_COLOR : "none")
            });
        } else {
            g.selectAll("path")
                .attr("stroke", "none");
            g.selectAll("circle")
                .attr("fill", "none")
        }
    }

    return (
        <Box sx={{ p: 2, width: '100%', height: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
            <FormControlLabel
                control={<Checkbox
                    checked={showHighlights}
                    onChange={() => setShowHighlights(!showHighlights)}
                />}
                label="Show Highlights"
            />
            <Box sx={{ mb: 2, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                {Object.values(usersDict).map((user) => (
                    <FormControlLabel
                        key={user.id}
                        control={<Checkbox
                            checked={selectedUserIds.includes(user.id)}
                            onChange={() => handleUserSelection(user.id)}
                        />}
                        label={user.name}
                        sx={{ width: '100%' }}
                    />
                ))}
            </Box>

            <Box id="timeline-container" sx={{ width: '100%', height: '60%' }} />
        </Box>
    );
};
