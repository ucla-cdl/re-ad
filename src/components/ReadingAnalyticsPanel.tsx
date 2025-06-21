import { useEffect, useState } from 'react';
import { usePaperContext } from '../contexts/PaperContext';
import { useReadingAnalyticsContext } from '../contexts/ReadingAnalyticsContext';
import { Box, Typography, Paper } from '@mui/material';

const formatTime = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
};

type ReadStats = {
  readId: string;
  readTitle: string;
  duration: number;
  highlightCount: number;
  imageHighlightCount: number;
  textHighlightCount: number;
  lastReadTime: number;
}

function ReadingAnalyticsPanel() {
  const { highlights, readRecords } = usePaperContext();
  const { readingSessions } = useReadingAnalyticsContext();

  const [totalTime, setTotalTime] = useState(0);
  const [readStats, setReadStats] = useState<ReadStats[]>([]);

  useEffect(() => {
    setTotalTime(Object.values(readingSessions).reduce((acc, session) => acc + session.duration, 0));
    // Group by categoryId and sum the durations
    const categoryDurations = Object.values(readingSessions).reduce((acc, session) => {
      acc[session.categoryId] = (acc[session.categoryId] || 0) + session.duration;
      return acc;
    }, {} as Record<string, number>);

    const readStats = Object.entries(categoryDurations).map(([readId, duration]) => {
      const lastSession = Object.values(readingSessions).filter(session => session?.categoryId === readId).sort((a, b) => b.startTime - a.startTime)[0];
      const lastReadTime = lastSession ? lastSession.startTime + lastSession.duration : 0;

      return ({
        readId: readId,
        readTitle: readRecords[readId].title,
        duration: duration,
        highlightCount: highlights.filter(highlight => highlight.readRecordId === readId).length,
        imageHighlightCount: highlights.filter(highlight => highlight.readRecordId === readId && highlight.type === 'area').length,
        textHighlightCount: highlights.filter(highlight => highlight.readRecordId === readId && highlight.type === 'text').length,
        lastReadTime: lastReadTime
      })
    });

    readStats.sort((a, b) => b.duration - a.duration);
    setReadStats(readStats);
  }, [readingSessions]);

  return (
    <Box sx={{ p: 2.5, bgcolor: 'white', borderRadius: 1, boxShadow: 1 }}>
      <Typography variant="h4" sx={{ mb: 2.5, color: 'text.primary' }}>
        Reading Analytics
      </Typography>

      <Box sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 2.5,
        mb: 3.75
      }}>
        <Paper sx={{ p: 2, bgcolor: 'black', color: 'white' }}>
          <Typography variant="h6" sx={{ mb: 1.25, color: 'white' }}>
            Total Reading Time
          </Typography>
          <Typography variant="h5" sx={{ color: 'white' }}>
            {formatTime(totalTime)}
          </Typography>
        </Paper>
      </Box>

      <Box sx={{ mt: 3.75 }}>
        <Typography variant="h5" sx={{ mb: 2, color: 'text.secondary' }}>
          Read Breakdown
        </Typography>
        {readStats.map((readStat) => {
          return (
            <Paper
              key={readStat.readId}
              sx={{
                p: 2,
                mb: 2,
                bgcolor: 'black',
                color: 'white',
                '&:last-child': { mb: 0 }
              }}
            >
              <Typography variant="h6" sx={{ mb: 1.25, color: 'white' }}>
                {readStat.readTitle}
              </Typography>
              <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none' }}>
                <Box component="li" sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  mb: 0.625,
                  color: 'white'
                }}>
                  Total Time: {formatTime(readStat.duration)}
                </Box>
                <Box component="li" sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  mb: 0.625,
                  color: 'white'
                }}>
                  Highlights: {readStat.highlightCount}
                </Box>
                <Box component="li" sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  mb: 0.625,
                  color: 'white'
                }}>
                  Image Highlights: {readStat.imageHighlightCount}
                </Box>
                <Box component="li" sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  mb: 0.625,
                  color: 'white'
                }}>
                  Text Highlights: {readStat.textHighlightCount}
                </Box>
                <Box component="li" sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  color: 'white'
                }}>
                  Last Read: {new Date(readStat.lastReadTime).toLocaleString()}
                </Box>
              </Box>
            </Paper>
          );
        })}
      </Box>
    </Box>
  );
};

export default ReadingAnalyticsPanel;