import { Box, Checkbox, FormControlLabel, Paper, Typography, Button, Breadcrumbs, Link, Chip } from "@mui/material";
import { PaperData, ReadHighlight, ReadSession, UserData, UserRole, useStorageContext, ReadPurpose } from "../contexts/StorageContext";
import { useEffect, useState } from "react";
import * as d3 from "d3";
import { UPDATE_INTERVAL, usePaperContext } from "../contexts/PaperContext";
import { formatTime } from "../utils/func";
import { Person, Article, Psychology, Close } from "@mui/icons-material";

type PaperStats = {
    paperId: string;
    paperTitle: string;
    totalDuration: number;
    averageDuration: number;
    userCount: number;
    totalHighlights: number;
    averageHighlights: number;
};

type UserPaperStats = {
    userId: string;
    userName: string;
    duration: number;
    highlightCount: number;
    textHighlightCount: number;
    imageHighlightCount: number;
    purposeCount: number;
    lastReadTime: number;
};

type UserPurposeStats = {
    purposeId: string;
    purposeTitle: string;
    purposeColor: string;
    duration: number;
    highlightCount: number;
    textHighlightCount: number;
    imageHighlightCount: number;
    lastReadTime: number;
};

type AnalyticsLevel = 'papers' | 'users' | 'purposes';

export const AnalysisPanel = () => {
    const { userData, getSessionsByUsersAndPapers, getHighlightsByUsersAndPapers, getPurposesByUserAndPaper } = useStorageContext();
    const { usersDict, papersDict, selectedAnalyticsPapersId, selectedAnalyticsUsersId, togglePaperForAnalytics, toggleUserForAnalytics } = usePaperContext();

    const [userPaperReadSessions, setUserPaperReadSessions] = useState<Record<string, ReadSession[]>>({});
    const [userPaperHighlights, setUserPaperHighlights] = useState<Record<string, ReadHighlight[]>>({});
    const [userPaperPurposes, setUserPaperPurposes] = useState<Record<string, ReadPurpose[]>>({});
    const [maxDuration, setMaxDuration] = useState(0);

    // Analytics navigation state
    const [analyticsLevel, setAnalyticsLevel] = useState<AnalyticsLevel>('papers');
    const [selectedPaper, setSelectedPaper] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<string | null>(null);

    // Analytics data
    const [totalTime, setTotalTime] = useState(0);
    const [paperStats, setPaperStats] = useState<PaperStats[]>([]);
    const [userPaperStats, setUserPaperStats] = useState<UserPaperStats[]>([]);
    const [userPurposeStats, setUserPurposeStats] = useState<UserPurposeStats[]>([]);

    const [showHighlights, setShowHighlights] = useState(false);
    const HIGHLIGHT_COLOR = "red";

    const isTeacher = userData?.role === UserRole.TEACHER;


    useEffect(() => {
        fetchData();
    }, [selectedAnalyticsUsersId, selectedAnalyticsPapersId]);

    useEffect(() => {
        if (Object.keys(userPaperReadSessions).length === 0) return;
        drawTimelineGraph();
    }, [userPaperReadSessions]);

    useEffect(() => {
        updateTimelineChart();
    }, [selectedAnalyticsUsersId, selectedAnalyticsPapersId, showHighlights]);

    useEffect(() => {
        calculateAnalytics();
    }, [userPaperReadSessions, userPaperHighlights, userPaperPurposes, selectedAnalyticsUsersId, selectedAnalyticsPapersId, analyticsLevel, selectedPaper, selectedUser]);

    const fetchData = async () => {
        const sessionsByUserAndPaper = await getSessionsByUsersAndPapers(selectedAnalyticsUsersId, selectedAnalyticsPapersId);
        const highlightsByUserAndPaper = await getHighlightsByUsersAndPapers(selectedAnalyticsUsersId, selectedAnalyticsPapersId);
        
        // Fetch purposes for each user-paper combination
        const purposesByUserAndPaper: Record<string, ReadPurpose[]> = {};
        for (const userId of selectedAnalyticsUsersId) {
            for (const paperId of selectedAnalyticsPapersId) {
                const key = `${userId}_${paperId}`;
                try {
                    const purposes = await getPurposesByUserAndPaper(userId, paperId);
                    purposesByUserAndPaper[key] = purposes;
                } catch (error) {
                    console.error(`Error fetching purposes for user ${userId} and paper ${paperId}:`, error);
                    purposesByUserAndPaper[key] = [];
                }
            }
        }
        
        let maxDuration = 0;
        Object.values(sessionsByUserAndPaper).forEach((sessions) => {
            const totalDuration = sessions.reduce((acc, session) => acc + session.duration, 0);
            maxDuration = Math.max(maxDuration, totalDuration);
        });
        setMaxDuration(maxDuration);
        setUserPaperReadSessions(sessionsByUserAndPaper);
        setUserPaperHighlights(highlightsByUserAndPaper);
        setUserPaperPurposes(purposesByUserAndPaper);
    }

    const calculateAnalytics = () => {
        // Calculate total time for selected user-paper combinations
        let totalTime = 0;
        const selectedKeys = Object.keys(userPaperReadSessions).filter(key => {
            const [userId, paperId] = key.split("_");
            return selectedAnalyticsUsersId.includes(userId) && selectedAnalyticsPapersId.includes(paperId);
        });

        selectedKeys.forEach(key => {
            const sessions = userPaperReadSessions[key] || [];
            totalTime += sessions.reduce((acc, session) => acc + session.duration, 0);
        });
        setTotalTime(totalTime);

        if (analyticsLevel === 'papers') {
            calculatePaperStats(selectedKeys);
        } else if (analyticsLevel === 'users' && selectedPaper) {
            calculateUserPaperStats(selectedPaper);
        } else if (analyticsLevel === 'purposes' && selectedPaper && selectedUser) {
            calculateUserPurposeStats(selectedUser, selectedPaper);
        }
    };

    const calculatePaperStats = (selectedKeys: string[]) => {
        const paperStatsMap = new Map<string, {
            totalDuration: number;
            userCount: number;
            totalHighlights: number;
            users: Set<string>;
        }>();

        selectedKeys.forEach(key => {
            const [userId, paperId] = key.split("_");
            const sessions = userPaperReadSessions[key] || [];
            const highlights = userPaperHighlights[key] || [];

            if (!paperStatsMap.has(paperId)) {
                paperStatsMap.set(paperId, {
                    totalDuration: 0,
                    userCount: 0,
                    totalHighlights: 0,
                    users: new Set()
                });
            }

            const stats = paperStatsMap.get(paperId)!;
            stats.totalDuration += sessions.reduce((acc, session) => acc + session.duration, 0);
            stats.totalHighlights += highlights.length;
            stats.users.add(userId);
        });

        const paperStats: PaperStats[] = Array.from(paperStatsMap.entries())
            .map(([paperId, stats]) => ({
                paperId,
                paperTitle: papersDict[paperId]?.title || 'Unknown Paper',
                totalDuration: stats.totalDuration,
                averageDuration: stats.users.size > 0 ? stats.totalDuration / stats.users.size : 0,
                userCount: stats.users.size,
                totalHighlights: stats.totalHighlights,
                averageHighlights: stats.users.size > 0 ? stats.totalHighlights / stats.users.size : 0
            }))
            .sort((a, b) => b.totalDuration - a.totalDuration);

        setPaperStats(paperStats);
    };

    const calculateUserPaperStats = (paperId: string) => {
        const userStats: UserPaperStats[] = [];

        selectedAnalyticsUsersId.forEach(userId => {
            const key = `${userId}_${paperId}`;
            const sessions = userPaperReadSessions[key] || [];
            const highlights = userPaperHighlights[key] || [];
            const purposes = userPaperPurposes[key] || [];

            if (sessions.length > 0 || highlights.length > 0) {
                const duration = sessions.reduce((acc, session) => acc + session.duration, 0);
                const lastReadTime = Math.max(...sessions.map(s => s.startTime + s.duration), 0);

                userStats.push({
                    userId,
                    userName: usersDict[userId]?.name || 'Unknown User',
                    duration,
                    highlightCount: highlights.length,
                    textHighlightCount: highlights.filter(h => h.type === 'text').length,
                    imageHighlightCount: highlights.filter(h => h.type === 'area').length,
                    purposeCount: purposes.length,
                    lastReadTime
                });
            }
        });

        setUserPaperStats(userStats.sort((a, b) => b.duration - a.duration));
    };

    const calculateUserPurposeStats = (userId: string, paperId: string) => {
        const key = `${userId}_${paperId}`;
        const sessions = userPaperReadSessions[key] || [];
        const highlights = userPaperHighlights[key] || [];
        const purposes = userPaperPurposes[key] || [];

        const purposeStats: UserPurposeStats[] = purposes.map(purpose => {
            const purposeSessions = sessions.filter(s => s.readPurposeId === purpose.id);
            const purposeHighlights = highlights.filter(h => h.readPurposeId === purpose.id);
            const duration = purposeSessions.reduce((acc, session) => acc + session.duration, 0);
            const lastReadTime = Math.max(...purposeSessions.map(s => s.startTime + s.duration), 0);

            return {
                purposeId: purpose.id,
                purposeTitle: purpose.title,
                purposeColor: purpose.color,
                duration,
                highlightCount: purposeHighlights.length,
                textHighlightCount: purposeHighlights.filter(h => h.type === 'text').length,
                imageHighlightCount: purposeHighlights.filter(h => h.type === 'area').length,
                lastReadTime
            };
        }).sort((a, b) => b.duration - a.duration);

        setUserPurposeStats(purposeStats);
    };

    const handlePaperClick = (paperId: string) => {
        setSelectedPaper(paperId);
        setAnalyticsLevel('users');
    };

    const handleUserClick = (userId: string) => {
        setSelectedUser(userId);
        setAnalyticsLevel('purposes');
    };

    const handleBreadcrumbClick = (level: AnalyticsLevel) => {
        setAnalyticsLevel(level);
        if (level === 'papers') {
            setSelectedPaper(null);
            setSelectedUser(null);
        } else if (level === 'users') {
            setSelectedUser(null);
        }
    };

    const renderSelectionSummary = () => {
        if (selectedAnalyticsPapersId.length === 0 && selectedAnalyticsUsersId.length === 0) {
            return (
                <Paper sx={{ p: 2, mb: 2, backgroundColor: 'background.default', border: '1px dashed', borderColor: 'divider' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                        No papers or users selected for analytics. Use the left panel to select items.
                    </Typography>
                </Paper>
            );
        }

        return (
            <Paper sx={{ p: 2, mb: 2, backgroundColor: 'background.default' }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                    Selected for Analysis
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Selected Papers */}
                    <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Papers ({selectedAnalyticsPapersId.length})
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {selectedAnalyticsPapersId.map(paperId => (
                                <Chip
                                    key={paperId}
                                    label={papersDict[paperId]?.title || 'Unknown Paper'}
                                    icon={<Article />}
                                    onDelete={() => togglePaperForAnalytics(paperId)}
                                    deleteIcon={<Close />}
                                    size="small"
                                    variant="outlined"
                                    color="primary"
                                    sx={{ maxWidth: '200px' }}
                                />
                            ))}
                        </Box>
                    </Box>

                    {/* Selected Users - only show for teachers */}
                    {isTeacher && selectedAnalyticsUsersId.length > 0 && (
                        <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Students ({selectedAnalyticsUsersId.length})
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {selectedAnalyticsUsersId.map(userId => (
                                    <Chip
                                        key={userId}
                                        label={usersDict[userId]?.name || 'Unknown User'}
                                        icon={<Person />}
                                        onDelete={() => toggleUserForAnalytics(userId)}
                                        deleteIcon={<Close />}
                                        size="small"
                                        variant="outlined"
                                        color="secondary"
                                        sx={{ maxWidth: '200px' }}
                                    />
                                ))}
                            </Box>
                        </Box>
                    )}
                </Box>
            </Paper>
        );
    };

    // Timeline code remains the same...
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
            updateVisibility(userId, paperId, selectedAnalyticsUsersId.includes(userId) && selectedAnalyticsPapersId.includes(paperId));
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

    const renderAnalyticsContent = () => {
        if (analyticsLevel === 'papers') {
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

        if (analyticsLevel === 'users') {
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

        if (analyticsLevel === 'purposes') {
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
                                borderLeft: 4,
                                borderLeftColor: purpose.purposeColor
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Psychology sx={{ color: purpose.purposeColor }} />
                                <Typography variant="h6" sx={{ color: purpose.purposeColor }}>
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
            {/* Selection Summary - At the very top */}
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                {renderSelectionSummary()}
            </Box>

            {/* Timeline Section - Middle 50% */}
            <Box sx={{ height: '50%', p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                    Reading Timeline
                </Typography>
                <FormControlLabel
                    control={<Checkbox
                        checked={showHighlights}
                        onChange={() => setShowHighlights(!showHighlights)}
                    />}
                    label="Show Highlights"
                />
                <Box id="timeline-container" sx={{ width: '100%', height: 'calc(100% - 80px)' }} />
            </Box>

            {/* Analytics Section - Bottom 50% */}
            <Box sx={{ height: '50%', p: 2, overflow: 'auto' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">
                        Reading Analytics Explorer
                    </Typography>
                    <Typography variant="body2" color="primary">
                        Total Time: {formatTime(totalTime)}
                    </Typography>
                </Box>

                {/* Breadcrumbs */}
                <Breadcrumbs sx={{ mb: 2 }}>
                    <Link
                        component="button"
                        underline={analyticsLevel === 'papers' ? 'none' : 'hover'}
                        onClick={() => handleBreadcrumbClick('papers')}
                        sx={{ fontWeight: analyticsLevel === 'papers' ? 'bold' : 'normal' }}
                    >
                        Papers
                    </Link>
                    {selectedPaper && (
                        <Link
                            component="button"
                            underline={analyticsLevel === 'users' ? 'none' : 'hover'}
                            onClick={() => handleBreadcrumbClick('users')}
                            sx={{ fontWeight: analyticsLevel === 'users' ? 'bold' : 'normal' }}
                        >
                            {papersDict[selectedPaper]?.title || 'Paper'} Users
                        </Link>
                    )}
                    {selectedUser && selectedPaper && (
                        <Typography color="text.primary" sx={{ fontWeight: 'bold' }}>
                            {usersDict[selectedUser]?.name || 'User'} Purposes
                        </Typography>
                    )}
                </Breadcrumbs>

                {/* Analytics Content */}
                {renderAnalyticsContent()}

                {/* Empty state */}
                {((analyticsLevel === 'papers' && paperStats.length === 0) ||
                  (analyticsLevel === 'users' && userPaperStats.length === 0) ||
                  (analyticsLevel === 'purposes' && userPurposeStats.length === 0)) && (
                    <Paper sx={{ p: 3, textAlign: 'center', backgroundColor: 'background.default' }}>
                        <Typography variant="body2" color="text.secondary">
                            No data available for the selected criteria.
                        </Typography>
                    </Paper>
                )}
            </Box>
        </Box>
    );
};
