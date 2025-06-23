import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
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
    IconButton,
    Stack,
    Skeleton,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import {
    Search as SearchIcon,
    Add as AddIcon,
    PictureAsPdf as PdfIcon,
    CloudUpload as UploadIcon,
} from '@mui/icons-material';
import { useStorageContext, PaperData, PaperFile } from '../contexts/StorageContext';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';

type uploadPaperData = {
    title: string;
    file: File;
}

export const PapersHub = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [papers, setPapers] = useState<PaperData[]>([]);
    const [filteredPapers, setFilteredPapers] = useState<PaperData[]>([]);

    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [uploadPaper, setUploadPaper] = useState<uploadPaperData>({
        title: '',
        file: new File([], '')
    });

    const { userId, getUser, getAllPapersData, addPaperData, addPaperFile, getPaperData, addPaperToUser, getPaperFile } = useStorageContext();

    useEffect(() => {
        loadPapers();
    }, [userId]);

    useEffect(() => {
        // Filter papers based on search query
        const filtered = papers.filter(paper =>
            paper.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredPapers(filtered);
    }, [searchQuery, papers]);

    const loadPapers = async () => {
        try {
            if (!userId) return;
            setLoading(true);
            const userData = await getUser(userId);
            const paperData = await getAllPapersData();
            setPapers(paperData.filter(paper => userData.paperIds.includes(paper.id)));
        } catch (error) {
            console.error('Error loading papers:', error);
            setPapers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddPaper = () => {
        setUploadPaper({
            title: '',
            file: new File([], '')
        });
        setDialogOpen(true);
    };

    const handleSavePaper = async () => {
        try {
            // Validate required fields
            if (!userId) {
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
            await addPaperToUser(userId, paperId);

            // Refresh papers list
            await loadPapers();

            // Close dialog
            setDialogOpen(false);

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

    const handlePaperClick = (paperId: string) => {
        // open paper reader
        navigate(`/paper-reader`, { state: { paperId: paperId } });
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                    <Typography variant="h4" component="h1" fontWeight="bold">
                        Papers Hub
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAddPaper}
                        size="large"
                    >
                        Add Paper
                    </Button>
                </Stack>

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
                        {loading ? (
                            Array.from(new Array(5)).map((_, index) => (
                                <TableRow key={index}>
                                    <TableCell><Skeleton variant="circular" width={40} height={40} /></TableCell>
                                    <TableCell><Skeleton variant="text" /></TableCell>
                                </TableRow>
                            ))
                        ) : (
                            filteredPapers.map((paper) => (
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
                            ))
                        )}
                    </TableBody>
                </Table>
            </Paper>

            {/* Empty state */}
            {filteredPapers.length === 0 && !loading && (
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

            {/* Add/Edit Paper Dialog */}
            <Dialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
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
                    <Button onClick={() => setDialogOpen(false)}>
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
        </Container>
    );
};