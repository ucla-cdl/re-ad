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
  const { highlights, readPurposes } = usePaperContext();
  const { readSessions } = useReadingAnalyticsContext();

  const [totalTime, setTotalTime] = useState(0);
  const [readStats, setReadStats] = useState<ReadStats[]>([]);

  useEffect(() => {
    setTotalTime(Object.values(readSessions).reduce((acc, session) => acc + session.duration, 0));
    processReadStats();
  }, [readSessions, highlights, readPurposes]);

  const processReadStats = () => {
    // Group by readRecordId and sum the durations
    const purposeDurations = Object.values(readSessions).reduce((acc, session) => {
      acc[session.readPurposeId] = (acc[session.readPurposeId] || 0) + session.duration;
      return acc;
    }, {} as Record<string, number>);

      const readStats = Object.entries(purposeDurations).map(([readPurposeId, duration]) => {
      const lastSession = Object.values(readSessions)
        .filter(session => session?.readPurposeId === readPurposeId)
        .sort((a, b) => b.startTime - a.startTime)[0];
      const lastReadTime = lastSession ? lastSession.startTime + lastSession.duration : 0;

      const purpose = readPurposes[readPurposeId];
      if (!purpose) {
        return null; // Skip if purpose doesn't exist
      }

      return ({
        readId: readPurposeId,
        readTitle: purpose.title,
        duration: duration,
        highlightCount: highlights.filter(highlight => highlight.readPurposeId === readPurposeId).length,
          imageHighlightCount: highlights.filter(highlight => highlight.readPurposeId === readPurposeId && highlight.type === 'area').length,
        textHighlightCount: highlights.filter(highlight => highlight.readPurposeId === readPurposeId && highlight.type === 'text').length,
        lastReadTime: lastReadTime
      });
    }).filter(stat => stat !== null) as ReadStats[];

    readStats.sort((a, b) => b.duration - a.duration);
    setReadStats(readStats);
  }

  return (
    <Box sx={{ p: 2, width: '100%', height: '100%', boxSizing: 'border-box', overflow: 'auto' }}>
      <Typography variant="h5" sx={{ mb: 2, color: 'text.secondary' }}>
        Reading Analytics
      </Typography>

      <Paper sx={{ p: 2, mb: 2, backgroundColor: 'background.default' }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Total Reading Time
        </Typography>
        <Typography variant="h4" color="primary">
          {formatTime(totalTime)}
        </Typography>
      </Paper>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {readStats.map((readStat) => {
          const percentage = totalTime > 0 ? ((readStat.duration / totalTime) * 100).toFixed(1) : '0';
          
          return (
            <Paper 
              key={readStat.readId} 
              sx={{ 
                p: 2, 
                backgroundColor: 'background.default',
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6" sx={{ color: 'text.primary' }}>
                  {readStat.readTitle}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {percentage}% of total time
                </Typography>
              </Box>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Reading Time
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                    {formatTime(readStat.duration)}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Highlights
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                    {readStat.highlightCount}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Text Highlights
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                    {readStat.textHighlightCount}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Image Highlights
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                    {readStat.imageHighlightCount}
                  </Typography>
                </Box>
              </Box>
              
              {readStat.lastReadTime > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Last Read: {new Date(readStat.lastReadTime).toLocaleString()}
                  </Typography>
                </Box>
              )}
            </Paper>
          );
        })}
      </Box>
    </Box>
  );
}

export default ReadingAnalyticsPanel;