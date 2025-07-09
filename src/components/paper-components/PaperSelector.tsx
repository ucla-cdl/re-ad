import { 
    Box, 
    Typography, 
    TextField, 
    List, 
    ListItem, 
    ListItemButton, 
    ListItemText, 
    InputAdornment, 
    Chip,
    Divider,
    CircularProgress,
    IconButton,
    Button,
    Checkbox,
    FormControlLabel
} from "@mui/material";
import { Search, Description, Analytics, Add, Check, Person } from "@mui/icons-material";
import { useState, useEffect } from "react";
import { PaperData, UserData, UserRole, useStorageContext } from "../../contexts/StorageContext";
import { usePaperContext } from "../../contexts/PaperContext";

interface PaperSelectorProps {
    selectedPaperId: string | null;
    onPaperSelect: (paperId: string, paperUrl?: string) => void;
    // Analytics selection props
    selectedPapersForAnalytics?: string[];
    selectedUsersForAnalytics?: string[];
    onAnalyticsPaperToggle?: (paperId: string) => void;
    onAnalyticsUserToggle?: (userId: string) => void;
}

export const PaperSelector = ({ 
    selectedPaperId, 
    onPaperSelect,
    selectedPapersForAnalytics = [],
    selectedUsersForAnalytics = [],
    onAnalyticsPaperToggle,
    onAnalyticsUserToggle
}: PaperSelectorProps) => {
    const { getAllPapersData, getPaperFile, userData, getAllUsers } = useStorageContext();
    const { mode } = usePaperContext();
    
    const [papers, setPapers] = useState<PaperData[]>([]);
    const [users, setUsers] = useState<UserData[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [filteredPapers, setFilteredPapers] = useState<PaperData[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);

    const isAnalyzeMode = mode === "analyzing";
    const isTeacher = userData?.role === UserRole.TEACHER;
    const showUserSelector = isAnalyzeMode && isTeacher;

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        // Filter papers based on search query
        const filtered = papers.filter(paper =>
            paper.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredPapers(filtered);
    }, [searchQuery, papers]);

    useEffect(() => {
        // Filter users based on search query
        const filtered = users.filter(user =>
            user.name.toLowerCase().includes(userSearchQuery.toLowerCase())
        );
        setFilteredUsers(filtered);
    }, [userSearchQuery, users]);

    const loadData = async () => {
        try {
            setLoading(true);
            const papersData = await getAllPapersData();
            setPapers(papersData);
            setFilteredPapers(papersData);

            // Load users if teacher and in analyze mode
            if (isTeacher && isAnalyzeMode) {
                const usersData = await getAllUsers(UserRole.STUDENT);
                setUsers(usersData);
                setFilteredUsers(usersData);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePaperSelect = async (paper: PaperData) => {
        try {
            const paperUrl = await getPaperFile(paper.id);
            onPaperSelect(paper.id, paperUrl);
        } catch (error) {
            console.error('Error loading paper file:', error);
            onPaperSelect(paper.id);
        }
    };

    const handleAnalyticsPaperToggle = (paperId: string) => {
        if (onAnalyticsPaperToggle) {
            onAnalyticsPaperToggle(paperId);
        }
    };

    const handleAnalyticsUserToggle = (userId: string) => {
        if (onAnalyticsUserToggle) {
            onAnalyticsUserToggle(userId);
        }
    };

    if (loading) {
        return (
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '200px' 
            }}>
                <CircularProgress />
            </Box>
        );
    }

    const renderPaperList = () => (
        <Box sx={{ flex: showUserSelector ? '1 1 60%' : '1 1 100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <Typography variant="h6" sx={{ mb: 2, color: 'text.primary' }}>
                {isAnalyzeMode ? 'Papers for Analysis' : 'Select Paper to Read'}
            </Typography>
            
            <TextField
                placeholder="Search papers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <Search />
                        </InputAdornment>
                    ),
                }}
                sx={{ mb: 2 }}
                size="small"
                fullWidth
            />

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                    {filteredPapers.length} paper{filteredPapers.length !== 1 ? 's' : ''} available
                </Typography>
                {isAnalyzeMode && (
                    <Typography variant="body2" color="primary">
                        {selectedPapersForAnalytics.length} selected
                    </Typography>
                )}
            </Box>

            <Divider sx={{ mb: 1 }} />

            <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                <List sx={{ p: 0 }}>
                    {filteredPapers.map((paper) => {
                        const isSelected = selectedPaperId === paper.id;
                        const isSelectedForAnalytics = selectedPapersForAnalytics.includes(paper.id);

                        return (
                            <ListItem key={paper.id} sx={{ p: 0, mb: 1 }}>
                                <Box sx={{ width: '100%', display: 'flex', gap: 1 }}>
                                    {/* Main paper button */}
                                    <ListItemButton
                                        onClick={() => handlePaperSelect(paper)}
                                        selected={isSelected}
                                        sx={{
                                            borderRadius: 1,
                                            border: isSelected ? '2px solid' : '1px solid',
                                            borderColor: isSelected ? 'primary.main' : 'divider',
                                            flex: 1,
                                            '&:hover': {
                                                borderColor: 'primary.main',
                                            }
                                        }}
                                    >
                                        <Box sx={{ width: '100%' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                                <Description 
                                                    sx={{ 
                                                        color: 'text.secondary', 
                                                        fontSize: '1.2rem',
                                                        mt: 0.5 
                                                    }} 
                                                />
                                                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                                    <ListItemText
                                                        primary={paper.title}
                                                        primaryTypographyProps={{
                                                            sx: {
                                                                fontWeight: isSelected ? 'bold' : 'normal',
                                                                fontSize: '0.9rem',
                                                                lineHeight: 1.3,
                                                                mb: 0.5
                                                            }
                                                        }}
                                                    />
                                                    {isSelectedForAnalytics && (
                                                        <Chip 
                                                            label="In Analytics" 
                                                            size="small" 
                                                            color="primary" 
                                                            sx={{ fontSize: '0.7rem', height: '20px' }}
                                                        />
                                                    )}
                                                </Box>
                                            </Box>
                                        </Box>
                                    </ListItemButton>

                                    {/* Analytics toggle button - only in analyze mode */}
                                    {isAnalyzeMode && (
                                        <IconButton
                                            onClick={() => handleAnalyticsPaperToggle(paper.id)}
                                            sx={{
                                                border: '1px solid',
                                                borderColor: isSelectedForAnalytics ? 'primary.main' : 'divider',
                                                backgroundColor: isSelectedForAnalytics ? 'primary.main' : 'transparent',
                                                color: isSelectedForAnalytics ? 'white' : 'text.secondary',
                                                '&:hover': {
                                                    borderColor: 'primary.main',
                                                    backgroundColor: isSelectedForAnalytics ? 'primary.dark' : 'action.hover'
                                                },
                                                width: 40,
                                                height: 40
                                            }}
                                        >
                                            {isSelectedForAnalytics ? <Check /> : <Add />}
                                        </IconButton>
                                    )}
                                </Box>
                            </ListItem>
                        );
                    })}
                </List>

                {filteredPapers.length === 0 && !loading && (
                    <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        height: '100px',
                        color: 'text.secondary'
                    }}>
                        <Typography variant="body2">
                            {searchQuery ? 'No papers match your search' : 'No papers available'}
                        </Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );

    const renderUserList = () => {
        if (!showUserSelector) return null;

        return (
            <>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ flex: '1 1 40%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    <Typography variant="h6" sx={{ mb: 2, color: 'text.primary' }}>
                        Students for Analysis
                    </Typography>
                    
                    <TextField
                        placeholder="Search students..."
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ mb: 2 }}
                        size="small"
                        fullWidth
                    />

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            {filteredUsers.length} student{filteredUsers.length !== 1 ? 's' : ''} available
                        </Typography>
                        <Typography variant="body2" color="primary">
                            {selectedUsersForAnalytics.length} selected
                        </Typography>
                    </Box>

                    <Divider sx={{ mb: 1 }} />

                    <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                        <List sx={{ p: 0 }}>
                            {filteredUsers.map((user) => {
                                const isSelectedForAnalytics = selectedUsersForAnalytics.includes(user.id);

                                return (
                                    <ListItem key={user.id} sx={{ p: 0, mb: 1 }}>
                                        <Box sx={{ width: '100%', display: 'flex', gap: 1 }}>
                                            <ListItemButton
                                                sx={{
                                                    borderRadius: 1,
                                                    border: '1px solid',
                                                    borderColor: isSelectedForAnalytics ? 'primary.main' : 'divider',
                                                    flex: 1,
                                                    backgroundColor: isSelectedForAnalytics ? 'action.selected' : 'transparent',
                                                    '&:hover': {
                                                        borderColor: 'primary.main',
                                                    }
                                                }}
                                                onClick={() => handleAnalyticsUserToggle(user.id)}
                                            >
                                                <Box sx={{ width: '100%' }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Person 
                                                            sx={{ 
                                                                color: isSelectedForAnalytics ? 'primary.main' : 'text.secondary',
                                                                fontSize: '1.2rem'
                                                            }} 
                                                        />
                                                        <Box sx={{ flexGrow: 1 }}>
                                                            <ListItemText
                                                                primary={user.name}
                                                                secondary={user.email}
                                                                primaryTypographyProps={{
                                                                    sx: {
                                                                        fontWeight: isSelectedForAnalytics ? 'bold' : 'normal',
                                                                        fontSize: '0.9rem',
                                                                        color: isSelectedForAnalytics ? 'primary.main' : 'text.primary'
                                                                    }
                                                                }}
                                                                secondaryTypographyProps={{
                                                                    sx: { fontSize: '0.75rem' }
                                                                }}
                                                            />
                                                        </Box>
                                                        {isSelectedForAnalytics && (
                                                            <Check color="primary" />
                                                        )}
                                                    </Box>
                                                </Box>
                                            </ListItemButton>
                                        </Box>
                                    </ListItem>
                                );
                            })}
                        </List>

                        {filteredUsers.length === 0 && !loading && (
                            <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'center', 
                                alignItems: 'center', 
                                height: '100px',
                                color: 'text.secondary'
                            }}>
                                <Typography variant="body2">
                                    {userSearchQuery ? 'No students match your search' : 'No students available'}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Box>
            </>
        );
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
            {renderPaperList()}
            {renderUserList()}
        </Box>
    );
};