import { useState, useEffect } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
  Tabs,
  Tab,
  Box,
  Typography,
  Switch,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Alert,
  Divider,
  Chip
} from "@mui/material";
import { Visibility, VisibilityOff, Close } from "@mui/icons-material";
import { useStorageContext, UserData } from "../contexts/StorageContext";
import { READING_GOAL_GENERATE_PROMPT } from "../utils/prompts";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface ProfileSettingsProps {
  open: boolean;
  onClose: () => void;
}

export default function ProfilePanel({ open, onClose }: ProfileSettingsProps) {
  const { userData, updateUser } = useStorageContext();

  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Basic Profile Tab State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // AI Configuration Tab State
  const [aiEnabled, setAiEnabled] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [prompt, setPrompt] = useState("");

  useEffect(() => {
    if (userData) {
      // Load basic profile data
      setName(userData.name);
      setEmail(userData.email);

      // Load AI configuration
      setAiEnabled(userData.aiConfig?.enabled || false);
      setApiKey(userData.aiConfig?.apiKey || "");
      setPrompt(userData.aiConfig?.customPrompt || READING_GOAL_GENERATE_PROMPT);
    }
  }, [userData]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setError("");
    setSuccess("");
  };

  const validateBasicProfile = () => {
    if (!name.trim()) {
      setError("Name is required");
      return false;
    }
    if (!email.trim()) {
      setError("Email is required");
      return false;
    }
    if (newPassword && newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return false;
    }
    if (newPassword && !currentPassword) {
      setError("Current password is required to set a new password");
      return false;
    }
    return true;
  };

  const validateAIConfig = () => {
    if (aiEnabled && !apiKey.trim()) {
      setError("API key is required when AI features are enabled");
      return false;
    }
    return true;
  };

  const handleSaveBasicProfile = async () => {
    if (!validateBasicProfile() || !userData) return;

    setLoading(true);
    setError("");

    try {
      // Verify current password if trying to change password
      if (newPassword && userData.password !== currentPassword) {
        setError("Current password is incorrect");
        setLoading(false);
        return;
      }

      const updatedUserData: UserData = {
        ...userData,
        name: name.trim(),
        email: email.trim(),
        password: newPassword || userData.password,
      };

      await updateUser(updatedUserData);
      setSuccess("Profile updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setError("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAIConfig = async () => {
    if (!validateAIConfig() || !userData) return;

    setLoading(true);
    setError("");

    try {
      const aiConfig = aiEnabled ? {
        enabled: true,
        apiKey: apiKey.trim(),
        customPrompt: prompt
      } : {
        enabled: false,
        apiKey: "",
        customPrompt: READING_GOAL_GENERATE_PROMPT
      };

      await updateUser({
        ...userData,
        aiConfig: aiConfig
      });
      setSuccess("AI configuration updated successfully");
    } catch (error) {
      setError("Failed to update AI configuration. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetCustomPrompt = () => {
    setPrompt(READING_GOAL_GENERATE_PROMPT);
  };

  const handleClose = () => {
    setError("");
    setSuccess("");
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '600px' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Profile Settings
        <IconButton onClick={handleClose}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 0, py: 0 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="profile settings tabs">
            <Tab label="Profile" />
            <Tab label="AI Configuration" />
            <Tab label="Preferences" />
          </Tabs>
        </Box>

        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ m: 2 }}>
            {success}
          </Alert>
        )}

        {/* Basic Profile Tab */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Basic Information
          </Typography>

          <TextField
            fullWidth
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            margin="normal"
            disabled={loading}
          />

          <TextField
            fullWidth
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            disabled={true}
          />

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            Change Password
          </Typography>

          <TextField
            fullWidth
            type="password"
            label="Current Password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            margin="normal"
            disabled={loading}
          />

          <TextField
            fullWidth
            type="password"
            label="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            margin="normal"
            disabled={loading}
          />

          <TextField
            fullWidth
            type="password"
            label="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            margin="normal"
            disabled={loading}
          />

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={handleSaveBasicProfile}
              disabled={loading}
            >
              Save Profile
            </Button>
          </Box>
        </TabPanel>

        {/* AI Configuration Tab */}
        <TabPanel value={tabValue} index={1}>
          <FormControlLabel
            control={
              <Switch
                checked={aiEnabled}
                onChange={(e) => setAiEnabled(e.target.checked)}
                disabled={loading}
              />
            }
            label="Enable AI Features"
          />

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enable AI-powered reading suggestions and goal generation
          </Typography>

          {aiEnabled && (
            <>
              <TextField
                fullWidth
                label="Google Gemini API Key"
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                margin="normal"
                disabled={loading}
                helperText="Your API key is stored securely and used only for AI features"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowApiKey(!showApiKey)}
                        edge="end"
                      >
                        {showApiKey ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Divider sx={{ my: 3 }} />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Prompt Template
                </Typography>
                <Chip
                  label="Reset to Default"
                  onClick={resetCustomPrompt}
                  size="small"
                  variant="outlined"
                />
              </Box>

              <TextField
                fullWidth
                multiline
                rows={6}
                label="Reading Goal Generation Prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={loading}
                helperText="Customize the prompt used for generating reading suggestions"
              />
            </>
          )}

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={handleSaveAIConfig}
              disabled={loading}
            >
              Save AI Configuration
            </Button>
          </Box>
        </TabPanel>

        {/* Preferences Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Preferences
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Additional preferences will be available here in future updates.
          </Typography>
        </TabPanel>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
} 