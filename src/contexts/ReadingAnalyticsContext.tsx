import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { usePaperContext } from './PaperContext';
import { v4 as uuidv4 } from 'uuid';
import { ReadSession, ReadHighlight, useStorageContext } from './StorageContext';

type ReadingAnalyticsContextData = {
  readSessions: Record<string, ReadSession>;
}

export const UPDATE_INTERVAL = 500;

const ReadingAnalyticsContext = createContext<ReadingAnalyticsContextData | undefined>(undefined);

export const ReadingAnalyticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userData, getSessionsByUsersAndPapers } = useStorageContext();
  const { currentReadId, highlights, pdfViewerRef, paperId, setCurrentSessionId } = usePaperContext();
  const highlightsRef = useRef<ReadHighlight[]>(highlights);

  useEffect(() => {
    highlightsRef.current = highlights;
  }, [highlights]);

  const [readSessions, setReadSessions] = useState<Record<string, ReadSession>>({});

  const updateIntervalRef = useRef<any>(null);
  const currentSessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    loadReadingState();
  }, [userData, paperId]);

  const resetReadingAnalyticsContext = () => {
    setReadSessions({});
    updateIntervalRef.current = null;
    currentSessionIdRef.current = null;
  }

  const loadReadingState = async () => {
    if (userData && paperId) {
      const sessionsByUserAndPaper = await getSessionsByUsersAndPapers([userData.id], [paperId]);
      if (sessionsByUserAndPaper) {
        const sessions = sessionsByUserAndPaper[`${userData.id}_${paperId}`] || [];
        setReadSessions(sessions.reduce((acc, session) => {
          acc[session.id] = session;
          return acc;
        }, {} as Record<string, ReadSession>));
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

    const scale = pdfViewerRef.current?.currentScale || 1;
    const normalizedScrollPosition = pdfViewerRef.current?.scroll.lastY / scale || 0;

    setReadSessions(prev => ({
      ...prev,
      [sessionId]: {
        id: sessionId,
        userId: userData!.id,
        paperId: paperId!,
        readPurposeId: readId,
        startTime: startTime,
        duration: 0,
        scrollSequence: [normalizedScrollPosition],
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

    setReadSessions(prev => ({
      ...prev,
      [sessionId]: {
        ...prev[sessionId],
        duration: timestamp - prev[sessionId].startTime,
        scrollSequence: [...prev[sessionId].scrollSequence, normalizedScrollPosition || 0],
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
        readSessions: readSessions,
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