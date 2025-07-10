import NavBar from "../components/paper-components/NavBar";
import PaperPanel from "./PaperPanel";
import GraphPanel from "./GraphPanel";
import { Box, IconButton } from "@mui/material";
import "../styles/PaperReader.css";
import { useContext, useState } from "react";
import Joyride, { ACTIONS, CallBackProps, EVENTS, STATUS } from "react-joyride";
import { TourContext } from "../contexts/TourContext";
import Split from 'react-split';
import { AnalysisPanel } from "./AnalysisPanel";
import { PaperSelector } from "../components/paper-components/PaperSelector";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { MODE_TYPES, useWorkspaceContext } from "../contexts/WorkspaceContext";

export const PaperReader = () => {
  const { mode } = useWorkspaceContext();

  // Paper selector visibility state
  const [paperSelectorVisible, setPaperSelectorVisible] = useState(true);

  const tourContext = useContext(TourContext);
  if (!tourContext) {
    throw new Error("TourContext not found");
  }
  const { setRunTour, runTour, steps, stepIndex, setStepIndex } = tourContext;

  const togglePaperSelector = () => {
    setPaperSelectorVisible(prev => !prev);
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
        <NavBar />
      </Box>
      <Box sx={{ width: "100%", height: "92%", position: "relative", display: "flex", flexDirection: "row" }}>
        {/* Toggle button for paper selector */}
        <IconButton
          onClick={togglePaperSelector}
          sx={{
            position: "absolute",
            top: "50%",
            left: paperSelectorVisible ? "15%" : "0%",
            transform: "translateY(-50%)",
            zIndex: 1000,
            backgroundColor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: "0 8px 8px 0",
            borderLeft: paperSelectorVisible ? "1px solid" : "none",
            "&:hover": {
              backgroundColor: "action.hover",
            },
            width: 25,
            height: 60,
            transition: "left 0.3s ease"
          }}
        >
          {paperSelectorVisible ? <ChevronLeft /> : <ChevronRight />}
        </IconButton>

        <Box className="panel paper-selector-panel" sx={{ width: paperSelectorVisible ? "15%" : "0%" }}>
          <PaperSelector />
        </Box>

        <Split
          className="split"
          style={{ width: paperSelectorVisible ? "85%" : "100%" }}
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
            {mode === MODE_TYPES.READING && <GraphPanel />}
            {mode === MODE_TYPES.ANALYZING && <AnalysisPanel />}
          </Box>
        </Split>
      </Box>
    </Box>
  );
};
