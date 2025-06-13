import React, { useState, useEffect, useRef, useContext } from "react";
import { Box, Button, Stack } from "@mui/material";
import "../styles/PaperPanel.css";
import {
  PdfHighlighter,
  PdfHighlighterUtils,
  PdfLoader,
} from "react-pdf-highlighter-extended";
import HighlightContainer from "../components/paper-components/HighlightContainer";
import Sidebar from "../components/paper-components/Sidebar";
import { PaperContext } from "../contexts/PaperContext";
import ExpandableTip from "../components/paper-components/ExpandableTip";
import { ArrowBack, UploadFile, CloudUpload } from "@mui/icons-material";
import { TourContext } from "../contexts/TourContext";
import { importGraph } from "../utils/graphIO";

function PaperPanel() {
  const paperContext = useContext(PaperContext);
  if (!paperContext) {
    throw new Error("PaperContext not found");
  }
  const {
    paperUrl,
    setPaperUrl,
    highlights,
    addHighlight,
    resetHighlights,
    selectedHighlightId,
    setSelectedHighlightId,
    currentReadId,
    readRecords,
    displayedReads,
    onSelectNode,
    setHighlights,
    setNodes,
    setEdges,
    setReadRecords
  } = paperContext;

  const tourContext = useContext(TourContext);
  if (!tourContext) {
    throw new Error("TourContext not found");
  }
  const { setRunTour } = tourContext;

  const [sideBarOpen, setSideBarOpen] = useState(false);

  // Refs for PdfHighlighter utilities
  const highlighterUtilsRef = useRef<PdfHighlighterUtils>(null);

  // Load default paper on component mount
  // useEffect(() => {
  //   if (!paperUrl) {
  //     loadDefaultPaper();
  //   }
  // }, []);

  // Scroll to highlight based on hash in the URL
  const scrollToHighlightOnSelect = () => {
    const highlight = getHighlightById(selectedHighlightId as string);

    if (highlight && highlighterUtilsRef.current) {
      console.log("sceroll to highlight", highlight);
      highlighterUtilsRef.current.scrollToHighlight(highlight);
    }
  };

  useEffect(() => {
    if (selectedHighlightId) {
      scrollToHighlightOnSelect();
    }
  }, [selectedHighlightId]);

  const getHighlightById = (id: string) => {
    return highlights.find((highlight) => highlight.id === id);
  };

  useEffect(() => {
    console.log("selectedHighlightId", selectedHighlightId);
  }, [selectedHighlightId]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPaperUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setRunTour(true)
    } else {
      alert("Please upload a valid PDF file.");
    }
  };

  const loadDefaultPaper = () => {
    fetch('/example-paper.pdf')
      .then(response => response.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPaperUrl(e.target?.result as string);
        };
        reader.readAsDataURL(blob);
        setRunTour(true);
      })
      .catch(error => {
        console.error("Error loading default paper:", error);
        alert("Failed to load the default paper.");
      });
  };

  const handleGraphUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importGraph(file, setGraphState, setPaperUrl);
    }
  };

  const setGraphState = (data: any) => {
    setHighlights(data.highlights || []);
    setNodes(data.nodes || []);
    setEdges(data.edges || []);
    setReadRecords(data.readRecords || {});
  };

  return (
    <Box style={{ width: "100%", height: "100%", display: "flex", flexDirection: "row" }}>
      {!paperUrl ?
        <Box sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}>
          {/* Hidden Inputs for File Uploads */}
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileUpload}
            style={{ display: "none" }}
            id="pdf-upload"
          />
          <input
            type="file"
            accept="application/zip"
            onChange={handleGraphUpload}
            style={{ display: "none" }}
            id="graph-upload"
          />

          {/* Buttons to Trigger File Uploads */}
          <Stack direction="row" spacing={2}>
            <label htmlFor="pdf-upload">
              <Button
                className="upload-pdf"
                variant="outlined"
                component="span"
                startIcon={<UploadFile />}
              >
                Upload PDF
              </Button>
            </label>
            <label htmlFor="graph-upload">
              <Button
                className="upload-graph"
                variant="outlined"
                component="span"
                startIcon={<CloudUpload />}
              >
                Upload Graph & PDF
              </Button>
            </label>
          </Stack>
        </Box>
        :
        <>
          {sideBarOpen && <Sidebar highlights={highlights} resetHighlights={resetHighlights} />}
          {sideBarOpen &&
            <Button
              className="side-bar-button"
              onClick={() => setSideBarOpen(false)}
            >
              <ArrowBack />
            </Button>
          }
          <div
            style={{
              height: "100%",
              width: sideBarOpen ? "calc(75%)" : "100%",
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
                    highlighterUtilsRef.current = _pdfHighlighterUtils;
                  }}
                  selectionTip={
                    Object.keys(readRecords).length > 0 ? (
                      <ExpandableTip addHighlight={addHighlight} />
                    ) : null
                  }
                  highlights={highlights}
                  textSelectionColor={readRecords[currentReadId]?.color}
                >
                  <HighlightContainer setSelectedHighlightId={setSelectedHighlightId} readRecords={readRecords} displayedReads={displayedReads} />
                </PdfHighlighter>
              )}
            </PdfLoader>
          </div>
        </>
      }
    </Box>
  );
}

export default PaperPanel;
