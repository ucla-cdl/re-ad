import { createContext, useContext, useEffect, useState } from "react";
import { useStorageContext, ReadSession, ReadHighlight, ReadPurpose } from "./StorageContext";
import { useWorkspaceContext } from "./WorkspaceContext";

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

export const AnalyticsLevel = {
    PAPERS: 'papers',
    USERS: 'users',
    PURPOSES: 'purposes',
};

type AnalysisContextData = {
    // Selection state
    selectedAnalyticsPapersId: string[];
    selectedAnalyticsUsersId: string[];
    togglePaperForAnalytics: (paperId: string) => void;
    toggleUserForAnalytics: (userId: string) => void;

    // Data state
    userPaperReadSessions: Record<string, ReadSession[]>;
    userPaperHighlights: Record<string, ReadHighlight[]>;
    userPaperPurposes: Record<string, ReadPurpose[]>;
    maxDuration: number;
    isLoadingData: boolean;

    // Navigation state
    analyticsLevel: string;
    selectedPaper: string | null;
    selectedUser: string | null;
    handlePaperClick: (paperId: string) => void;
    handleUserClick: (userId: string) => void;
    handleBreadcrumbClick: (level: string) => void;

    // Analytics data
    totalTime: number;
    paperStats: PaperStats[];
    userPaperStats: UserPaperStats[];
    userPurposeStats: UserPurposeStats[];

    // Data fetching
    fetchData: () => Promise<void>;
    reloadAnalytics: () => void;

    // Analytis Highlights
    analyticsHighlights: Record<string, ReadHighlight[]>;
    analyticsPurposes: Record<string, ReadPurpose[]>;
    analyticsSessions: Record<string, ReadSession[]>;
}

const AnalysisContext = createContext<AnalysisContextData | undefined>(undefined);

export const AnalysisProvider = ({ children }: { children: React.ReactNode }) => {
    const { userData, getSessionsByUsersAndPapers, getHighlightsByUsersAndPapers, getPurposesByUserAndPaper } = useStorageContext();
    const { usersDict, papersDict } = useWorkspaceContext();

    // Selection state
    const [selectedAnalyticsPapersId, setSelectedAnalyticsPapersId] = useState<string[]>([]);
    const [selectedAnalyticsUsersId, setSelectedAnalyticsUsersId] = useState<string[]>([]);

    // Data state
    const [userPaperReadSessions, setUserPaperReadSessions] = useState<Record<string, ReadSession[]>>({});
    const [userPaperHighlights, setUserPaperHighlights] = useState<Record<string, ReadHighlight[]>>({});
    const [userPaperPurposes, setUserPaperPurposes] = useState<Record<string, ReadPurpose[]>>({});
    const [maxDuration, setMaxDuration] = useState(0);
    const [isLoadingData, setIsLoadingData] = useState(false);

    // Navigation state
    const [analyticsLevel, setAnalyticsLevel] = useState<string>(AnalyticsLevel.PAPERS);
    const [selectedPaper, setSelectedPaper] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<string | null>(null);

    // Analytics data
    const [totalTime, setTotalTime] = useState(0);
    const [paperStats, setPaperStats] = useState<PaperStats[]>([]);
    const [userPaperStats, setUserPaperStats] = useState<UserPaperStats[]>([]);
    const [userPurposeStats, setUserPurposeStats] = useState<UserPurposeStats[]>([]);

    // Analytis Highlights
    const [analyticsHighlights, setAnalyticsHighlights] = useState<Record<string, ReadHighlight[]>>({});
    const [analyticsPurposes, setAnalyticsPurposes] = useState<Record<string, ReadPurpose[]>>({});
    const [analyticsSessions, setAnalyticsSessions] = useState<Record<string, ReadSession[]>>({});

    useEffect(() => {
        reloadAnalytics();
    }, [userData]);

    useEffect(() => {
        if (selectedAnalyticsUsersId.length > 0 && selectedAnalyticsPapersId.length > 0) {
            fetchData();
        }

        if (selectedPaper && !selectedAnalyticsPapersId.includes(selectedPaper)) {
            setSelectedPaper(null);
            setAnalyticsLevel(AnalyticsLevel.PAPERS);
        } else if (selectedUser && !selectedAnalyticsUsersId.includes(selectedUser)) {
            setSelectedUser(null);
            setAnalyticsLevel(AnalyticsLevel.USERS);
        }
    }, [selectedAnalyticsUsersId, selectedAnalyticsPapersId]);

    useEffect(() => {
        calculateAnalytics();
    }, [userPaperReadSessions, userPaperHighlights, userPaperPurposes, selectedAnalyticsUsersId, selectedAnalyticsPapersId, analyticsLevel, selectedPaper, selectedUser]);

    const reloadAnalytics = () => {
        setSelectedAnalyticsPapersId([]);
        setSelectedAnalyticsUsersId([]);
        setUserPaperReadSessions({});
        setUserPaperHighlights({});
        setUserPaperPurposes({});
        setMaxDuration(0);
        setAnalyticsLevel(AnalyticsLevel.PAPERS);
        setSelectedPaper(null);
        setSelectedUser(null);
        setTotalTime(0);
        setPaperStats([]);
        setUserPaperStats([]);
        setUserPurposeStats([]);
        setAnalyticsHighlights({});
        setAnalyticsPurposes({});
        setAnalyticsSessions({});
    }

    const togglePaperForAnalytics = (paperId: string) => {
        setSelectedAnalyticsPapersId(prev => {
            if (prev.includes(paperId)) {
                return prev.filter(id => id !== paperId);
            }
            return [...prev, paperId];
        });
    };

    const toggleUserForAnalytics = (userId: string) => {
        setSelectedAnalyticsUsersId(prev => {
            if (prev.includes(userId)) {
                return prev.filter(id => id !== userId);
            }
            return [...prev, userId];
        });
    };

    const fetchData = async () => {
        if (selectedAnalyticsUsersId.length === 0 || selectedAnalyticsPapersId.length === 0) {
            return;
        }

        setIsLoadingData(true);
        try {
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
        } catch (error) {
            console.error('Error fetching analysis data:', error);
        } finally {
            setIsLoadingData(false);
        }
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

        if (analyticsLevel === AnalyticsLevel.PAPERS) {
            calculatePaperStats(selectedKeys);
        } else if (analyticsLevel === AnalyticsLevel.USERS && selectedPaper) {
            calculateUserPaperStats(selectedPaper);
        } else if (analyticsLevel === AnalyticsLevel.PURPOSES && selectedPaper && selectedUser) {
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
        let aggregatedHighlights: Record<string, ReadHighlight[]> = {};

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

                if (!aggregatedHighlights[userId]) {
                    aggregatedHighlights[userId] = [];
                }
                aggregatedHighlights[userId].push(...highlights);
            }
        });

        setUserPaperStats(userStats.sort((a, b) => b.duration - a.duration));

        setAnalyticsHighlights(aggregatedHighlights);
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

        setAnalyticsHighlights({
            [userId]: highlights,
        });
        setAnalyticsPurposes({
            [userId]: purposes,
        });
        setAnalyticsSessions({
            [userId]: sessions,
        });
    };

    const handlePaperClick = (paperId: string) => {
        setSelectedPaper(paperId);
        setAnalyticsLevel(AnalyticsLevel.USERS);
    };

    const handleUserClick = (userId: string) => {
        setSelectedUser(userId);
        setAnalyticsLevel(AnalyticsLevel.PURPOSES);
    };

    const handleBreadcrumbClick = (level: string) => {
        setAnalyticsLevel(level);
        if (level === AnalyticsLevel.PAPERS) {
            setSelectedPaper(null);
            setSelectedUser(null);
        } else if (level === AnalyticsLevel.USERS) {
            setSelectedUser(null);
        }
    };

    return <AnalysisContext.Provider value={{ 
        selectedAnalyticsPapersId, 
        selectedAnalyticsUsersId, 
        togglePaperForAnalytics, 
        toggleUserForAnalytics,
        userPaperReadSessions,
        userPaperHighlights,
        userPaperPurposes,
        maxDuration,
        isLoadingData,
        analyticsLevel,
        selectedPaper,
        selectedUser,
        handlePaperClick,
        handleUserClick,
        handleBreadcrumbClick,
        totalTime,
        paperStats,
        userPaperStats,
        userPurposeStats,
        fetchData,
        analyticsHighlights,
        analyticsPurposes,
        analyticsSessions,
        reloadAnalytics,
    }}>{children}</AnalysisContext.Provider>;
}

export const useAnalysisContext = () => {
    const context = useContext(AnalysisContext);
    if (!context) {
        throw new Error("useAnalysisContext must be used within an AnalysisProvider");
    }
    return context;
}