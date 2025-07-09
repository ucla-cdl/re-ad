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
    CircularProgress
} from "@mui/material";
import { Search, Description, Analytics } from "@mui/icons-material";
import { useState, useEffect } from "react";
import { PaperData, useStorageContext } from "../../contexts/StorageContext";

interface PaperSelectorProps {
    selectedPaperId: string | null;
    onPaperSelect: (paperId: string, paperUrl?: string) => void;
}

export const PaperSelector = ({ selectedPaperId, onPaperSelect }: PaperSelectorProps) => {
    const { getAllPapersData, getPaperFile } = useStorageContext();
    const [papers, setPapers] = useState<PaperData[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredPapers, setFilteredPapers] = useState<PaperData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPapers();
    }, []);

    useEffect(() => {
        // Filter papers based on search query
        const filtered = papers.filter(paper =>
            paper.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredPapers(filtered);
    }, [searchQuery, papers]);

    const loadPapers = async () => {
        try {
            setLoading(true);
            const papersData = await getAllPapersData();
            setPapers(papersData);
            setFilteredPapers(papersData);
        } catch (error) {
            console.error('Error loading papers:', error);
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

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, color: 'text.primary' }}>
                Select Paper to Analyze
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

            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {filteredPapers.length} paper{filteredPapers.length !== 1 ? 's' : ''} available
            </Typography>

            <Divider sx={{ mb: 1 }} />

            <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                <List sx={{ p: 0 }}>
                    {filteredPapers.map((paper, index) => (
                        <ListItem key={paper.id} sx={{ p: 0 }}>
                            <ListItemButton
                                onClick={() => handlePaperSelect(paper)}
                                selected={selectedPaperId === paper.id}
                                sx={{
                                    borderRadius: 1,
                                    mb: 1,
                                    border: selectedPaperId === paper.id ? '2px solid' : '1px solid',
                                    borderColor: selectedPaperId === paper.id ? 'primary.main' : 'divider',
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
                                                secondary={`Paper ID: ${paper.id.slice(0, 8)}...`}
                                                primaryTypographyProps={{
                                                    sx: {
                                                        fontWeight: selectedPaperId === paper.id ? 'bold' : 'normal',
                                                        fontSize: '0.9rem',
                                                        lineHeight: 1.3,
                                                        mb: 0.5
                                                    }
                                                }}
                                                secondaryTypographyProps={{
                                                    sx: { fontSize: '0.75rem' }
                                                }}
                                            />
                                            
                                            {/* Visual indicator for papers with analysis data */}
                                            {/* TODO: Add logic to check if paper has existing highlights/sessions */}
                                            <Box sx={{ mt: 1 }}>
                                                <Chip
                                                    icon={<Analytics sx={{ fontSize: '0.75rem' }} />}
                                                    label="Has Analysis"
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ 
                                                        height: '20px',
                                                        fontSize: '0.65rem',
                                                        '& .MuiChip-icon': {
                                                            fontSize: '0.75rem'
                                                        }
                                                    }}
                                                />
                                            </Box>
                                        </Box>
                                    </Box>
                                </Box>
                            </ListItemButton>
                        </ListItem>
                    ))}
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
};