import { useState } from "react";
import "../../styles/NavBar.css";
import { ReadGoal, usePaperContext } from "../../contexts/PaperContext";
import { useTourContext } from "../../contexts/TourContext";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  TextField,
  Tooltip,
  Chip,
  Typography,
  Menu,
  ListItemIcon,
  ListItemText,
  Backdrop,
  CircularProgress
} from "@mui/material";
import { AddCircleOutline, Analytics, Close, Timeline as TimelineIcon, TipsAndUpdates, KeyboardArrowDown, Save } from "@mui/icons-material";
import logo from "/re-ad-logo.svg";
import { useNavigate } from "react-router-dom";
import { ChromePicker } from 'react-color'; 
import { Canvas, useStorageContext } from "../../contexts/StorageContext";
import { v4 as uuidv4 } from 'uuid';
import { useReadingAnalyticsContext } from "../../contexts/ReadingAnalyticsContext";

interface NavBarProps {
  onAnalyticsClick: () => void;
  onTimelineClick: () => void;
}

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

export default function NavBar({ onAnalyticsClick, onTimelineClick }: NavBarProps) {
  const { createCanvas, batchAddPurposes, batchAddHighlights, batchAddSessions, userData } = useStorageContext();
  const { readPurposes, currentReadId, setCurrentReadId, displayedReads, hideRead, showRead, createRead, generateReadingGoals, paperId, nodes, edges, highlights } = usePaperContext();
  const { readSessions } = useReadingAnalyticsContext();
  
  const { setRunTour } = useTourContext();
  const navigate = useNavigate();

  const [title, setTitle] = useState<string>("");
  const [color, setColor] = useState<string | null>(null);
  const [isAddingNewRead, setIsAddingNewRead] = useState(false);
  const [isGeneratingReadingSuggestions, setIsGeneratingReadingSuggestions] = useState(false);
  const [readingProgress, setReadingProgress] = useState<string>("");
  const [readingGoals, setReadingGoals] = useState<ReadGoal[] | null>(null);
  const [openColorPicker, setOpenColorPicker] = useState(false);
  const [readsMenuAnchor, setReadsMenuAnchor] = useState<null | HTMLElement>(null);
  
  // Save state management
  const [saving, setSaving] = useState(false);

  const handleCreatingNewRead = async () => {
    setIsAddingNewRead(true);
    setIsGeneratingReadingSuggestions(true);
    const readingSuggestion = await generateReadingGoals();
    if (!readingSuggestion) {
      setIsGeneratingReadingSuggestions(false);
      return;
    }
    setReadingProgress(readingSuggestion.readingProgress);
    setReadingGoals(readingSuggestion.readingGoals);
    setIsGeneratingReadingSuggestions(false);
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
    setOpenColorPicker(false);
  };

  const handleStartTour = () => {
    setRunTour(true);
  };

  const handleCloseReadsMenu = () => {
    setReadsMenuAnchor(null);
  };

  const handleToggleReadVisibility = (readId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent menu item click
    if (displayedReads.includes(readId)) {
      hideRead(readId);
    } else {
      showRead(readId);
    }
  };

  const handleSwitchRead = (readId: string) => {
    setCurrentReadId(readId);
    handleCloseReadsMenu();
  };

  const handleSave = async () => {
    if (!userData) {
      alert("Please login to save your work");
      return;
    }

    if (saving) return; // Prevent multiple saves

    setSaving(true);

    try {
      const purposes = Object.values(readPurposes);
      await batchAddPurposes(purposes);
      await batchAddHighlights(highlights);
      await batchAddSessions(Object.values(readSessions));

      const canvas = {
        id: uuidv4(),
        userId: userData.id,
        paperId: paperId,
        reactFlowJson: JSON.stringify({
          nodes: nodes,
          edges: edges,
        }),
      }
      await createCanvas(canvas as Canvas);
      
    } catch (error: any) {
      console.error('Error saving data:', error);
      alert('Failed to save data. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="NavBar">
      <div className="logo-text">
        <img src={logo} height={40} alt="re:ad" style={{ cursor: "pointer" }} onClick={() => {
          navigate("/papers");
        }} />
        <IconButton sx={{ ml: 3 }} className="mui-button" size="small" onClick={handleStartTour}>
          <TipsAndUpdates />
        </IconButton>
      </div>

      {/* Combined Read Dropdown */}
      <Box className="reads-dropdown">
        {Object.values(readPurposes).length > 0 ?
          (
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              {currentReadId ? (
                <Button
                  variant="outlined"
                  endIcon={<KeyboardArrowDown />}
                  onClick={(event) => setReadsMenuAnchor(event.currentTarget)}
                  className="nav-read-btn"
                  sx={{
                    borderColor: readPurposes[currentReadId]?.color || "#ccc",
                    "&:hover": {
                      borderColor: readPurposes[currentReadId]?.color || "#ccc",
                      backgroundColor: `${readPurposes[currentReadId]?.color}20` || "#f5f5f5",
                    },
                  }}
                >
                  {readPurposes[currentReadId]?.title}
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  endIcon={<KeyboardArrowDown />}
                  onClick={(event) => setReadsMenuAnchor(event.currentTarget)}
                  className="nav-read-btn"
                  sx={{
                    borderColor: readPurposes[currentReadId]?.color || "#ccc",
                    "&:hover": {
                      borderColor: readPurposes[currentReadId]?.color || "#ccc",
                      backgroundColor: `${readPurposes[currentReadId]?.color}20` || "#f5f5f5",
                    }
                  }}
                >
                  Please select an active read
                </Button>
              )}
              <Menu
                anchorEl={readsMenuAnchor}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'center',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'center',
                }}
                open={Boolean(readsMenuAnchor)}
                onClose={handleCloseReadsMenu}
                sx={{
                  minWidth: "200px"
                }}
              >
                {Object.values(readPurposes).map((readPurpose) => (
                  <MenuItem
                    key={readPurpose.id}
                    onClick={() => handleSwitchRead(readPurpose.id)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 2,
                      backgroundColor: currentReadId === readPurpose.id ? `${readPurpose.color}20` : "transparent",
                      "&:hover": {
                        backgroundColor: `${readPurpose.color}30`,
                      }
                    }}
                  >
                    <ListItemIcon>
                      <Checkbox
                        checked={displayedReads.includes(readPurpose.id)}
                        disabled={currentReadId === readPurpose.id}
                        onClick={(event) => handleToggleReadVisibility(readPurpose.id, event)}
                        sx={{
                          color: readPurpose.color,
                          "&.Mui-checked": {
                            color: readPurpose.color,
                          },
                          "&.Mui-disabled": {
                            color: readPurpose.color,
                          }
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={readPurpose.title}
                      sx={{
                        "& .MuiListItemText-primary": {
                          fontWeight: currentReadId === readPurpose.id ? "bold" : "normal"
                        }
                      }}
                    />
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        backgroundColor: readPurpose.color,
                        borderRadius: "50%",
                        ml: 1
                      }}
                    />
                  </MenuItem>
                ))}
              </Menu>
              <IconButton onClick={handleCreatingNewRead} size="small">
                <AddCircleOutline />
              </IconButton>
            </Box>
          ) : (
            <Button
              className="mui-button add-new-read-btn"
              size="small"
              variant="outlined"
              startIcon={<AddCircleOutline />}
              onClick={handleCreatingNewRead}
              sx={{ textTransform: "none" }}
            >
              New Read
            </Button>
          )
        }
      </Box>

      <Box sx={{ mx: 2, display: 'flex', gap: 1 }}>
        <Tooltip title="Save all changes">
          <IconButton 
            onClick={handleSave}
            disabled={!userData}
          >
            <Save />
          </IconButton>
        </Tooltip>
        <Tooltip title="Reading Analytics">
          <IconButton onClick={onAnalyticsClick}>
            <Analytics />
          </IconButton>
        </Tooltip>
        <Tooltip title="Highlight Timeline">
          <IconButton onClick={onTimelineClick}>
            <TimelineIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Add new read dialog */}
      <Dialog open={isAddingNewRead}>
        <DialogTitle>Create New Read</DialogTitle>
        <DialogContent sx={{ minWidth: "20vw", p: 3, boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <TextField
            fullWidth
            multiline
            label="Title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            sx={{ my: 1 }}
          />

          {isGeneratingReadingSuggestions ? (
            <Box sx={{ my: 2, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <p style={{
                animation: "pulse 1.5s ease-in-out infinite",
                fontSize: "16px",
                color: "#666"
              }}>
                Generating reading goals...
              </p>
              <style>
                {`
                  @keyframes pulse {
                    0% { opacity: 0.4; }
                    50% { opacity: 1; }
                    100% { opacity: 0.4; }
                  }
                `}
              </style>
            </Box>
          ) : (
            <Box sx={{ my: 2, display: "flex", flexDirection: "column", alignItems: "flex-start", width: "100%", gap: 2 }}>
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", width: "100%", gap: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: "bold" }}>Reading Progress:</Typography>
                <Typography variant="body1">{readingProgress}</Typography>
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", width: "100%", gap: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: "bold" }}>Suggested Reading Goals:</Typography>
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
                  {readingGoals && readingGoals.map((goal) => (
                    <Tooltip title={goal.goalDescription} key={goal.goalName}>
                      <Chip label={goal.goalName} variant="outlined" onClick={() => setTitle(goal.goalName)} />
                    </Tooltip>
                  ))}
                </Box>
              </Box>
            </Box>
          )}

          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
            <Typography variant="body1" sx={{ fontWeight: "bold" }}>Color Palette:</Typography>
            <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", justifyItems: "flex-start", gap: 1 }}>
              {colorPalette.map((c) => (
                <Box
                  key={c}
                  sx={{
                    width: 20,
                    height: 20,
                    backgroundColor: c,
                    borderRadius: 4,
                    border: c === color ? "2px solid black" : "none"
                  }}
                  onClick={() => setColor(c)}
                />
              ))}
              {openColorPicker ? (
                <IconButton onClick={() => {
                  setOpenColorPicker(false);
                  setColor(null);
                }}>
                  <Close />
                </IconButton>
              ) : (
                <IconButton onClick={() => setOpenColorPicker(true)}>
                  <AddCircleOutline />
                </IconButton>
              )}
            </Box>
            {openColorPicker && (
              <ChromePicker
                disableAlpha={true}
                color={color ?? "#000000"}
                onChange={(color: any, event: any) => {
                  setColor(color.hex);
                  event.preventDefault();
                }}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="text" color="error" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="text" onClick={handleCreateRead}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Save Loading Backdrop */}
      <Backdrop
        sx={{ 
          color: '#fff', 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          flexDirection: 'column',
          gap: 2
        }}
        open={saving}
      >
        <CircularProgress color="inherit" />
        <Typography variant="h6">Saving your work...</Typography>
      </Backdrop>
    </div>
  );
}
