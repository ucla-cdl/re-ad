import { createContext, useContext, useEffect, useRef, useState } from "react";
import { GhostHighlight } from "react-pdf-highlighter-extended";
import {
  type Node,
  type Edge,
  useNodesState,
  useEdgesState,
  type OnNodesChange,
  type OnEdgesChange,
  addEdge,
  Connection,
  MarkerType,
} from "@xyflow/react";
// import { useTourContext } from "./TourContext";
import { PDFViewer } from "pdfjs-dist/types/web/pdf_viewer";
import { v4 as uuidv4 } from 'uuid';
import { Canvas, ReadHighlight, ReadPurpose, ReadSession, useStorageContext } from "./StorageContext";
import { GoogleGenAI, Type } from "@google/genai";
import { READING_SUGGESTION_SYSTEM_PROMPT } from "../utils/prompts";
import { MODE_TYPES, useWorkspaceContext } from "./WorkspaceContext";
import { AnalyticsLevel, useAnalysisContext } from "./AnalysisContext";

type PaperContextData = {
  // Paper
  paperUrl: string | null;
  setPaperUrl: (paperUrl: string | null) => void;
  generateReadingGoals: () => Promise<ReadSuggestion>;
  highlights: Array<ReadHighlight>;
  addHighlight: (highlight: GhostHighlight) => void;
  removeHighlight: (highlightId: string) => void;
  updateNodeData: (nodeId: string, data: Partial<NodeData>) => void;
  setHighlights: (highlights: Array<ReadHighlight>) => void;
  deleteHighlight: (highlightId: string) => void;
  resetHighlights: () => void;
  pdfViewerRef: React.RefObject<PDFViewer | null>;

  // Graph
  nodes: Array<Node>;
  setNodes: (nodes: Array<Node>) => void;
  onNodesChange: OnNodesChange;
  edges: Array<Edge>;
  setEdges: (edges: Array<Edge>) => void;
  onEdgesChange: OnEdgesChange;
  onConnect: (connection: Connection) => void;
  onSelectNode: boolean;
  setOnSelectNode: (onSelectNode: boolean) => void;
  createGroupNode: (nodeIds: string[], label?: string) => void;
  displayEdgeTypes: Array<string>;
  setDisplayEdgeTypes: (displayEdgeTypes: Array<string>) => void;

  // Shared
  readPurposes: Record<string, ReadPurpose>;
  getNodeColor: (readPurposeId: string) => string;
  createRead: (title: string, color: string, description?: string, readId?: string) => void;
  currentReadId: string;
  setCurrentReadId: (readId: string) => void;
  currentSessionId: string;
  setCurrentSessionId: (sessionId: string) => void;
  setReadPurposes: (readPurposes: Record<string, ReadPurpose>) => void;
  displayedReads: Array<string>;
  toggleRead: (readId: string) => void;
  selectedHighlightIds: Array<string>;
  setSelectedHighlightIds: (highlightIds: Array<string>) => void;

  // Read Log
  readSessions: Record<string, ReadSession>;
  setReadSessions: (readSessions: Record<string, ReadSession>) => void;
  stopUpdateReadingSession: () => void;

  // LLM
  query_gemini: (prompt: string, data: any) => Promise<string>;

  // Data
  saveReadingData: () => Promise<void>;
  resetPaperContext: () => void;
  loadPaperContext: () => Promise<void>;
};

const PaperContext = createContext<PaperContextData | undefined>(undefined);

export type ReadSuggestion = {
  readingProgress: string;
  readingGoals: ReadGoal[];
}

export type ReadGoal = {
  goalName: string;
  goalDescription: string;
}

export type NodeData = {
  label: string;
  content: string;
  summary: string;
  notes: string;
  type: string;
}

export const NODE_TYPES = {
  HIGHLIGHT: "highlight",
  OVERVIEW: "overview",
  THEME: "theme",
}

export const EDGE_TYPES = {
  CHRONOLOGICAL: "chronological",
  RELATIONAL: "relational",
}

export const CHRONOLOGICAL_EDGE_MARKER_END = {
  type: MarkerType.Arrow,
  width: 15,
  height: 15,
}

export const RELATIONAL_EDGE_MARKER_END = {
  type: MarkerType.Arrow,
  width: 20,
  height: 20,
  color: "black",
}

export const UPDATE_INTERVAL = 500;

export const PaperContextProvider = ({ children }: { children: React.ReactNode }) => {
  // const { setRunTour } = useTourContext();
  const { userData, getHighlightsByUsersAndPapers, getPurposesByUserAndPaper, getCanvasUserAndPaper, getSessionsByUsersAndPapers, batchAddPurposes, batchAddHighlights, batchAddSessions, updateCanvas, getPaperFile } = useStorageContext();
  const { mode, viewingPaperId } = useWorkspaceContext();
  const { analyticsHighlights, analyticsPurposes, analyticsSessions, analyticsCanvasJSON, analyticsLevel, selectedPaper } = useAnalysisContext();

  // Paper
  const [paperUrl, setPaperUrl] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<Array<ReadHighlight>>([]);
  const pdfViewerRef = useRef<PDFViewer | null>(null);

  // Shared
  const [readPurposes, setReadPurposes] = useState<Record<string, ReadPurpose>>({});
  const [currentReadId, setCurrentReadId] = useState("");
  const [currentSessionId, setCurrentSessionId] = useState("");
  const [selectedHighlightIds, setSelectedHighlightIds] = useState<Array<string>>([]);
  const [displayedReads, setDisplayedReads] = useState<Array<string>>([]);

  // Graph
  const [nodes, setNodes, onNodesChange] = useNodesState([] as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([] as Edge[]);
  const [onSelectNode, setOnSelectNode] = useState<boolean>(false);
  const [displayEdgeTypes, setDisplayEdgeTypes] = useState<Array<string>>([EDGE_TYPES.CHRONOLOGICAL, EDGE_TYPES.RELATIONAL]);
  const NODE_OFFSET_X = 150;
  const NODE_OFFSET_Y = 150;

  // Read Log
  const [readSessions, setReadSessions] = useState<Record<string, ReadSession>>({});
  const updateIntervalRef = useRef<any>(null);
  const currentSessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    console.log("load Paper Context", viewingPaperId);
    loadPaperPDF();
    if (mode === MODE_TYPES.READING) {
      loadPaperContext();
    }
    else if (mode === MODE_TYPES.ANALYZING) {
      loadPaperContextForAnalytics();
    }
  }, [viewingPaperId]);

  useEffect(() => {
    if (mode === MODE_TYPES.ANALYZING) {
      loadPaperContextForAnalytics();
    }
  }, [analyticsLevel, analyticsHighlights, analyticsPurposes, analyticsSessions, analyticsCanvasJSON]);

  const resetReadingControlStates = () => {
    setCurrentReadId("");
    setCurrentSessionId("");
    setDisplayedReads([]);
    currentSessionIdRef.current = null;
    setSelectedHighlightIds([]);
    setDisplayEdgeTypes([EDGE_TYPES.CHRONOLOGICAL, EDGE_TYPES.RELATIONAL]);
  };

  const resetPaperContext = () => {
    setHighlights([]);
    setReadPurposes({});
    setNodes([]);
    setEdges([]);
    setReadSessions({});
    resetReadingControlStates();
  };

  const loadPaperPDF = async () => {
    if (!viewingPaperId) {
      setPaperUrl(null);
      return;
    }

    try {
      const paperUrl = await getPaperFile(viewingPaperId);
      setPaperUrl(paperUrl);
    } catch (error) {
      console.error('Error fetching paper file:', error);
    }
  }

  const loadPaperContext = async () => {
    if (!viewingPaperId || !userData) {
      resetPaperContext();
      return;
    }

    const highlightsByUserAndPaper = await getHighlightsByUsersAndPapers([userData.id], [viewingPaperId]);
    const highlights = highlightsByUserAndPaper[`${userData.id}_${viewingPaperId}`] || [];

    const purposes = await getPurposesByUserAndPaper(userData.id, viewingPaperId);
    const canvas = await getCanvasUserAndPaper(userData.id, viewingPaperId);
    const sessionsByUserAndPaper = await getSessionsByUsersAndPapers([userData.id], [viewingPaperId]);
    const sessions = sessionsByUserAndPaper[`${userData.id}_${viewingPaperId}`] || [];

    resetReadingControlStates();
    populatePaperAndCanvasData(highlights, purposes, sessions, canvas?.reactFlowJson || "");
  }

  const loadPaperContextForAnalytics = async () => {
    if (!viewingPaperId || !userData || viewingPaperId !== selectedPaper) {
      resetPaperContext();
      return;
    }

    if (analyticsLevel === AnalyticsLevel.PAPERS) {
      populatePaperAndCanvasData(undefined, undefined, undefined, undefined);
    }
    else if (analyticsLevel === AnalyticsLevel.USERS) {
      populatePaperAndCanvasData(Object.values(analyticsHighlights).flat(), undefined, undefined, undefined);
    }
    else if (analyticsLevel === AnalyticsLevel.PURPOSES) {
      populatePaperAndCanvasData(Object.values(analyticsHighlights).flat(), Object.values(analyticsPurposes).flat(), Object.values(analyticsSessions).flat(), analyticsCanvasJSON);
    }
  }

  const populatePaperAndCanvasData = (highlights?: ReadHighlight[], purposes?: ReadPurpose[], sessions?: ReadSession[], canvasJSON?: string) => {
    setHighlights(highlights || []);
    setReadPurposes(purposes?.reduce((acc, purpose) => {
      acc[purpose.id] = purpose;
      return acc;
    }, {} as Record<string, ReadPurpose>) || {});
    setReadSessions(sessions?.reduce((acc, session) => {
      acc[session.id] = session;
      return acc;
    }, {} as Record<string, ReadSession>) || {});
    setDisplayedReads(purposes?.map((p) => p.id) || []);
    const reactFlowJson = JSON.parse(canvasJSON || "{}");
    setNodes(reactFlowJson.nodes as Node[] || []);
    setEdges(reactFlowJson.edges as Edge[] || []);
  }

  useEffect(() => {
    setEdges(edges?.map((e: Edge) => ({
      ...e,
      hidden: !displayEdgeTypes.includes(e.type ?? "")
    })));
  }, [displayEdgeTypes]);

  const generateReadingGoals = async () => {
    if (!pdfViewerRef.current || !userData?.aiConfig?.enabled || !userData?.aiConfig?.apiKey) {
      return {} as ReadSuggestion;
    }

    const paperContent = await pdfViewerRef.current.getAllText();

    const completedGoals = Object.keys(readPurposes).length > 0 ? Object.values(readPurposes).map((r, idx) => `${idx + 1}. ${r.title}: ${r.description}`).join("\n") : "No reading goals have been completed yet.";

    const goalGenerationPrompt = userData.aiConfig.customPrompt;
    const prompt = goalGenerationPrompt + "\n\n" + completedGoals + "\n\n" + "Below is the full text of the paper:\n" + paperContent;

    const response = await query_gemini(prompt);

    if (response) {
      return JSON.parse(response) as ReadSuggestion;
    }

    return {} as ReadSuggestion;
  }

  const processHighlightText = (highlight: GhostHighlight) => {
    if (highlight.type === "text") {
      const text = highlight.content.text?.trim() ?? "";
      const words = text.split(/\s+/);
      const truncatedText = words.length > 10 ? words.slice(0, 10).join(" ") + "..." : text;
      return {
        type: highlight.type,
        label: truncatedText,
        content: highlight.content.text,
      };
    } else if (highlight.type === "area") {
      return {
        type: highlight.type,
        label: "Image",
        content: highlight.content.image,
      };
    }
  };

  const addHighlight = (highlight: GhostHighlight) => {
    const id = uuidv4();

    if (!pdfViewerRef.current) return;
    const pdfPageHeight = pdfViewerRef.current.getPageView(0).height;
    const highlightPosition = highlight.position.boundingRect.y1 + (highlight.position.boundingRect.pageNumber - 1) * pdfPageHeight;
    const posPercentage = highlightPosition / (pdfViewerRef.current.pagesCount * pdfPageHeight);

    const isFirstHighlightOfPurpose = highlights.filter((h) => h.readPurposeId === currentReadId).length === 0;

    setHighlights((prevHighlights: Array<ReadHighlight>) => [
      ...prevHighlights,
      {
        ...highlight,
        id: id,
        userId: userData!.id,
        paperId: viewingPaperId!,
        readPurposeId: currentReadId,
        sessionId: currentSessionId,
        timestamp: Date.now(),
        posPercentage: posPercentage,
      },
    ]);

    // add a node to the graph
    setNodes((prevNodes: Array<Node>) => [
      ...prevNodes,
      {
        id: id,
        type: NODE_TYPES.HIGHLIGHT,
        data: {
          id: id,
          readPurposeId: currentReadId,
          ...processHighlightText(highlight),
          notes: "",
        },
        position: {
          x: isFirstHighlightOfPurpose
            ? Object.keys(readPurposes).findIndex((id) => id === currentReadId) * NODE_OFFSET_X
            : nodes[nodes.length - 1].position.x,
          y: isFirstHighlightOfPurpose ? NODE_OFFSET_Y : nodes[nodes.length - 1].position.y + NODE_OFFSET_Y,
        },
        style: {
          backgroundColor: readPurposes[currentReadId].color,
        }
      },
    ]);

    // add an chronological edge to the graph
    if (nodes.length > 0) {
      const lastHighlightId = nodes[nodes.length - 1].id;
      setEdges((prevEdges: Array<Edge>) => [
        ...prevEdges,
        {
          id: uuidv4(),
          source: lastHighlightId,
          sourceHandle: `chronological-handle-${lastHighlightId}-source`,
          target: id,
          targetHandle: `chronological-handle-${id}-target`,
          type: EDGE_TYPES.CHRONOLOGICAL,
          markerEnd: CHRONOLOGICAL_EDGE_MARKER_END,
          hidden: !displayEdgeTypes.includes(EDGE_TYPES.CHRONOLOGICAL)
        },
      ]);
    }
  };

  const removeHighlight = (highlightId: string) => {
    let newEdges = [...edges];

    // process connected chronological edges
    const incomingChronologicalEdge = edges.filter((e) => e.type === EDGE_TYPES.CHRONOLOGICAL && e.target === highlightId);
    const fromHighlightId = incomingChronologicalEdge.length > 0 ? incomingChronologicalEdge[0].source : null;
    const outgoingChronologicalEdge = edges.filter((e) => e.type === EDGE_TYPES.CHRONOLOGICAL && e.source === highlightId);
    const toHighlightId = outgoingChronologicalEdge.length > 0 ? outgoingChronologicalEdge[0].target : null;

    if (fromHighlightId && toHighlightId) {
      newEdges = [
        ...newEdges,
        {
          id: uuidv4(),
          source: fromHighlightId,
          sourceHandle: `chronological-handle-${fromHighlightId}-source`,
          target: toHighlightId,
          targetHandle: `chronological-handle-${toHighlightId}-target`,
          type: EDGE_TYPES.CHRONOLOGICAL,
          markerEnd: CHRONOLOGICAL_EDGE_MARKER_END,
          hidden: !displayEdgeTypes.includes(EDGE_TYPES.CHRONOLOGICAL)
        },
      ];
    }

    newEdges = newEdges.filter((e) => e.id !== highlightId && e.source !== highlightId && e.target !== highlightId);
    setEdges(newEdges);
    setNodes(nodes.filter((n) => n.id !== highlightId));
    setHighlights(highlights.filter((h) => h.id !== highlightId));
    setSelectedHighlightIds((prev) => prev.filter((id) => id !== highlightId));
  }

  const updateNodeData = (nodeId: string, data: Partial<NodeData>) => {
    let currentNodes = [...nodes];
    currentNodes = currentNodes.map((node) => {
      if (node.id === nodeId) {
        return { ...node, data: { ...node.data, ...data } };
      }
      return node;
    });

    setNodes(currentNodes);
  };

  const getNodeColor = (readPurposeId: string) => {
    if (displayedReads.includes(readPurposeId)) {
      return readPurposes[readPurposeId].color;
    }
    else {
      return "#e6e6e6";
    }
  }

  const onConnect = (connection: Connection) => {
    selectedHighlightIds.forEach((selectedId) => {
      if (selectedHighlightIds.includes(connection.target)) return;

      const edge = {
        source: selectedId,
        target: connection.target,
        sourceHandle: `relational-handle-${selectedId}-source`,
        targetHandle: `relational-handle-${connection.target}-target`,
        id: `relational-${selectedId}-${connection.target}`,
        type: EDGE_TYPES.RELATIONAL,
        markerEnd: RELATIONAL_EDGE_MARKER_END,
        hidden: !displayEdgeTypes.includes(EDGE_TYPES.RELATIONAL)
      };

      setEdges((prevEdges) => addEdge(edge as Edge, prevEdges));
    });

    // clear the selected highlight ids
    setSelectedHighlightIds([]);
  };


  const createGroupNode = (childNodeIds: string[], label?: string) => {
    if (childNodeIds.length < 2) return; // Need at least 2 nodes to create a group

    // Create a new group node
    let graphNodes = [...nodes];
    const newGroupNodeId = uuidv4();
    const selectedNodes = nodes.filter(node => childNodeIds.includes(node.id));

    const groupNode = {
      id: newGroupNodeId,
      type: NODE_TYPES.THEME,
      data: {
        id: newGroupNodeId,
        readPurposeId: currentReadId,
        label: label || `Group (${childNodeIds.length} nodes)`,
        notes: "",
      },
      position: {
        x: selectedNodes.reduce((sum, node) => sum + node.position.x, 0) / selectedNodes.length + NODE_OFFSET_X,
        y: selectedNodes.reduce((sum, node) => sum + node.position.y, 0) / selectedNodes.length,
      },
      style: {
        backgroundColor: readPurposes[currentReadId].color,
      }
    };

    // Add chronological edge if there are existing nodes
    if (graphNodes.length > 0) {
      const lastId = graphNodes[graphNodes.length - 1].id;
      setEdges((prevEdges: Array<Edge>) => [
        ...prevEdges,
        {
          id: `chronological-${newGroupNodeId}`,
          source: lastId,
          sourceHandle: `chronological-handle-${lastId}-source`,
          target: newGroupNodeId,
          targetHandle: `chronological-handle-${newGroupNodeId}-target`,
          type: EDGE_TYPES.CHRONOLOGICAL,
          markerEnd: CHRONOLOGICAL_EDGE_MARKER_END,
          hidden: !displayEdgeTypes.includes(EDGE_TYPES.CHRONOLOGICAL)
        },
      ]);
    }

    // Create edges from the group node to each child node
    const newEdges = childNodeIds.map(nodeId => ({
      id: `group-${newGroupNodeId}-${nodeId}`,
      source: newGroupNodeId,
      sourceHandle: `relational-handle-${newGroupNodeId}-source`,
      target: nodeId,
      targetHandle: `relational-handle-${nodeId}-target`,
      type: EDGE_TYPES.RELATIONAL,
      markerEnd: RELATIONAL_EDGE_MARKER_END,
      hidden: !displayEdgeTypes.includes(EDGE_TYPES.RELATIONAL)
    }));

    // Add the group node to the nodes array
    graphNodes = [...graphNodes, groupNode];

    setNodes(graphNodes);
    setEdges(prevEdges => [...prevEdges, ...newEdges]);
  }

  const deleteHighlight = (highlightId: string) => {
    console.log("Delete highlight", highlightId);
    setHighlights(highlights.filter((h) => h.id !== highlightId));
    setNodes(nodes.filter((n) => n.id !== highlightId));
    // TODO: connnect prev and next node
    setEdges(edges.filter((e) => e.id !== highlightId && e.source !== highlightId && e.target !== highlightId));
    setSelectedHighlightIds([]);
  };

  const resetHighlights = () => {
    console.log("Reset highlights");
    setHighlights([]);
    setNodes([]);
    setEdges([]);
    setSelectedHighlightIds([]);
  };

  const createRead = (title: string, color: string, description?: string, readId?: string) => {
    if (!userData || !viewingPaperId) return;

    const newReadId = readId || uuidv4();
    setReadPurposes((prevReadRecords) => ({
      ...prevReadRecords,
      [newReadId]: {
        id: newReadId,
        paperId: viewingPaperId,
        userId: userData.id,
        title,
        color,
        description,
      },
    }));
    setCurrentReadId(newReadId);
    toggleRead(newReadId, true);
  };

  const toggleRead = (readId: string, forceShow: boolean = false) => {
    if (displayedReads.includes(readId)) {
      if (forceShow) return;
      setDisplayedReads(displayedReads.filter((id) => id !== readId));
    } else {
      setDisplayedReads([...displayedReads, readId]);
    }
  };

  // Create a new reading session
  const createNewReadingSession = (readId: string) => {
    console.log('Creating new reading session', readId);

    const sessionId = uuidv4();
    setCurrentSessionId(sessionId);

    const startTime = Date.now();

    const scrollPosPercentage = pdfViewerRef.current!.scroll.lastY / (pdfViewerRef.current!.pagesCount * pdfViewerRef.current!.getPageView(0).height);

    setReadSessions(prev => ({
      ...prev,
      [sessionId]: {
        id: sessionId,
        userId: userData!.id,
        paperId: viewingPaperId!,
        readPurposeId: readId,
        startTime: startTime,
        duration: 0,
        scrollSequence: [scrollPosPercentage],
      },
    }));

    return sessionId;
  };

  // Update the reading session
  const updateReadingSession = () => {
    if (!currentSessionIdRef.current || !pdfViewerRef.current) return;

    const sessionId = currentSessionIdRef.current;
    if (!sessionId) return;

    const timestamp = Date.now();
    const focusCenter = pdfViewerRef.current.container.clientHeight / 2;
    const scrollPosPercentage = (pdfViewerRef.current.scroll.lastY + focusCenter) / (pdfViewerRef.current.pagesCount * pdfViewerRef.current.getPageView(0).height);

    setReadSessions(prev => ({
      ...prev,
      [sessionId]: {
        ...prev[sessionId],
        duration: timestamp - prev[sessionId].startTime,
        scrollSequence: [...prev[sessionId].scrollSequence, scrollPosPercentage],
      },
    }));
  }

  // Start updating the reading session every UPDATE_INTERVAL milliseconds
  const startUpdateReadingSession = () => {
    updateIntervalRef.current = setInterval(() => {
      updateReadingSession();
    }, UPDATE_INTERVAL);
  };

  // Stop updating the reading session
  const stopUpdateReadingSession = () => {
    console.log('Stopping current update interval');

    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
  };

  // Start tracking new reading session when current read changes
  useEffect(() => {
    // Stop existing reading session
    stopUpdateReadingSession();

    if (currentReadId !== "") {
      // Start new reading session
      const sessionId = createNewReadingSession(currentReadId);
      currentSessionIdRef.current = sessionId;
      toggleRead(currentReadId, true);
      startUpdateReadingSession();
    }

    return () => {
      stopUpdateReadingSession();
    };
  }, [currentReadId]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && currentSessionIdRef.current) {
        // Store the current session before stopping
        stopUpdateReadingSession();
        console.log('Visibility change: Hidden', currentSessionIdRef.current);
      } else if (!document.hidden && currentSessionIdRef.current) {
        // Resume the previous session when page becomes visible
        startUpdateReadingSession();
        console.log('Visibility change: Visible', currentSessionIdRef.current);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentSessionIdRef.current]);

  const saveReadingData = async () => {
    if (!userData) {
      alert("Please login to save your work");
      return;
    }

    try {
      const purposes = Object.values(readPurposes);
      await batchAddPurposes(purposes);
      await batchAddHighlights(highlights);
      await batchAddSessions(Object.values(readSessions));

      const canvasId = `${userData.id}_${viewingPaperId}`;
      const canvas: Canvas = {
        id: canvasId,
        userId: userData.id,
        paperId: viewingPaperId!,
        reactFlowJson: JSON.stringify({
          nodes: nodes,
          edges: edges,
        }),
      }
      await updateCanvas(canvas);

    } catch (error: any) {
      console.error('Error saving data:', error);
      alert('Failed to save data. Please try again.');
    }
  }

  const query_gemini = async (prompt: string, data?: any) => {
    if (!userData?.aiConfig?.enabled || !userData?.aiConfig?.apiKey) {
      throw new Error("AI features are not enabled or API key is missing");
    }

    const ai = new GoogleGenAI({ apiKey: userData.aiConfig.apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents:
        prompt + (data ? "\n" + data : ""),
      config: {
        systemInstruction: READING_SUGGESTION_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            readingProgress: {
              type: Type.STRING,
            },
            readingGoals: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  goalName: {
                    type: Type.STRING,
                  },
                  goalDescription: {
                    type: Type.STRING,
                  },
                },
              },
            },
          },
        },
      },
    });

    return response.text ?? "";
  }

  return (
    <PaperContext.Provider
      value={{
        // Paper
        paperUrl,
        setPaperUrl,
        generateReadingGoals,
        highlights,
        setHighlights,
        addHighlight,
        removeHighlight,
        updateNodeData,
        deleteHighlight,
        resetHighlights,
        pdfViewerRef,
        // Graph
        nodes,
        setNodes,
        onNodesChange,
        edges,
        setEdges,
        onEdgesChange,
        onConnect,
        onSelectNode,
        setOnSelectNode,
        createGroupNode,
        displayEdgeTypes,
        setDisplayEdgeTypes,
        getNodeColor,
        // Shared
        readPurposes,
        createRead,
        currentReadId,
        setCurrentReadId,
        currentSessionId,
        setCurrentSessionId,
        displayedReads,
        setReadPurposes,
        toggleRead,
        selectedHighlightIds,
        setSelectedHighlightIds,
        // Read Log
        readSessions,
        setReadSessions,
        stopUpdateReadingSession,
        // LLM
        query_gemini,
        // Data
        saveReadingData,
        resetPaperContext,
        loadPaperContext,
      }}
    >
      {children}
    </PaperContext.Provider>
  );
};

export const usePaperContext = () => {
  const context = useContext(PaperContext);
  if (context === undefined) {
    throw new Error('usePaperContext must be used within a PaperContextProvider');
  }

  return context;
};