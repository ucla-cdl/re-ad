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
  Icon
} from "@mui/material";
import { FormControlLabel } from "@mui/material";
import { Add, Analytics, Close, Timeline as TimelineIcon, TipsAndUpdates } from "@mui/icons-material";
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
  const [title, setTitle] = useState<string | null>("");
  const [color, setColor] = useState<string | null>(null);
  const [isAddingNewRead, setIsAddingNewRead] = useState(false);
  const [isGeneratingReadingGoals, setIsGeneratingReadingGoals] = useState(false);
  const [readingGoals, setReadingGoals] = useState<ReadingGoal[]>([]);
  const [openColorPicker, setOpenColorPicker] = useState(false);

  const handleCreatingNewRead = async () => {
    setIsAddingNewRead(true);
    setIsGeneratingReadingGoals(true);
    const readingGoals = await generateReadingGoals();
    setReadingGoals(readingGoals);
    setIsGeneratingReadingGoals(false);
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

      <Box className="highlights" sx={{ mx: 2 }}>
        {Object.values(readRecords).length > 0 &&
          Object.values(readRecords).map((readRecord) => (
            <Box
              className="read"
              key={readRecord.id}
              sx={{ borderBottom: currentReadId === readRecord.id ? `2px solid ${readRecord.color}` : "none" }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    onChange={() => {
                      if (displayedReads.includes(readRecord.id)) {
                        hideRead(readRecord.id);
                      } else {
                        showRead(readRecord.id);
                      }
                    }}
                    sx={{
                      color: readRecord.color,
                      "&.Mui-checked": {
                        color: readRecord.color,
                      },
                    }}
                    checked={displayedReads.includes(readRecord.id)}
                    disabled={currentReadId === readRecord.id}
                  />
                }
                label={readRecord.title}
              />
            </Box>
          ))
        }

        {Object.values(readRecords).length > 0 ? (
          <IconButton onClick={handleCreatingNewRead}>
            <Add />
          </IconButton>
        ) : (
          <Button className="mui-button add-new-read-btn" size="small" variant="text" startIcon={<Add />} onClick={handleCreatingNewRead}>
            <span style={{ lineHeight: 0 }}>
              new read
            </span>
          </Button>
        )}
      </Box>
      <Box className="active-read" sx={{ mx: 3, display: "flex", flexDirection: "row", alignItems: "center", gap: 1 }}>
        <h4>active read:</h4>
        {Object.values(readRecords).length > 0 ? (
          <div>
            <FormControl size="small" fullWidth>
              <Select
                value={currentReadId}
                onChange={(e) => setCurrentReadId(e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: readRecords[currentReadId]?.color,
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: readRecords[currentReadId]?.color,
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: readRecords[currentReadId]?.color,
                  },
                }}
              >
                {Object.values(readRecords).map((record) => (
                  <MenuItem key={record.id} value={record.id}>
                    {record.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
        ) : (
          <div>
            <p>none</p>
          </div>
        )}
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

          {isGeneratingReadingGoals ? (
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
            <Box sx={{ my: 2, display: "flex", flexDirection: "column", alignItems: "flex-start", width: "100%", gap: 1 }}>
              <Typography variant="body1" sx={{ fontWeight: "bold" }}>Suggested Reading Goals:</Typography>
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
                {readingGoals.map((goal) => (
                  <Tooltip title={goal.goalDescription} key={goal.goalName}>
                    <Chip label={goal.goalName} variant="outlined" onClick={() => setTitle(goal.goalName)} />
                  </Tooltip>
                ))}
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
                  <Add />
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
