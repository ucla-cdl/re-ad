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
  CircularProgress,
  Switch
} from "@mui/material";
import { AddCircleOutline, Close, TipsAndUpdates, KeyboardArrowDown, Save, MenuBook, Analytics, Edit, Settings, Lightbulb } from "@mui/icons-material";
import logo from "/re-ad-icon.svg";
import { useNavigate } from "react-router-dom";
import { ChromePicker } from 'react-color';
import { MODE_TYPES, useWorkspaceContext } from "../../contexts/WorkspaceContext";
import { useStorageContext } from "../../contexts/StorageContext";
import { useAnalysisContext } from "../../contexts/AnalysisContext";
import ProfilePanel from "../../containers/ProfilePanel";

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

export default function NavBar() {
  const { userData } = useStorageContext();
  const { mode, setMode, viewingPaperId } = useWorkspaceContext();
  const { readPurposes, currentReadId, setCurrentReadId, displayedReads, toggleRead, createRead, generateReadingGoals, saveReadingData, stopUpdateReadingSession, resetPaperContext, loadPaperContext } = usePaperContext();
  const { togglePaperForAnalytics, toggleUserForAnalytics, reloadAnalytics } = useAnalysisContext();
  const { setRunTour } = useTourContext();
  const navigate = useNavigate();

  const [title, setTitle] = useState<string>("");
  const [color, setColor] = useState<string | null>(null);
  const [openReadDialog, setOpenReadDialog] = useState(false);
  const [isGeneratingReadingSuggestions, setIsGeneratingReadingSuggestions] = useState(false);
  const [readingProgress, setReadingProgress] = useState<string>("");
  const [readingGoals, setReadingGoals] = useState<ReadGoal[] | null>(null);
  const [openColorPicker, setOpenColorPicker] = useState(false);
  const [readsMenuAnchor, setReadsMenuAnchor] = useState<null | HTMLElement>(null);

  const [isEditingRead, setIsEditingRead] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState<string>("");
  const [openProfileSettings, setOpenProfileSettings] = useState(false);
  const [aiSuggestionsExpanded, setAiSuggestionsExpanded] = useState(false);

  const handleCreatingNewRead = async () => {
    setOpenReadDialog(true);
  }

  const handleToggleAISuggestions = async () => {
    if (!aiSuggestionsExpanded) {
      // Expanding - query AI only if we don't have cached results
      setAiSuggestionsExpanded(true);

      if (!readingGoals && !isGeneratingReadingSuggestions) {
        setIsGeneratingReadingSuggestions(true);
        try {
          const readingSuggestion = await generateReadingGoals();
          if (readingSuggestion) {
            setReadingProgress(readingSuggestion.readingProgress);
            setReadingGoals(readingSuggestion.readingGoals);
          }
        } catch (error) {
          console.error('Error generating AI suggestions:', error);
        } finally {
          setIsGeneratingReadingSuggestions(false);
        }
      }
    } else {
      // Collapsing - just hide the content, keep cached data
      setAiSuggestionsExpanded(false);
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

    if (isEditingRead) {
      createRead(title, color, "", currentReadId);
    } else {
      createRead(title, color);
    }

    handleCancel();
  };

  const handleCancel = () => {
    setTitle("");
    setColor(null);
    setOpenReadDialog(false);
    setOpenColorPicker(false);
    setIsEditingRead(false);
    // Reset AI suggestions state for next time
    setAiSuggestionsExpanded(false);
    setIsGeneratingReadingSuggestions(false);
    setReadingProgress("");
    setReadingGoals(null);
  };

  const handleStartTour = () => {
    setRunTour(true);
  };

  const handleCloseReadsMenu = () => {
    setReadsMenuAnchor(null);
  };

  const handleToggleReadVisibility = (readId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent menu item click
    toggleRead(readId);
  };

  const handleSwitchRead = (readId: string) => {
    setCurrentReadId(readId);

    handleCloseReadsMenu();
  };

  const handleSwitchMode = async () => {
    setLoading(true);

    // current mode is reading => switch to analyzing
    if (mode === MODE_TYPES.READING) {
      setLoadingText("Saving your reading progress...");
      // stop update reading session and save reading data
      stopUpdateReadingSession();
      await saveReadingData();
      resetPaperContext();
      // load default analytics papers and users
      togglePaperForAnalytics(viewingPaperId!, true);
      toggleUserForAnalytics(userData!.id, true);
      setMode(MODE_TYPES.ANALYZING);
    }
    // current mode is analyzing => switch to reading
    else if (mode === MODE_TYPES.ANALYZING) {
      setLoadingText("Loading your reading progress...");
      reloadAnalytics();
      await loadPaperContext();
      setMode(MODE_TYPES.READING);
    }

    setLoading(false);
  }

  const onEditRead = () => {
    setTitle(readPurposes[currentReadId]?.title || "");
    setColor(readPurposes[currentReadId]?.color || null);
    setIsEditingRead(true);
    setOpenReadDialog(true);
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

      {/* Center Section - Different for each mode */}
      <Box className="reads-dropdown">
        {mode === 'reading' ? (
          // Reading mode: Show read management
          <>
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
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Tooltip title="Edit Read">
                      <IconButton onClick={onEditRead} size="small">
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Add New Read">
                      <IconButton onClick={handleCreatingNewRead} size="small">
                        <AddCircleOutline />
                      </IconButton>
                    </Tooltip>
                  </Box>
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
          </>
        ) : (
          // Analyzer mode: Show mode indicator
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 'medium' }}>
              Analysis Mode
            </Typography>
          </Box>
        )}
      </Box>

      <Box sx={{ mx: 2, display: 'flex', gap: 2, alignItems: "center", justifyContent: "flex-end" }}>
        {/* Mode Switch */}
        <Box className="nav-mode-switch">
          <MenuBook sx={{ boxSizing: "border-box", color: mode === "reading" ? "primary.main" : "text.secondary" }} />
          <Switch
            checked={mode === "analyzing"}
            onChange={handleSwitchMode}
            inputProps={{ 'aria-label': 'toggle mode' }}
            sx={{
              boxSizing: "border-box",
              '& .MuiSwitch-thumb': {
                backgroundColor: 'white',
              },
              '& .MuiSwitch-track': {
                backgroundColor: 'primary.main',
              },
            }}
          />
          <Analytics sx={{ boxSizing: "border-box", color: mode === "analyzing" ? "primary.main" : "text.secondary" }} />
        </Box>

        {/* Save Button */}
        {mode === 'reading' && (
          <IconButton
            onClick={saveReadingData}
            disabled={loading}
            size="small"
          >
            <Save fontSize="small" />
          </IconButton>
        )}

        {/* Profile Settings Button */}
        <IconButton
          onClick={() => setOpenProfileSettings(true)}
          size="small"
          sx={{ color: 'text.secondary' }}
        >
          <Settings fontSize="small" />
        </IconButton>
      </Box>

      {/* Add new read dialog - Only in reading mode */}
      {mode === 'reading' && (
        <Dialog open={openReadDialog}>
          <DialogTitle>{isEditingRead ? "Edit Read" : "Create New Read"}</DialogTitle>
          <DialogContent sx={{
            width: "35vw",
            display: "flex",
            boxSizing: "border-box !important",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 2,
            p: 3
          }}
          >
            <TextField
              sx={{ width: "80%", my: 1 }}
              multiline
              label="Title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />

            {/* AI Suggestions for the New Reading Purpose */}
            {!isEditingRead && (
              <Tooltip title={userData?.aiConfig?.enabled ?
                "See ReadFlect's evaluation on your reading progress and suggested reading goals" :
                "AI features are not enabled. Please enable it in your profile settings to see ReadFlect's evaluation on your reading progress and suggested reading goals."
              }>
                <Box>
                  <Button
                    variant={aiSuggestionsExpanded ? "contained" : "outlined"}
                    onClick={handleToggleAISuggestions}
                    disabled={!userData?.aiConfig?.enabled}
                    sx={{
                      borderRadius: 10,
                      alignSelf: 'flex-start',
                    }}
                    startIcon={<Lightbulb />}
                  >
                    {aiSuggestionsExpanded ? 'Hide ReadFlect Suggestions' : 'ReadFlect Suggestions'}
                  </Button>
                </Box>
              </Tooltip>
            )}

            {userData?.aiConfig?.enabled && aiSuggestionsExpanded && (
              <Box sx={{ mb: 1, p: 1, boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "flex-start", width: "100%" }}>
                {isGeneratingReadingSuggestions && (
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
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
                )}

                {readingGoals && !isGeneratingReadingSuggestions && (
                  <Box sx={{ boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "flex-start", width: "85%", gap: 2 }}>
                    <Box sx={{ boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "flex-start", width: "100%", gap: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: "bold" }}>Reading Progress:</Typography>
                      <Typography variant="body1">{readingProgress}</Typography>
                    </Box>
                    <Box sx={{ boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "flex-start", width: "100%", gap: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: "bold" }}>Suggested Reading Goals:</Typography>
                      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
                        {readingGoals.map((goal) => (
                          <Tooltip title={goal.goalDescription} key={goal.goalName} arrow placement="right">
                            <Chip label={goal.goalName} variant="outlined" onClick={() => setTitle(goal.goalName)} />
                          </Tooltip>
                        ))}
                      </Box>
                    </Box>
                  </Box>
                )}
              </Box>
            )}

            {/* Color Palette Picker for the New Reading Purpose */}
            <Box sx={{ boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1, p: 1 }}>
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
                  <IconButton
                    size="small"
                    onClick={() => {
                      setOpenColorPicker(false);
                      setColor(null);
                    }}
                  >
                    <Close />
                  </IconButton>
                ) : (
                  <IconButton
                    size="small"
                    onClick={() => setOpenColorPicker(true)}
                  >
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
              {isEditingRead ? "Save" : "Create"}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Save Loading Backdrop */}
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          flexDirection: 'column',
          gap: 2
        }}
        open={loading}
      >
        <CircularProgress color="inherit" />
        <Typography variant="h6">{loadingText}</Typography>
      </Backdrop>

      {/* Profile Settings Dialog */}
      <ProfilePanel
        open={openProfileSettings}
        onClose={() => setOpenProfileSettings(false)}
      />
    </div>
  );
}
