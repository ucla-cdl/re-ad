import NavBar from "../components/paper-components/NavBar";
import PaperPanel from "./PaperPanel";
import GraphPanel from "./GraphPanel";
import ReadingAnalyticsPanel from "../components/ReadingAnalyticsPanel";
import { HighlightTimeline } from '../components/HighlightTimeline';
import { Box, DialogTitle, TextField, Dialog, DialogContent, Button, DialogActions } from "@mui/material";
import "../styles/PaperReader.css";
import { usePaperContext } from "../contexts/PaperContext";
import { useContext, useState, useEffect } from "react";
import Joyride, { ACTIONS, CallBackProps, EVENTS, STATUS } from "react-joyride";
import { TourContext } from "../contexts/TourContext";
import { useLocation } from "react-router-dom";
import Split from 'react-split';
import { useStorageContext } from "../contexts/StorageContext";

export const PaperReader = () => {
  const { getPaperFile } = useStorageContext();
  const { isAddingNewRead, setIsAddingNewRead, createRead, setPaperUrl, setPaperId } = usePaperContext();
  const location = useLocation();

  const tourContext = useContext(TourContext);
  if (!tourContext) {
    throw new Error("TourContext not found");
  }
  const { setRunTour, runTour, steps, stepIndex, setStepIndex } = tourContext;

  const [title, setTitle] = useState<string | null>("");
  const [color, setColor] = useState<string | null>(null);
  const [viewType, setViewType] = useState<'graph' | 'analytics' | 'timeline'>('graph');

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

  const handleCreateRead = () => {
    if (!title) {
      alert("Please enter a title");
      return;
    }

    if (!color) {
      alert("Please select a color");
      return;
    }

    createRead(title, color);
    handleCancel();
  };

  const handleCancel = () => {
    setTitle("");
    setColor(null);
    setIsAddingNewRead(false);
  };

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

  const colorPalette = [
    "#FFADAD",
    "#FFD6A5",
    "#FDFFB6",
    "#CAFFBF",
    "#9BF6FF",
    "#A0C4FF",
    "#BDB2FF",
    "#FFC6FF"
  ];

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
            {viewType === 'timeline' && <HighlightTimeline />}
          </Box>
        </Split>
      </Box>

      <Dialog open={isAddingNewRead}>
        <DialogTitle>Create New Read</DialogTitle>
        <DialogContent sx={{ p: 3, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <TextField
            label="Title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            style={{ padding: 4 }}
          />

          <Box sx={{ my: 2, display: "flex", flexDirection: "row", alignItems: "center" }}>
            {colorPalette.map((c) => (
              <Box
                key={c}
                sx={{
                  width: 20,
                  height: 20,
                  backgroundColor: c,
                  borderRadius: 4,
                  margin: 1,
                  border: c === color ? "2px solid black" : "none"
                }}
                onClick={() => setColor(c)}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button variant="text" color="error" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="text" onClick={handleCreateRead}>
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
