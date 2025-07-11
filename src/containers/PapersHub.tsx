import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    InputAdornment,
    Button,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    Avatar,
    Stack,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Divider,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    IconButton,
} from '@mui/material';
import {
    Search as SearchIcon,
    Add as AddIcon,
    PictureAsPdf as PdfIcon,
    CloudUpload as UploadIcon,
    Person as PersonIcon,
    Logout as LogoutIcon,
    Edit as EditIcon,
    MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { useStorageContext, PaperData, UserRole } from '../contexts/StorageContext';
import { v4 as uuidv4 } from 'uuid';
import icon from "/re-ad-icon.svg"
import '../styles/PapersHub.css';
import { useWorkspaceContext } from '../contexts/WorkspaceContext';
import { useNavigate } from 'react-router-dom';

type uploadPaperData = {
    title: string;
    file: File;
}

export const PapersHub = () => {
    const [loginDialogOpen, setLoginDialogOpen] = useState(false);
    const [isLoginMode, setIsLoginMode] = useState(true); // true for login, false for register
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [inputError, setInputError] = useState({
        email: false,
        password: false,
        confirmPassword: false
    });
    const [errorText, setErrorText] = useState({
        email: '',
        password: '',
        confirmPassword: ''
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [filteredPapers, setFilteredPapers] = useState<PaperData[]>([]);

    const [addPaperDialogOpen, setAddPaperDialogOpen] = useState(false);
    const [uploadPaper, setUploadPaper] = useState<uploadPaperData>({
        title: '',
        file: new File([], '')
    });

    const { userData, setUserData, loadUserData, updateUser, getUserByEmail, addPaperData, addPaperFile, addPaperToUser } = useStorageContext();
    const { papersDict, setViewingPaperId } = useWorkspaceContext();
    const navigate = useNavigate();

    const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
    const [editProfileDialogOpen, setEditProfileDialogOpen] = useState(false);
    const [editedUserName, setEditedUserName] = useState('');

    useEffect(() => {
        // Filter papers based on search query
        const filtered = Object.values(papersDict).filter((paper: PaperData) =>
            paper.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredPapers(filtered);
    }, [searchQuery, papersDict]);

    const handleAddPaper = () => {
        setUploadPaper({
            title: '',
            file: new File([], '')
        });
        setAddPaperDialogOpen(true);
    };

    const handleSavePaper = async () => {
        try {
            // Validate required fields
            if (!userData) {
                alert('Please login to add a paper');
                return;
            }

            if (!uploadPaper?.title.trim()) {
                alert('Please enter a title');
                return;
            }

            if (!uploadPaper?.file) {
                alert('Please select a PDF file');
                return;
            }

            // Generate ID for new papers
            const paperId = uuidv4();

            // Create paper data
            const paperData: PaperData = {
                id: paperId,
                title: uploadPaper.title.trim(),
            };

            // Save paper file
            await addPaperFile(paperId, uploadPaper.file);

            // Save paper data
            await addPaperData(paperData);

            // Add paper to user
            await addPaperToUser(userData.id, paperId);

            // Refresh user data to load the new paper
            await loadUserData(userData.id);

            // Close dialog
            setAddPaperDialogOpen(false);

            console.log('Paper saved successfully');
        } catch (error) {
            console.error('Error saving paper:', error);
            alert('Failed to save paper. Please try again.');
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type === 'application/pdf') {
            setUploadPaper({ ...uploadPaper, file: file });
        } else {
            alert('Please select a valid PDF file');
        }
    };

    const validateAuth = async () => {
        // Reset error states
        setInputError({
            email: false,
            password: false,
            confirmPassword: false
        });
        setErrorText({
            email: '',
            password: '',
            confirmPassword: ''
        });

        // Basic validation
        if (!loginEmail.trim()) {
            setInputError(prev => ({ ...prev, email: true }));
            setErrorText(prev => ({ ...prev, email: 'Email is required' }));
            return;
        }

        if (!loginPassword.trim()) {
            setInputError(prev => ({ ...prev, password: true }));
            setErrorText(prev => ({ ...prev, password: 'Password is required' }));
            return;
        }

        if (!isLoginMode) {
            // Registration mode validation
            if (loginPassword !== confirmPassword) {
                setInputError(prev => ({ ...prev, confirmPassword: true }));
                setErrorText(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
                return;
            }

            if (loginPassword.length < 8) {
                setInputError(prev => ({ ...prev, password: true }));
                setErrorText(prev => ({ ...prev, password: 'Password must be at least 6 characters' }));
                return;
            }

            const userId = uuidv4();
            await updateUser({
                id: userId,
                email: loginEmail,
                password: loginPassword,
                name: loginEmail.split('@')[0],
                role: UserRole.STUDENT,
                paperIds: []
            });

            localStorage.setItem('userId', userId);
            await loadUserData(userId);
        } else {
            // Login mode validation
            const userData = await getUserByEmail(loginEmail);
            if (!userData) {
                setInputError({
                    email: true,
                    password: false,
                    confirmPassword: false
                });
                setErrorText({
                    email: 'Email not found',
                    password: '',
                    confirmPassword: ''
                });
                return;
            }

            if (userData.password !== loginPassword) {
                setInputError({
                    email: false,
                    password: true,
                    confirmPassword: false
                });
                setErrorText({
                    email: '',
                    password: 'Password is incorrect',
                    confirmPassword: ''
                });
                return;
            }

            localStorage.setItem('userId', userData.id);
            await loadUserData(userData.id);
        }

        handleDialogClose();
    }

    const handleDialogClose = () => {
        setLoginDialogOpen(false);
        // Reset form and mode
        setIsLoginMode(true);
        setLoginEmail('');
        setLoginPassword('');
        setConfirmPassword('');
        setInputError({
            email: false,
            password: false,
            confirmPassword: false
        });
        setErrorText({
            email: '',
            password: '',
            confirmPassword: ''
        });
    }

    const handleLogout = () => {
        localStorage.removeItem('userId');
        setUserData(undefined);
        setUserMenuAnchor(null);
    };

    const handleEditProfile = () => {
        setEditedUserName(userData?.name || '');
        setEditProfileDialogOpen(true);
        setUserMenuAnchor(null);
    };

    const handleSaveProfile = async () => {
        if (!userData || !editedUserName.trim()) return;

        try {
            const updatedUserData = {
                ...userData,
                name: editedUserName.trim()
            };

            await updateUser(updatedUserData);
            await loadUserData(userData.id);
            setEditProfileDialogOpen(false);
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile. Please try again.');
        }
    };

    const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setUserMenuAnchor(event.currentTarget);
    };

    const handleUserMenuClose = () => {
        setUserMenuAnchor(null);
    };

    const handlePaperClick = (paperId: string) => {
        setViewingPaperId(paperId);
        navigate('/paper-reader');
    }

    return (
        <Box className="papers-hub-container">
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <img height={40} src={icon} alt="re:ad" />
                        <Typography variant="h4" component="h1" fontWeight="bold">
                            Papers Hub
                        </Typography>
                    </Box>

                    {userData ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ bgcolor: 'grey.200' }}>
                                <PersonIcon />
                            </Avatar>
                            <Typography variant="body1" color="text.secondary">
                                {userData.name}
                            </Typography>
                            <IconButton
                                size="small"
                                onClick={handleUserMenuOpen}
                                sx={{ ml: 1 }}
                            >
                                <MoreVertIcon />
                            </IconButton>

                            <Menu
                                anchorEl={userMenuAnchor}
                                open={Boolean(userMenuAnchor)}
                                onClose={handleUserMenuClose}
                                anchorOrigin={{
                                    vertical: 'bottom',
                                    horizontal: 'right',
                                }}
                                transformOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                            >
                                <MenuItem onClick={handleEditProfile}>
                                    <ListItemIcon>
                                        <EditIcon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText>Edit Profile</ListItemText>
                                </MenuItem>
                                <MenuItem onClick={handleLogout}>
                                    <ListItemIcon>
                                        <LogoutIcon fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText>Logout</ListItemText>
                                </MenuItem>
                            </Menu>
                        </Box>
                    ) : (
                        <Button variant="contained" onClick={() => setLoginDialogOpen(true)}>
                            Login / Register
                        </Button>
                    )}
                </Box>

                <Divider sx={{ borderColor: 'black' }} />
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 5 }}>
                    <TextField
                        placeholder="Search papers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ maxWidth: 400 }}
                        size="small"
                        fullWidth
                    />
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAddPaper}
                        size="large"
                    >
                        Add Paper
                    </Button>
                </Box>
            </Box>

            {/* Results count */}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {filteredPapers.length} paper{filteredPapers.length !== 1 ? 's' : ''} found
            </Typography>

            {/* Papers List */}
            <Paper>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell width={60}></TableCell>
                            <TableCell>Title</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredPapers.map((paper) => (
                            <TableRow
                                key={paper.id}
                                sx={{
                                    '&:hover': {
                                        bgcolor: 'action.hover'
                                    }
                                }}
                                onClick={() => handlePaperClick(paper.id)}
                            >
                                <TableCell>
                                    <Avatar sx={{ bgcolor: 'grey.200' }}>
                                        <PdfIcon sx={{ color: 'grey.600' }} />
                                    </Avatar>
                                </TableCell>
                                <TableCell>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            fontWeight: 500,
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        {paper.title}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Paper>

            {/* Empty state */}
            {filteredPapers.length === 0 && (
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: 300,
                        textAlign: 'center'
                    }}
                >
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                        No papers found
                    </Typography>
                </Box>
            )}

            {/* Login/Register Dialog */}
            <Dialog open={loginDialogOpen} onClose={handleDialogClose}>
                <DialogTitle>{isLoginMode ? 'Login' : 'Register'}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            required
                            error={inputError.email}
                            helperText={errorText.email}
                            label="Email"
                            type="email"
                            fullWidth
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                        />
                        <TextField
                            required
                            error={inputError.password}
                            helperText={errorText.password}
                            label="Password"
                            type="password"
                            fullWidth
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                        />
                        {!isLoginMode && (
                            <TextField
                                required
                                error={inputError.confirmPassword}
                                helperText={errorText.confirmPassword}
                                label="Confirm Password"
                                type="password"
                                fullWidth
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        )}
                        <Button
                            variant="text"
                            onClick={() => setIsLoginMode(!isLoginMode)}
                            sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
                        >
                            {isLoginMode ? "Don't have an account? Register" : "Already have an account? Login"}
                        </Button>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDialogClose}>Cancel</Button>
                    <Button onClick={validateAuth} variant="contained">
                        {isLoginMode ? 'Login' : 'Register'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Add/Edit Paper Dialog */}
            <Dialog
                open={addPaperDialogOpen}
                onClose={() => setAddPaperDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    Add New Paper
                </DialogTitle>
                <DialogContent sx={{ pt: 2 }}>
                    <Stack spacing={3}>
                        {/* Title */}
                        <TextField
                            label="Title"
                            value={uploadPaper?.title}
                            onChange={(e) => setUploadPaper({ ...uploadPaper, title: e.target.value })}
                            fullWidth
                            required
                        />

                        <Box>
                            <input
                                type="file"
                                accept="application/pdf"
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                                id="pdf-upload"
                            />
                            <label htmlFor="pdf-upload">
                                <Button
                                    variant="outlined"
                                    component="span"
                                    startIcon={<UploadIcon />}
                                    fullWidth
                                    sx={{ py: 2 }}
                                >
                                    {uploadPaper?.file ? uploadPaper.file.name : 'Choose PDF File'}
                                </Button>
                            </label>
                        </Box>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={() => setAddPaperDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSavePaper}
                        variant="contained"
                    >
                        Add Paper
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Profile Dialog */}
            <Dialog open={editProfileDialogOpen} onClose={() => setEditProfileDialogOpen(false)}>
                <DialogTitle>Edit Profile</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1, minWidth: 300 }}>
                        <TextField
                            label="Name"
                            value={editedUserName}
                            onChange={(e) => setEditedUserName(e.target.value)}
                            fullWidth
                            autoFocus
                        />
                        <TextField
                            label="Email"
                            value={userData?.email || ''}
                            disabled
                            fullWidth
                            helperText="Email cannot be changed"
                        />
                        <TextField
                            label="Role"
                            value={userData?.role || ''}
                            disabled
                            fullWidth
                            helperText="Role is assigned by administrators"
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditProfileDialogOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSaveProfile} variant="contained">
                        Save Changes
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};