import { Box, Typography, CircularProgress, Paper } from "@mui/material";
import { useEffect, useState, useRef } from "react";
import { usePaperContext } from "../contexts/PaperContext";
import { useWorkspaceContext } from "../contexts/WorkspaceContext";
import ReactMarkdown from "react-markdown";

const BACKEND_URL = "http://localhost:8000";

interface Message {
    role: "assistant" | "user";
    content: string;
}

/**
 * Representation: LLM Summary
 */
function ChatPanel() {
    const { pdfViewerRef, paperUrl } = usePaperContext();
    const { viewingPaperId } = useWorkspaceContext();
    const [summary, setSummary] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [summary]);

    useEffect(() => {
        fetchSummary();
    }, [viewingPaperId, paperUrl]);

    const fetchSummary = async () => {
        if (!viewingPaperId || !paperUrl) {
            setSummary("");
            return;
        }

        setLoading(true);
        setError(null);
        setSummary("");

        try {
            let paperText: string | null = null;

            // Try to extract text from PDF viewer
            if (pdfViewerRef.current) {
                try {
                    paperText = await pdfViewerRef.current.getAllText();
                } catch (err) {
                    console.warn("Could not extract text from PDF viewer:", err);
                }
            }

            // Call backend API
            if (paperText) {
                const response = await fetch(`${BACKEND_URL}/paper/summary`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        text: paperText,
                    }),
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch summary: ${response.statusText}`);
                }

                const data = await response.json();
                setSummary(data.summary);
            }
        } catch (err: any) {
            console.error("Error fetching summary:", err);
            setError(err.message || "Failed to generate summary. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const messages: Message[] = summary
        ? [
            {
                role: "assistant",
                content: summary,
            },
        ]
        : [];

    return (
        <Box
            sx={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                backgroundColor: "#f7f7f8",
            }}
        >
            {/* Messages Container */}
            <Box
                sx={{
                    flex: 1,
                    overflowY: "auto",
                    padding: 2,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                }}
            >
                {loading && (
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            padding: 4,
                        }}
                    >
                        <CircularProgress />
                        <Typography
                            variant="body2"
                            sx={{ ml: 2, color: "text.secondary" }}
                        >
                            Generating summary...
                        </Typography>
                    </Box>
                )}

                {error && (
                    <Paper
                        sx={{
                            padding: 2,
                            backgroundColor: "#fee",
                            border: "1px solid #fcc",
                        }}
                    >
                        <Typography variant="body2" color="error">
                            {error}
                        </Typography>
                    </Paper>
                )}

                {messages.map((message, index) => (
                    <Box
                        key={index}
                        sx={{
                            display: "flex",
                            justifyContent:
                                message.role === "assistant"
                                    ? "flex-start"
                                    : "flex-end",
                            width: "100%",
                        }}
                    >
                        <Box
                            sx={{
                                maxWidth: "85%",
                                backgroundColor:
                                    message.role === "assistant"
                                        ? "#ffffff"
                                        : "#0d9373",
                                color:
                                    message.role === "assistant"
                                        ? "#000000"
                                        : "#ffffff",
                                padding: 2,
                                borderRadius: 2,
                                boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                            }}
                        >
                            {message.role === "assistant" && (
                                <Typography
                                    variant="caption"
                                    sx={{
                                        display: "block",
                                        mb: 1,
                                        fontWeight: 600,
                                        color: "text.secondary",
                                    }}
                                >
                                    Paper Summary
                                </Typography>
                            )}
                            <ReactMarkdown
                                components={{
                                    p: ({ children }) => (
                                        <Typography
                                            variant="body1"
                                            sx={{
                                                mb: 1,
                                                lineHeight: 1.6,
                                                "&:last-child": { mb: 0 },
                                            }}
                                        >
                                            {children}
                                        </Typography>
                                    ),
                                    h1: ({ children }) => (
                                        <Typography
                                            variant="h6"
                                            sx={{ mb: 1, mt: 2 }}
                                        >
                                            {children}
                                        </Typography>
                                    ),
                                    h2: ({ children }) => (
                                        <Typography
                                            variant="subtitle1"
                                            sx={{ mb: 1, mt: 2, fontWeight: 600 }}
                                        >
                                            {children}
                                        </Typography>
                                    ),
                                    h3: ({ children }) => (
                                        <Typography
                                            variant="subtitle2"
                                            sx={{ mb: 1, mt: 1, fontWeight: 600 }}
                                        >
                                            {children}
                                        </Typography>
                                    ),
                                    ul: ({ children }) => (
                                        <Box
                                            component="ul"
                                            sx={{
                                                pl: 2,
                                                mb: 1,
                                                "&:last-child": { mb: 0 },
                                            }}
                                        >
                                            {children}
                                        </Box>
                                    ),
                                    ol: ({ children }) => (
                                        <Box
                                            component="ol"
                                            sx={{
                                                pl: 2,
                                                mb: 1,
                                                "&:last-child": { mb: 0 },
                                            }}
                                        >
                                            {children}
                                        </Box>
                                    ),
                                    li: ({ children }) => (
                                        <Typography
                                            component="li"
                                            variant="body1"
                                            sx={{ mb: 0.5, lineHeight: 1.6 }}
                                        >
                                            {children}
                                        </Typography>
                                    ),
                                }}
                            >
                                {message.content}
                            </ReactMarkdown>
                        </Box>
                    </Box>
                ))}

                {!loading && !error && messages.length === 0 && (
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            height: "100%",
                        }}
                    >
                        <Typography variant="body2" color="text.secondary">
                            {paperUrl
                                ? "Loading paper summary..."
                                : "No paper selected"}
                        </Typography>
                    </Box>
                )}

                <div ref={messagesEndRef} />
            </Box>
        </Box>
    );
}

export default ChatPanel;