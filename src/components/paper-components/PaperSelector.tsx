import {
    Box,
    Typography,
    TextField,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    InputAdornment,
    Divider,
    IconButton,
} from "@mui/material";
import { Search, Description, Check, Person, CheckBox as CheckboxIcon, CheckBoxOutlineBlank } from "@mui/icons-material";
import { useState, useEffect } from "react";
import { PaperData, UserData, UserRole, useStorageContext } from "../../contexts/StorageContext";
import { MODE_TYPES, useWorkspaceContext } from "../../contexts/WorkspaceContext";
import { useAnalysisContext } from "../../contexts/AnalysisContext";


export const PaperSelector = () => {
    const { userData } = useStorageContext();
    const { selectedAnalyticsPapersId, togglePaperForAnalytics, toggleUserForAnalytics, selectedAnalyticsUsersId } = useAnalysisContext();
    const { mode, papersDict, usersDict, viewingPaperId, setViewingPaperId } = useWorkspaceContext();

    const [searchQuery, setSearchQuery] = useState('');
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [filteredPapers, setFilteredPapers] = useState<PaperData[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);

    useEffect(() => {
        // Filter papers based on search query
        const filtered = Object.values(papersDict).filter(paper =>
            paper.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredPapers(filtered);
    }, [searchQuery]);

    useEffect(() => {
        // Filter users based on search query
        const filtered = Object.values(usersDict).filter(user =>
            user.name.toLowerCase().includes(userSearchQuery.toLowerCase())
        ).sort((a, b) => a.name.localeCompare(b.name));
        setFilteredUsers(filtered);
    }, [userSearchQuery]);

    const handleAnalyticsPaperToggle = (paperId: string) => {
        togglePaperForAnalytics(paperId);
    };

    const handleAnalyticsUserToggle = (userId: string) => {
        toggleUserForAnalytics(userId);
    };

    const renderPaperList = () => (
        <Box sx={{ flex: (mode === MODE_TYPES.ANALYZING && userData?.role !== UserRole.STUDENT) ? '1 1 50%' : '1 1 100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <Typography variant="h6" sx={{ mb: 2, color: 'text.primary' }}>
                Paper List
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
                {mode === MODE_TYPES.ANALYZING && (
                    <Typography variant="body2" color="primary">
                        {selectedAnalyticsPapersId.length} selected
                    </Typography>
                )}
            </Box>

            <Divider sx={{ mb: 1 }} />

            <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                <List sx={{ p: 0 }}>
                    {filteredPapers.map((paper) => {
                        const isSelected = viewingPaperId === paper.id;
                        const isSelectedForAnalytics = selectedAnalyticsPapersId.includes(paper.id);

                        return (
                            <ListItem key={paper.id} sx={{ p: 0, mb: 1 }}>
                                <Box sx={{ width: '100%', display: 'flex', gap: 1 }}>
                                    {/* Main paper button */}
                                    <Box sx={{ position: 'relative', flex: 1 }}>
                                        <ListItemButton
                                            onClick={() => setViewingPaperId(paper.id)}
                                            selected={isSelected}
                                            sx={{
                                                borderRadius: 1,
                                                border: isSelected ? '2px solid' : '1px solid',
                                                borderColor: isSelected ? 'primary.main' : 'divider',
                                                flex: 1,
                                                '&:hover': {
                                                    borderColor: 'primary.main',
                                                },
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1
                                            }}
                                        >
                                            {/* Main content area */}
                                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, flexGrow: 1, minWidth: 0 }}>
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
                                                </Box>
                                            </Box>
                                            {/* Analytics toggle button - only in analyze mode */}
                                            {mode === MODE_TYPES.ANALYZING && (
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleAnalyticsPaperToggle(paper.id);
                                                    }}
                                                    sx={{
                                                        p: 0,
                                                        flexShrink: 0,
                                                        color: isSelectedForAnalytics ? 'primary.main' : 'text.secondary',
                                                        '&:focus': {
                                                            outline: 'none',
                                                        },
                                                    }}
                                                >
                                                    {isSelectedForAnalytics ? <CheckboxIcon fontSize="small" /> : <CheckBoxOutlineBlank fontSize="small" />}
                                                </IconButton>
                                            )}
                                        </ListItemButton>
                                    </Box>
                                </Box>
                            </ListItem>
                        );
                    })}
                </List>

                {filteredPapers.length === 0 && (
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
        if (mode !== MODE_TYPES.ANALYZING || userData?.role === UserRole.STUDENT) return null;

        return (
            <>
                <Divider sx={{ my: 2, backgroundColor: "black", height: "1px" }} />
                <Box sx={{ flex: '1 1 50%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    <Typography variant="h6" sx={{ mb: 2, color: 'text.primary' }}>
                        User List
                    </Typography>

                    <TextField
                        placeholder="Search users..."
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
                            {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} available
                        </Typography>
                        <Typography variant="body2" color="primary">
                            {selectedAnalyticsUsersId.length} selected
                        </Typography>
                    </Box>

                    <Divider sx={{ mb: 1 }} />

                    <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                        <List sx={{ p: 0 }}>
                            {filteredUsers.map((user) => {
                                const isCurrentUser = user.id === userData?.id;
                                const isSelectedForAnalytics = selectedAnalyticsUsersId.includes(user.id);

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
                                                                primary={user.name + (isCurrentUser ? " (You)" : "")}
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

                        {filteredUsers.length === 0 && (
                            <Box sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                height: '100px',
                                color: 'text.secondary'
                            }}>
                                <Typography variant="body2">
                                    {userSearchQuery ? 'No users match your search' : 'No users available'}
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