import { Box, Paper, Typography, Breadcrumbs, Link, Chip, Switch, IconButton } from "@mui/material";
import { useEffect, useState } from "react";
import * as d3 from "d3";
import { UPDATE_INTERVAL } from "../contexts/PaperContext";
import { formatTime } from "../utils/func";
import { Person, Article, Analytics, Notes, Polyline } from "@mui/icons-material";
import { useWorkspaceContext } from "../contexts/WorkspaceContext";
import { AnalyticsLevel, useAnalysisContext } from "../contexts/AnalysisContext";
import "../styles/AnalysisPanel.css";

export const AnalysisPanel = () => {
    const { usersDict, papersDict } = useWorkspaceContext();
    const {
        selectedAnalyticsPapersId,
        selectedAnalyticsUsersId,
        userPaperReadSessions,
        userPaperHighlights,
        userPaperPurposes,
        maxDuration,
        analyticsLevel,
        selectedPaper,
        selectedUser,
        handlePaperClick,
        handleUserClick,
        handleBreadcrumbClick,
        paperStats,
        userPaperStats,
        userPurposeStats,
        showCanvas,
        setShowCanvas,
    } = useAnalysisContext();

    const [showHighlights, setShowHighlights] = useState(false);
    const HIGHLIGHT_COLOR = "#6cc0f5";

    useEffect(() => {
        if (Object.keys(userPaperReadSessions).length > 0) {
            drawTimelineGraph();
        }
    }, [userPaperReadSessions]);

    useEffect(() => {
        updateTimelineChart();
    }, [showHighlights, analyticsLevel]);

    const drawTimelineGraph = () => {
        const container = d3.select("#timeline-container");
        if (!container) return;
        const node = container.node() as HTMLElement;
        if (!node) return;
        const containerWidth = node.clientWidth;
        const containerHeight = node.clientHeight;

        const margin = { top: 20, right: 20, bottom: 20, left: 20 };
        const titleOffsetX = 45;
        const titleOffsetY = 35;

        const chartWidth = containerWidth - margin.left - margin.right - titleOffsetX;
        const chartHeight = containerHeight - margin.top - margin.bottom - titleOffsetY;

        container.selectAll("svg").remove();
        const svg = container.append("svg")
            .attr("width", containerWidth)
            .attr("height", containerHeight);

        // draw x axis title
        svg.append("text")
            .attr("x", margin.left + titleOffsetX + chartWidth / 2)
            .attr("y", margin.top)
            .attr("text-anchor", "middle")
            .attr("font-size", "14px")
            .text("Time (minutes)");

        // draw y axis title
        svg.append("text")
            .attr("transform", `translate(${margin.left}, ${margin.top + titleOffsetY + chartHeight / 2}) rotate(-90)`)
            .attr("text-anchor", "middle")
            .attr("font-size", "14px")
            .text("Page Number (%)");

        // draw the chart
        const chart = svg.append("g")
            .attr("transform", `translate(${margin.left + titleOffsetX}, ${margin.top + titleOffsetY})`)
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
                .attr("id", `timeline_${userId}_${paperId}`);

            let durationIntercept = 0;

            const highlights = userPaperHighlights[`${userId}_${paperId}`] || [];

            sessions.sort((a, b) => a.startTime - b.startTime).forEach(session => {
                const scrollSequence = session.scrollSequence.map((scrollPosPercentage, index) => {
                    const timestamp = index * UPDATE_INTERVAL + durationIntercept;
                    return [timestamp, scrollPosPercentage * 100];
                }) as [number, number][];

                const sessionGroup = timelineGroup.append("g")
                    .attr("id", `read_session_${session.id}`)

                sessionGroup.append("path")
                    .attr("class", "read-timeline-path")
                    .attr("id", `path_${session.readPurposeId}_${session.id}`)
                    .attr("d", line(scrollSequence))
                    .attr("fill", "none")
                    .attr("stroke", "grey")
                    .attr("stroke-width", 1.5);

                highlights.filter(highlight => highlight.sessionId === session.id).forEach(highlight => {
                    const relativeTime = highlight.timestamp - session.startTime + durationIntercept;
                    sessionGroup.append("circle")
                        .attr("class", "read-timeline-highlight")
                        .attr("id", `highlight_${session.readPurposeId}_${session.id}_${highlight.id}`)
                        .attr("cx", xScale(relativeTime))
                        .attr("cy", yScale(highlight.posPercentage * 100))
                        .attr("r", 2)
                        .attr("fill", showHighlights ? HIGHLIGHT_COLOR : "none")
                        .attr("stroke", "none")
                        .attr("stroke-width", 0.5);
                });

                durationIntercept += session.duration;
            });
        });

        updateTimelineChart();
    }

    const updateTimelineChart = () => {
        if (Object.keys(userPaperReadSessions).length === 0) return;

        Object.entries(userPaperReadSessions).forEach(([key, _sessions]) => {
            const [userId, paperId] = key.split("_");
            updateVisibility(userId, paperId);
        });
    }

    const updateVisibility = (userId: string, paperId: string) => {
        const g = d3.select(`#timeline_${userId}_${paperId}`);
        if (!g) return;

        let isHighlighted = true;

        switch (analyticsLevel) {
            default:
            case AnalyticsLevel.PAPERS:
                break;
            case AnalyticsLevel.USERS:
                // gray out the read pass that not belong to this paper
                isHighlighted = selectedPaper === paperId;
                break;
            case AnalyticsLevel.PURPOSES:
                // gray out the read pass that not belong to this paper and this user
                isHighlighted = selectedPaper === paperId && selectedUser === userId;
                break;
        }

        g.selectAll("path").each((_d, i, nodes) => {
            const path = d3.select(nodes[i]);

            if (isHighlighted) {
                if (analyticsLevel === AnalyticsLevel.PURPOSES) {
                    const purposeId = path.attr("id").split("_")[1];
                    const color = userPaperPurposes[`${userId}_${paperId}`]?.find(p => p.id === purposeId)?.color;
                    path.attr("stroke", color || "grey");
                } else {
                    path.attr("stroke", "grey");
                }
            } else {
                path.attr("stroke", "lightgrey");
            }
        });

        g.selectAll("circle").each((_d, i, nodes) => {
            const circle = d3.select(nodes[i]);

            if (isHighlighted && showHighlights) {
                if (analyticsLevel === AnalyticsLevel.PURPOSES) {
                    const purposeId = circle.attr("id").split("_")[1];
                    const color = userPaperPurposes[`${userId}_${paperId}`]?.find(p => p.id === purposeId)?.color;
                    circle
                        .attr("fill", color || HIGHLIGHT_COLOR)
                        .attr("stroke", "none");
                } else {
                    circle
                        .attr("fill", HIGHLIGHT_COLOR)
                        .attr("stroke", "none");
                }
            } else {
                circle
                    .attr("fill", "none")
                    .attr("stroke", "none");
            }
        });
    }

    const renderAnalyticsContent = () => {
        if (analyticsLevel === AnalyticsLevel.PAPERS) {
            return (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {paperStats.map((paper) => (
                        <Paper
                            key={paper.paperId}
                            sx={{
                                p: 2,
                                backgroundColor: 'background.default',
                                border: '1px solid',
                                borderColor: 'divider',
                                cursor: 'pointer',
                                '&:hover': {
                                    borderColor: 'primary.main',
                                    backgroundColor: 'action.hover'
                                }
                            }}
                            onClick={() => handlePaperClick(paper.paperId)}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Article color="primary" />
                                <Typography variant="h6" sx={{ color: 'text.primary' }}>
                                    {paper.paperTitle}
                                </Typography>
                                <Chip label={`${paper.userCount} users`} size="small" />
                            </Box>

                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Total Reading Time
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                        {formatTime(paper.totalDuration)}
                                    </Typography>
                                </Box>

                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Average Time/User
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                        {formatTime(paper.averageDuration)}
                                    </Typography>
                                </Box>

                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Total Highlights
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                        {paper.totalHighlights} ({paper.averageHighlights.toFixed(1)} avg)
                                    </Typography>
                                </Box>
                            </Box>
                        </Paper>
                    ))}
                </Box>
            );
        }

        if (analyticsLevel === AnalyticsLevel.USERS) {
            return (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {userPaperStats.map((user) => (
                        <Paper
                            key={user.userId}
                            sx={{
                                p: 2,
                                backgroundColor: 'background.default',
                                border: '1px solid',
                                borderColor: 'divider',
                                cursor: 'pointer',
                                '&:hover': {
                                    borderColor: 'primary.main',
                                    backgroundColor: 'action.hover'
                                }
                            }}
                            onClick={() => handleUserClick(user.userId)}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Person color="primary" />
                                <Typography variant="h6" sx={{ color: 'text.primary' }}>
                                    {user.userName}
                                </Typography>
                                <Chip label={`${user.purposeCount} purposes`} size="small" />
                            </Box>

                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Reading Time
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                        {formatTime(user.duration)}
                                    </Typography>
                                </Box>

                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Total Highlights
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                        {user.highlightCount}
                                    </Typography>
                                </Box>

                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Text/Image Highlights
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                        {user.textHighlightCount}/{user.imageHighlightCount}
                                    </Typography>
                                </Box>
                            </Box>

                            {user.lastReadTime > 0 && (
                                <Box sx={{ mt: 1 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Last Read: {new Date(user.lastReadTime).toLocaleDateString()}
                                    </Typography>
                                </Box>
                            )}
                        </Paper>
                    ))}
                </Box>
            );
        }

        if (analyticsLevel === AnalyticsLevel.PURPOSES) {
            return (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {userPurposeStats.map((purpose) => (
                        <Paper
                            key={purpose.purposeId}
                            sx={{
                                p: 2,
                                backgroundColor: 'background.default',
                                border: '1px solid',
                                borderColor: 'divider',
                                borderLeft: 10,
                                borderLeftColor: purpose.purposeColor
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Typography variant="h6">
                                    {purpose.purposeTitle}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Reading Time
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                        {formatTime(purpose.duration)}
                                    </Typography>
                                </Box>

                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Total Highlights
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                        {purpose.highlightCount}
                                    </Typography>
                                </Box>

                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Text/Image Highlights
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                        {purpose.textHighlightCount}/{purpose.imageHighlightCount}
                                    </Typography>
                                </Box>
                            </Box>

                            {purpose.lastReadTime > 0 && (
                                <Box sx={{ mt: 1 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Last Read: {new Date(purpose.lastReadTime).toLocaleDateString()}
                                    </Typography>
                                </Box>
                            )}
                        </Paper>
                    ))}
                </Box>
            );
        }

        return null;
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            {(selectedAnalyticsUsersId.length === 0 || selectedAnalyticsPapersId.length === 0) && (
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    textAlign: 'center',
                    p: 4
                }}>
                    <Box sx={{
                        p: 4,
                        borderRadius: 3,
                        backgroundColor: 'background.paper',
                        border: '2px dashed',
                        borderColor: 'divider',
                        maxWidth: '400px',
                        width: '100%'
                    }}>
                        <Analytics sx={{
                            fontSize: '4rem',
                            color: 'text.secondary',
                            mb: 2,
                            opacity: 0.7
                        }} />

                        <Typography variant="h6" sx={{
                            mb: 2,
                            color: 'text.primary',
                            fontWeight: 'medium'
                        }}>
                            Ready for Analytics
                        </Typography>

                        <Typography variant="body1" color="text.secondary" sx={{
                            lineHeight: 1.6,
                            mb: 2
                        }}>
                            Select papers and users from the left panel to begin analyzing reading patterns and insights.
                        </Typography>
                    </Box>
                </Box>
            )}

            {(selectedAnalyticsUsersId.length > 0 && selectedAnalyticsPapersId.length > 0) && (
                <>
                    {/* Timeline Section - Middle 50% */}
                    <Box sx={{ boxSizing: 'border-box', height: '45%', p: 2, borderBottom: 1, borderColor: 'divider' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="h6">
                                Reading Timeline
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Notes sx={{ color: showHighlights ? 'primary.main' : 'text.secondary' }} />
                                <Switch
                                    checked={showHighlights}
                                    onChange={() => setShowHighlights(!showHighlights)}
                                    color="primary"
                                />
                            </Box>
                        </Box>

                        {Object.keys(userPaperReadSessions).length > 0 ?
                            (
                                <Box id="timeline-container" sx={{ width: '100%', height: 'calc(100% - 30px)' }} />
                            ) : (
                                <Paper sx={{ p: 3, textAlign: 'center', backgroundColor: 'background.default' }}>
                                    <Typography variant="body2" color="text.secondary">
                                        No data available for the selected criteria.
                                    </Typography>
                                </Paper>
                            )}
                    </Box>

                    {/* Analytics Section - Bottom 50% */}
                    <Box sx={{ boxSizing: 'border-box', height: '55%', p: 2, overflow: 'auto' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="h6">
                                Reading Analytics Explorer
                            </Typography>
                            {analyticsLevel === AnalyticsLevel.PURPOSES && (
                                <IconButton
                                    color="primary"
                                    onClick={() => setShowCanvas(!showCanvas)}
                                >
                                    <Polyline />
                                </IconButton>
                            )}
                        </Box>

                        {/* Breadcrumbs */}
                        <Breadcrumbs sx={{ mb: 2 }}>
                            <Link
                                component="button"
                                underline={analyticsLevel === AnalyticsLevel.PAPERS ? 'none' : 'hover'}
                                onClick={() => handleBreadcrumbClick(AnalyticsLevel.PAPERS)}
                                sx={{ fontWeight: analyticsLevel === AnalyticsLevel.PAPERS ? 'bold' : 'normal' }}
                            >
                                Papers
                            </Link>
                            {selectedPaper && (
                                <Link
                                    component="button"
                                    underline={analyticsLevel === AnalyticsLevel.USERS ? 'none' : 'hover'}
                                    onClick={() => handleBreadcrumbClick(AnalyticsLevel.USERS)}
                                    sx={{
                                        fontWeight: analyticsLevel === AnalyticsLevel.USERS ? 'bold' : 'normal'
                                    }}
                                >
                                    {(papersDict[selectedPaper]?.title?.length > 30
                                        ? papersDict[selectedPaper].title.slice(0, 30) + "…"
                                        : papersDict[selectedPaper]?.title) || 'Paper'}
                                </Link>
                            )}
                            {selectedUser && selectedPaper && (
                                <Typography color="text.primary" sx={{ fontWeight: 'bold' }}>
                                    {usersDict[selectedUser]?.name || 'User'}
                                </Typography>
                            )}
                        </Breadcrumbs>

                        {/* Analytics Content */}
                        {renderAnalyticsContent()}

                        {/* Empty state */}
                        {Object.keys(userPaperReadSessions).length === 0 && (
                            <Paper sx={{ p: 3, textAlign: 'center', backgroundColor: 'background.default' }}>
                                <Typography variant="body2" color="text.secondary">
                                    No data available for the selected criteria.
                                </Typography>
                            </Paper>
                        )}
                    </Box>
                </>
            )
            }
        </Box >
    );
};
