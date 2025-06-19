import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { PaperContext } from './PaperContext';
import { ReadHighlight } from '../components/paper-components/HighlightContainer';

// Types for our analytics
interface ReadingSession {
  categoryId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

interface CategoryAnalytics {
  categoryId: string;
  totalTimeSpent: number; // in milliseconds
  highlightCount: number;
  imageHighlightCount: number;
  textHighlightCount: number;
  lastRead: Date;
}

interface ReadingAnalytics {
  categories: Record<string, CategoryAnalytics>;
  currentSession: ReadingSession | null;
  totalReadingTime: number;
  lastUpdated: Date;
}

interface ReadingAnalyticsContextType {
  analytics: ReadingAnalytics;
  startReading: (categoryId: string) => void;
  stopReading: () => void;
  getCategoryStats: (categoryId: string) => CategoryAnalytics | undefined;
  getTotalReadingTime: () => number;
  getMostReadCategory: () => string | null;
  resetAnalytics: () => void;
}

const ReadingAnalyticsContext = createContext<ReadingAnalyticsContextType | undefined>(undefined);

const initialAnalytics: ReadingAnalytics = {
  categories: {},
  currentSession: null,
  totalReadingTime: 0,
  lastUpdated: new Date(),
};

export const ReadingAnalyticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get context data from PaperContext
  const paperContext = useContext(PaperContext);
  if (!paperContext) {
    throw new Error("PaperContext not found");
  }
  const { currentRead, highlights } = paperContext;
  const highlightsRef = useRef<ReadHighlight[]>(highlights);

  useEffect(() => {
    highlightsRef.current = highlights;
  }, [highlights]);

  const [analytics, setAnalytics] = useState<ReadingAnalytics>(() => {
    const saved = sessionStorage.getItem('readingAnalytics');
    return saved ? JSON.parse(saved) : initialAnalytics;
  });

  const UPDATE_INTERVAL = 1000;
  const updateIntervalRef = useRef<number | null>(null);
  const previousSessionRef = useRef<ReadingSession | null>(null);

  // Save analytics to sessionStorage whenever it changes
  useEffect(() => {
    sessionStorage.setItem('readingAnalytics', JSON.stringify(analytics));
  }, [analytics]);

  // Start a new reading session
  const startReading = (categoryId: string) => {
    console.log('Starting reading session', categoryId);
    setAnalytics(prev => ({
      ...prev,
      currentSession: {
        categoryId,
        startTime: Date.now(),
      },
      lastUpdated: new Date(),
    }));
  };

  // Stop the current reading session
  const stopReading = () => {
    console.log('Stopping reading session');
    setAnalytics(prev => ({
      ...prev,
      currentSession: null,
    }));
  };

  // Update the reading analytics
  const updateReadingAnalytics = () => {
    if (!analytics.currentSession) return;

    const { categoryId } = analytics.currentSession;

    setAnalytics(prev => {
      const category = prev.categories[categoryId] || {
        categoryId,
        totalTimeSpent: 0,
        highlightCount: 0,
        imageHighlightCount: 0,
        textHighlightCount: 0,
        lastRead: new Date(),
      };

      const categoryHighlights = highlightsRef.current.filter(h => h.readRecordId === categoryId);
      const updatedCategory = {
        ...category,
        totalTimeSpent: category.totalTimeSpent + UPDATE_INTERVAL,
        highlightCount: categoryHighlights.length,
        imageHighlightCount: categoryHighlights.filter(h => h.type === 'area').length,
        textHighlightCount: categoryHighlights.filter(h => h.type === 'text').length,
        lastRead: new Date(),
      };

      return {
        ...prev,
        categories: {
          ...prev.categories,
          [categoryId]: updatedCategory,
        },
        totalReadingTime: prev.totalReadingTime + UPDATE_INTERVAL,
        lastUpdated: new Date(),
      };
    });
  }

  const getCategoryStats = (categoryId: string) => {
    return analytics.categories[categoryId];
  };

  const getTotalReadingTime = () => analytics.totalReadingTime;

  const getMostReadCategory = () => {
    const categories = Object.values(analytics.categories);
    if (categories.length === 0) return null;

    return categories.reduce((max, current) =>
      current.totalTimeSpent > (max?.totalTimeSpent || 0) ? current : max
    ).categoryId;
  };

  const resetAnalytics = () => {
    setAnalytics(initialAnalytics);
    sessionStorage.removeItem('readingAnalytics');
  };

  // Start tracking new reading session when currentRead changes
  useEffect(() => {
    if (currentRead) {
      startReading(currentRead.id);
    }
  }, [currentRead]);

  // Update reading analytics every second
  useEffect(() => {
    if (!analytics.currentSession) {
      console.log('No current session: Stopping update interval');
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
      return;
    }

    console.log('Starting update interval: ', analytics.currentSession);
    updateIntervalRef.current = setInterval(() => {
      updateReadingAnalytics();
    }, UPDATE_INTERVAL);

    return () => {
      console.log('Clearing current update interval');
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
    };
  }, [analytics.currentSession]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && analytics.currentSession) {
        // Store the current session before stopping
        previousSessionRef.current = analytics.currentSession;
        stopReading();
        console.log('Visibility change: Stopped reading session', analytics.currentSession);
      } else if (!document.hidden && previousSessionRef.current) {
        // Resume the previous session when page becomes visible
        startReading(previousSessionRef.current.categoryId);
        previousSessionRef.current = null;
        console.log('Visibility change: Resumed reading session', previousSessionRef.current);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [analytics.currentSession]);

  // Reset analytics when the page is refreshed
  useEffect(() => {
    const handleBeforeUnload = () => {
      console.log('Page Reloaded: Resetting analytics');
      resetAnalytics();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return (
    <ReadingAnalyticsContext.Provider
      value={{
        analytics,
        startReading,
        stopReading,
        getCategoryStats,
        getTotalReadingTime,
        getMostReadCategory,
        resetAnalytics,
      }}
    >
      {children}
    </ReadingAnalyticsContext.Provider>
  );
};

export const useReadingAnalytics = () => {
  const context = useContext(ReadingAnalyticsContext);
  if (context === undefined) {
    throw new Error('useReadingAnalytics must be used within a ReadingAnalyticsProvider');
  }
  return context;
}; 