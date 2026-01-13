import { Box, Button, Paper } from "@mui/material";
import { usePaperContext, REPRESENTATION_TYPES } from "../contexts/PaperContext";
import GraphPanel from "./GraphPanel";
import ChatPanel from "./ChatPanel";

function RepresentationPanel() {
    const { representation, setRepresentation } = usePaperContext();

    const renderRepresentation = () => {
        switch (representation) {
            case REPRESENTATION_TYPES.LLM_SUMMARY:
                return <ChatPanel />;
            case REPRESENTATION_TYPES.KNOWLEDGE_GRAPH:
                return (
                    <Box
                        sx={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                    >
                        <Box sx={{ textAlign: "center", color: "text.secondary" }}>
                            Knowledge Graph representation coming soon...
                        </Box>
                    </Box>
                );
            case REPRESENTATION_TYPES.FACETS:
                return (
                    <Box
                        sx={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                    >
                        <Box sx={{ textAlign: "center", color: "text.secondary" }}>
                            Facets representation coming soon...
                        </Box>
                    </Box>
                );
            case REPRESENTATION_TYPES.TREE:
                return (
                    <Box
                        sx={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                    >
                        <Box sx={{ textAlign: "center", color: "text.secondary" }}>
                            Tree representation coming soon...
                        </Box>
                    </Box>
                );
            case REPRESENTATION_TYPES.NOTE_DIAGRAM:
                return <GraphPanel />;
        }
    };

    return (
        <Box
            sx={{
                width: "100%",
                height: "100%",
                position: "relative",
                display: "flex",
                flexDirection: "column",
            }}
        >
            {/* Floating Navigation Bar */}
            <Box
                sx={{
                    position: "absolute",
                    top: 16,
                    left: "50%",
                    transform: "translateX(-50%)",
                    zIndex: 10,
                }}
            >
                <Paper
                    elevation={3}
                    sx={{
                        display: "flex",
                        gap: 1,
                        padding: 1,
                        borderRadius: 4,
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        backdropFilter: "blur(10px)",
                    }}
                >
                    {Object.values(REPRESENTATION_TYPES).map((type) => (
                        <Button
                            size="small"
                            key={type}
                            variant={
                                representation === type
                                    ? "contained"
                                    : "text"
                            }
                            onClick={() => setRepresentation(type)}
                            sx={{
                                borderRadius: 3,
                                textTransform: "none",
                                minWidth: "auto",
                                backgroundColor:
                                    representation === type
                                        ? "primary.main"
                                        : "transparent",
                                color:
                                    representation === type
                                        ? "white"
                                        : "text.primary",
                                "&:hover": {
                                    backgroundColor:
                                        representation === type
                                            ? "primary.dark"
                                            : "action.hover",
                                },
                            }}
                        >
                            {type}
                        </Button>
                    ))}
                </Paper>
            </Box>

            {/* Representation Content */}
            <Box
                sx={{
                    width: "100%",
                    height: "100%",
                    pt: 4, // Add padding top to account for nav bar
                }}
            >
                {renderRepresentation()}
            </Box>
        </Box>
    );
}

export default RepresentationPanel;