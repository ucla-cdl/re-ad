import NavBar from "../components/paper-components/NavBar";
import PaperPanel from "./PaperPanel";
import GraphPanel from "./GraphPanel";
import ReadingAnalyticsPanel from "../components/ReadingAnalyticsPanel";
import { HighlightTimeline } from '../components/HighlightTimeline';
import { Box } from "@mui/material";
import "../styles/PaperReader.css";
import { usePaperContext } from "../contexts/PaperContext";
import { useContext, useState, useEffect } from "react";
import Joyride, { ACTIONS, CallBackProps, EVENTS, STATUS } from "react-joyride";
import { TourContext } from "../contexts/TourContext";
import { useLocation } from "react-router-dom";
import Split from 'react-split';
import { UserRole, useStorageContext } from "../contexts/StorageContext";
import { MultiAnalysisPanel } from "../components/MultiAnalysisPanel";

export const PaperReader = () => {
  const { userData, getPaperFile } = useStorageContext();
  const { setPaperUrl, setPaperId } = usePaperContext();
  const location = useLocation();

  const tourContext = useContext(TourContext);
  if (!tourContext) {
    throw new Error("TourContext not found");
  }
  const { setRunTour, runTour, steps, stepIndex, setStepIndex } = tourContext;

  const [viewType, setViewType] = useState<'graph' | 'analytics' | 'timeline'>('graph');

  // When leaving the page, setPaperId to null
  useEffect(() => {
    return () => {
      setPaperId(null);
    }
  }, []);

  // Handle paper URL from navigation state
  useEffect(() => {
    fetchPaperFile();
  }, [location.state]);

  const fetchPaperFile = async () => {
    const state = location.state as { paperId?: string };
    if (state?.paperId) {
      setPaperId(state.paperId);
      const fileUrl = await getPaperFile(state.paperId);
      setPaperUrl(fileUrl);
    }
  }

  const handleTourCallback = (data: CallBackProps) => {
    const { action, index, status, type, step } = data;

    if ([EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND].includes(type as any)) {
      setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
      if (step.data?.pause) {
        setRunTour(false);
      }
    } else if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      setStepIndex(0);
      setRunTour(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", width: "100vw", height: "100vh" }}>
      <div style={{ display: "none" }}>
        <Joyride
          continuous={true}
          steps={steps}
          run={runTour}
          callback={handleTourCallback}
          hideCloseButton={true}
          disableOverlayClose={true}
          stepIndex={stepIndex}
        />
      </div>
      <Box sx={{ height: "8%", width: "100%", display: "flex" }}>
        <NavBar 
          onAnalyticsClick={() => setViewType(viewType === 'analytics' ? 'graph' : 'analytics')}
          onTimelineClick={() => setViewType(viewType === 'timeline' ? 'graph' : 'timeline')}
        />
      </Box>
      <Box sx={{ width: "100%", height: "92%" }}>
        <Split
          className="split"
          sizes={[60, 40]}
          minSize={200}
          expandToMin={false}
          gutterSize={10}
          gutterAlign="center"
          snapOffset={30}
          dragInterval={1}
          direction="horizontal"
          cursor="col-resize"
        >
          <Box className="panel paper-panel">
            <PaperPanel />
          </Box>
          <Box className="panel graph-panel">
            {viewType === 'graph' && <GraphPanel />}
            {viewType === 'analytics' && <ReadingAnalyticsPanel />}
            {viewType === 'timeline' && userData?.role === UserRole.STUDENT && <HighlightTimeline />}
            {viewType === 'timeline' && userData?.role === UserRole.TEACHER && <MultiAnalysisPanel />}
          </Box>
        </Split>
      </Box>
    </Box>
  );
};
