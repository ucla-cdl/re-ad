import { createContext, useContext, useState } from "react";

type AnalysisContextData = {
    selectedAnalyticsPapersId: string[];
    selectedAnalyticsUsersId: string[];
    togglePaperForAnalytics: (paperId: string) => void;
    toggleUserForAnalytics: (userId: string) => void;
}

const AnalysisContext = createContext<AnalysisContextData | undefined>(undefined);

export const AnalysisProvider = ({ children }: { children: React.ReactNode }) => {
    const [selectedAnalyticsPapersId, setSelectedAnalyticsPapersId] = useState<string[]>([]);
    const [selectedAnalyticsUsersId, setSelectedAnalyticsUsersId] = useState<string[]>([]);


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

    return <AnalysisContext.Provider value={{ 
        selectedAnalyticsPapersId, 
        selectedAnalyticsUsersId, 
        togglePaperForAnalytics, 
        toggleUserForAnalytics,
    }}>{children}</AnalysisContext.Provider>;
}

export const useAnalysisContext = () => {
    const context = useContext(AnalysisContext);
    if (!context) {
        throw new Error("useAnalysisContext must be used within an AnalysisProvider");
    }
    return context;
}