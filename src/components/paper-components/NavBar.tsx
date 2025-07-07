import { useContext, useState } from "react";
import "../../styles/NavBar.css";
import { ReadingGoal, usePaperContext } from "../../contexts/PaperContext";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Chip,
  Typography,
  Menu,
  ListItemIcon,
  ListItemText
} from "@mui/material";
import { FormControlLabel } from "@mui/material";
import { AddCircleOutline, Analytics, Close, Timeline as TimelineIcon, TipsAndUpdates, KeyboardArrowDown } from "@mui/icons-material";
import logo from "/re-ad-logo.svg";
import { TourContext } from "../../contexts/TourContext";
import { useNavigate } from "react-router-dom";
import { ChromePicker } from 'react-color';

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
  const { readRecords, currentReadId, setCurrentReadId, displayedReads, hideRead, showRead, createRead, generateReadingGoals } = usePaperContext();
  const navigate = useNavigate();
  const tourContext = useContext(TourContext);
  if (!tourContext) {
    throw new Error("TourContext not found");
  }
  const { setRunTour } = tourContext;
  const [title, setTitle] = useState<string>("");
  const [color, setColor] = useState<string | null>(null);
  const [isAddingNewRead, setIsAddingNewRead] = useState(false);
  const [isGeneratingReadingSuggestions, setIsGeneratingReadingSuggestions] = useState(false);
  const [readingProgress, setReadingProgress] = useState<string>("");
  const [readingGoals, setReadingGoals] = useState<ReadingGoal[]>([]);
  const [openColorPicker, setOpenColorPicker] = useState(false);
  const [readsMenuAnchor, setReadsMenuAnchor] = useState<null | HTMLElement>(null);

  const handleCreatingNewRead = async () => {
    setIsAddingNewRead(true);
    setIsGeneratingReadingSuggestions(true);
    const readingSuggestion = await generateReadingGoals();
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
        {Object.values(readRecords).length > 0 ?
          (
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              {currentReadId ? (
                <Button
                  variant="outlined"
                  endIcon={<KeyboardArrowDown />}
                  onClick={(event) => setReadsMenuAnchor(event.currentTarget)}
                  className="nav-read-btn"
                  sx={{
                    borderColor: readRecords[currentReadId]?.color || "#ccc",
                    "&:hover": {
                      borderColor: readRecords[currentReadId]?.color || "#ccc",
                      backgroundColor: `${readRecords[currentReadId]?.color}20` || "#f5f5f5",
                    },
                  }}
                >
                  {readRecords[currentReadId]?.title}
                </Button>
              ) : (
                <Button
                  variant="outlined"
                  endIcon={<KeyboardArrowDown />}
                  onClick={(event) => setReadsMenuAnchor(event.currentTarget)}
                  className="nav-read-btn"
                  sx={{
                    borderColor: readRecords[currentReadId]?.color || "#ccc",
                    "&:hover": {
                      borderColor: readRecords[currentReadId]?.color || "#ccc",
                      backgroundColor: `${readRecords[currentReadId]?.color}20` || "#f5f5f5",
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
                {Object.values(readRecords).map((readRecord) => (
                  <MenuItem
                    key={readRecord.id}
                    onClick={() => handleSwitchRead(readRecord.id)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 2,
                      backgroundColor: currentReadId === readRecord.id ? `${readRecord.color}20` : "transparent",
                      "&:hover": {
                        backgroundColor: `${readRecord.color}30`,
                      }
                    }}
                  >
                    <ListItemIcon>
                      <Checkbox
                        checked={displayedReads.includes(readRecord.id)}
                        disabled={currentReadId === readRecord.id}
                        onClick={(event) => handleToggleReadVisibility(readRecord.id, event)}
                        sx={{
                          color: readRecord.color,
                          "&.Mui-checked": {
                            color: readRecord.color,
                          },
                          "&.Mui-disabled": {
                            color: readRecord.color,
                          }
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText
                      primary={readRecord.title}
                      sx={{
                        "& .MuiListItemText-primary": {
                          fontWeight: currentReadId === readRecord.id ? "bold" : "normal"
                        }
                      }}
                    />
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        backgroundColor: readRecord.color,
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
                  {readingGoals.map((goal) => (
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
    </div>
  );
}
