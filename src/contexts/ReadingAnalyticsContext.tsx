import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { usePaperContext } from './PaperContext';
import { ReadHighlight } from '../components/paper-components/HighlightContainer';
import { v4 as uuidv4 } from 'uuid';
import { ReadingState, useStorageContext } from './StorageContext';

/**
 * Reading Analytics:
 * - Reading Session: a single session of reading a paper within one reading goal
 * 
 * analytics:
 * - reading sessions (dictionary of categoryId to reading sessions)
 * - reading session:
 * -- categoryId: the category of the reading session
 * -- startTime: the start time of the reading session
 * -- endTime?: the end time of the reading session
 * -- scrollSequence: a list of (timestamp, scroll position) pairs
 */

// Types for our analytics
export type ReadingSession = {
  sessionId: string;
  readId: string;
  startTime: number;
  duration: number;
  scrollSequence: [number, number][];
}

type ReadingAnalyticsContextData = {
  readingSessions: Record<string, ReadingSession>;
  saveReadingState: () => void;
}

const ReadingAnalyticsContext = createContext<ReadingAnalyticsContextData | undefined>(undefined);

export const ReadingAnalyticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userData, updateReadingState, getReadingStateData } = useStorageContext();
  const { currentReadId, highlights, pdfViewerRef, paperId, nodes, edges, readRecords, setCurrentSessionId } = usePaperContext();
  const highlightsRef = useRef<ReadHighlight[]>(highlights);

  useEffect(() => {
    highlightsRef.current = highlights;
  }, [highlights]);

  const [readingSessions, setReadingSessions] = useState<Record<string, ReadingSession>>({});

  const UPDATE_INTERVAL = 500;
  const updateIntervalRef = useRef<any>(null);
  const currentSessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    loadReadingState();
  }, [userData, paperId]);

  const resetReadingAnalyticsContext = () => {
    setReadingSessions({});
    updateIntervalRef.current = null;
    currentSessionIdRef.current = null;
  }

  const loadReadingState = async () => {
    if (userData && paperId) {
      console.log("load reading analytics context", userData, paperId);
      const readingStateData = await getReadingStateData(userData.id, paperId);
      
      if (readingStateData) {
        setReadingSessions(readingStateData.state.readingSessions);
      } else {
        resetReadingAnalyticsContext();
      }
    }
  }

  // Create a new reading session
  const createNewReadingSession = (readId: string) => {
    console.log('Creating new reading session', readId);

    const sessionId = uuidv4();
    setCurrentSessionId(sessionId);

    const startTime = Date.now();

    setReadingSessions(prev => ({
      ...prev,
      [sessionId]: {
        sessionId: sessionId,
        readId: readId,
        startTime: startTime,
        duration: 0,
        // TODO: scroll position need to be stored as a normalized value, not depend on the scale of the pdf viewer
        scrollSequence: [[startTime, pdfViewerRef.current?.scroll.lastY || 0]],
      },
    }));

    return sessionId;
  };

  // Update the reading session
  const updateReadingSession = () => {
    if (!currentSessionIdRef.current || !pdfViewerRef.current) return;

    const sessionId = currentSessionIdRef.current;
    if (!sessionId) return;

    const timestamp = Date.now();
    const focusCenter = pdfViewerRef.current.container.clientHeight / 2;
    const normalizedScrollPosition = (pdfViewerRef.current.scroll.lastY + focusCenter) / pdfViewerRef.current.currentScale;
    
    setReadingSessions(prev => ({
      ...prev,
      [sessionId]: {
        ...prev[sessionId],
        duration: timestamp - prev[sessionId].startTime,
        scrollSequence: [
          ...prev[sessionId].scrollSequence, 
          [timestamp, normalizedScrollPosition || 0]
        ],
      },
    }));
  }

  // Start tracking new reading session when current read changes
  useEffect(() => {
    // Stop existing reading session
    stopUpdateReadingSession();

    if (currentReadId !== "") {
      // Start new reading session
      const sessionId = createNewReadingSession(currentReadId);
      currentSessionIdRef.current = sessionId;
      startUpdateReadingSession();
    }

    return () => {
      stopUpdateReadingSession();
    };
  }, [currentReadId]);

  // Stop updating the reading session
  const stopUpdateReadingSession = () => {
    console.log('Stopping current update interval');

    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
  };

  // Start updating the reading session every UPDATE_INTERVAL milliseconds
  const startUpdateReadingSession = () => {
    console.log('Starting update interval: ', currentSessionIdRef.current);

    updateIntervalRef.current = setInterval(() => {
      updateReadingSession();
    }, UPDATE_INTERVAL);
  };

  // Save the reading state to the database
  const saveReadingState = () => {
    if (!userData || !paperId || !currentReadId) return;
    
    const readingStateData: ReadingState = {
      id: `${userData.id}-${paperId}`,
      userId: userData.id,
      paperId: paperId,
      state: {
        highlights: highlightsRef.current,
        readRecords: readRecords,
        nodes: nodes,
        edges: edges,
        readingSessions: readingSessions,
      }
    }

    updateReadingState(readingStateData);
  }

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && currentSessionIdRef.current) {
        // Store the current session before stopping
        stopUpdateReadingSession();
        console.log('Visibility change: Hidden', currentSessionIdRef.current);
      } else if (!document.hidden && currentSessionIdRef.current) {
        // Resume the previous session when page becomes visible
        startUpdateReadingSession();
        console.log('Visibility change: Visible', currentSessionIdRef.current);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentSessionIdRef.current]);


  return (
    <ReadingAnalyticsContext.Provider
      value={{
        readingSessions,
        saveReadingState,
      }}
    >
      {children}
    </ReadingAnalyticsContext.Provider>
  );
};

export const useReadingAnalyticsContext = () => {
  const context = useContext(ReadingAnalyticsContext);
  if (context === undefined) {
    throw new Error('useReadingAnalytics must be used within a ReadingAnalyticsProvider');
  }

  return context;
}; 