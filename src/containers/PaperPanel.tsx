import { useEffect, useRef, useContext } from "react";
import { Box } from "@mui/material";
import "../styles/PaperPanel.css";
import {
  PdfHighlighter,
  PdfHighlighterUtils,
  PdfLoader,
} from "react-pdf-highlighter-extended";
import HighlightContainer from "../components/paper-components/HighlightContainer";
import { usePaperContext } from "../contexts/PaperContext";
import ExpandableTip from "../components/paper-components/ExpandableTip";
import { TourContext } from "../contexts/TourContext";

function PaperPanel() {
  const {
    paperUrl,
    highlights,
    addHighlight,
    selectedHighlightIds,
    setSelectedHighlightIds,
    currentReadId,
    readRecords,
    displayedReads,
    pdfViewerRef
  } = usePaperContext();

  const tourContext = useContext(TourContext);
  if (!tourContext) {
    throw new Error("TourContext not found");
  }
  // const { setRunTour } = tourContext;

  // Refs for PdfHighlighter utilities
  const highlighterUtilsRef = useRef<PdfHighlighterUtils>(null);

  useEffect(() => {
    if (selectedHighlightIds.length > 0) {
      scrollToHighlightOnSelect();
    }
  }, [selectedHighlightIds]);

  const scrollToHighlightOnSelect = () => {
    const latestHighlightId = selectedHighlightIds[selectedHighlightIds.length - 1];
    const highlight = highlights.find((highlight) => highlight.id === latestHighlightId);

    if (highlight && highlighterUtilsRef.current) {
      highlighterUtilsRef.current.scrollToHighlight(highlight);
    }
  };

  return (
    <Box style={{ width: "100%", height: "100%", display: "flex", flexDirection: "row" }}>
      {paperUrl &&
          <Box
            style={{
              height: "100%",
              width: "100%",
              position: "relative",
            }}
            className="pdf pdf-container"
          >
            <PdfLoader document={paperUrl}>
              {(pdfDocument) => (
                <PdfHighlighter
                  enableAreaSelection={(event) => event.altKey}
                  pdfDocument={pdfDocument}
                  utilsRef={(_pdfHighlighterUtils) => {
                    pdfViewerRef.current = _pdfHighlighterUtils.getViewer();
                    highlighterUtilsRef.current = _pdfHighlighterUtils;
                  }}
                  selectionTip={
                    Object.keys(readRecords).length > 0 && currentReadId !== "" ? (
                      <ExpandableTip addHighlight={addHighlight} />
                    ) : null
                  }
                  highlights={highlights}
                  textSelectionColor={readRecords[currentReadId]?.color}
                >
                  <HighlightContainer setSelectedHighlightIds={setSelectedHighlightIds} readRecords={readRecords} displayedReads={displayedReads} />
                </PdfHighlighter>
              )}
            </PdfLoader>
          </Box>
      }
    </Box>
  );
}

export default PaperPanel;