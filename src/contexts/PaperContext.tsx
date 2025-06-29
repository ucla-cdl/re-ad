import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
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
import { ReadHighlight } from "../components/paper-components/HighlightContainer";
import { NodeData } from "../components/node-components/NodeEditor";
import { TourContext } from "./TourContext";
import { PDFViewer } from "pdfjs-dist/types/web/pdf_viewer";
import { v4 as uuidv4 } from 'uuid';
import { useStorageContext } from "./StorageContext";
import { GoogleGenAI, Type } from "@google/genai";
import { READING_GOAL_GENERATE_PROMPT, READING_GOAL_SYSTEM_PROMPT } from "../utils/prompts";

type PaperContextData = {
  // Paper
  paperId: string | null;
  setPaperId: (paperId: string | null) => void;
  paperUrl: string | null;
  setPaperUrl: (paperUrl: string | null) => void;
  generateReadingGoals: () => Promise<ReadingGoal[]>;
  highlights: Array<ReadHighlight>;
  addHighlight: (highlight: GhostHighlight) => void;
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
  createGroupNode: (nodeIds: string[]) => void;
  displayEdgeTypes: Array<string>;
  setDisplayEdgeTypes: (displayEdgeTypes: Array<string>) => void;
  // Shared
  readRecords: Record<string, ReadRecord>;
  createRead: (title: string, color: string) => void;
  currentReadId: string;
  setCurrentReadId: (readId: string) => void;
  currentSessionId: string;
  setCurrentSessionId: (sessionId: string) => void;
  setReadRecords: (readRecords: Record<string, ReadRecord>) => void;
  displayedReads: Array<string>;
  hideRead: (readId: string) => void;
  showRead: (readId: string) => void;
  selectedHighlightId: string | null;
  setSelectedHighlightId: (highlightId: string | null) => void;
  // LLM
  query_gemini: (prompt: string, data: any) => Promise<string>;
};

const PaperContext = createContext<PaperContextData | undefined>(undefined);

export type ReadRecord = {
  id: string;
  title: string;
  color: string;
  description?: string;
};

export type ReadingGoal = {
  goalName: string;
  goalDescription: string;
}

export const NODE_TYPES = {
  HIGHLIGHT: "highlight",
  OVERVIEW: "overview",
  GROUP: "group",
}

export const EDGE_TYPES = {
  CHRONOLOGICAL: "chronological",
  RELATIONAL: "relational",
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export const PaperContextProvider = ({ children }: { children: React.ReactNode }) => {
  const tourContext = useContext(TourContext);
  if (!tourContext) {
    throw new Error("TourContext not found");
    }
    // const { setRunTour } = tourContext;

  const { userData, getReadingStateData } = useStorageContext();

  // Paper
  const [paperId, setPaperId] = useState<string | null>(null);
  const [paperUrl, setPaperUrl] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<Array<ReadHighlight>>([]);
  const [chronologicalSeq, setChronologicalSeq] = useState(0);
  const pdfViewerRef = useRef<PDFViewer | null>(null);

  // Shared
  const [readRecords, setReadRecords] = useState<Record<string, ReadRecord>>({});
  const [currentReadId, setCurrentReadId] = useState("");
  const [currentSessionId, setCurrentSessionId] = useState("");
  const [selectedHighlightId, setSelectedHighlightId] = useState<string | null>(null);
  const [displayedReads, setDisplayedReads] = useState<Array<string>>([]);

  // Graph
  const [nodes, setNodes, onNodesChange] = useNodesState([] as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([] as Edge[]);
  const [onSelectNode, setOnSelectNode] = useState<boolean>(false);
  const [displayEdgeTypes, setDisplayEdgeTypes] = useState<Array<string>>([EDGE_TYPES.CHRONOLOGICAL, EDGE_TYPES.RELATIONAL]);
  const NODE_OFFSET_X = 150;
  const NODE_OFFSET_Y = 150;

  // LLM
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  useEffect(() => {
    loadPaperContext();
  }, [userData, paperId]);

  const resetControlStates = () => {
    setCurrentReadId("");
    setCurrentSessionId("");
    setSelectedHighlightId(null);
    setDisplayEdgeTypes([EDGE_TYPES.CHRONOLOGICAL, EDGE_TYPES.RELATIONAL]);
  };

  const resetPaperContext = () => {
    setHighlights([]);
    setReadRecords({});
    setNodes([]);
    setEdges([]);
    setDisplayedReads([]);
    resetControlStates();
  };

  const loadPaperContext = async () => {
    if (userData && paperId) {
      console.log("load paper context", userData, paperId);
      const readingStateData = await getReadingStateData(userData.id, paperId);

      if (readingStateData) {
        // Load stored data
        setHighlights(readingStateData.state.highlights);
        setReadRecords(readingStateData.state.readRecords);
        setNodes(readingStateData.state.nodes);
        setEdges(readingStateData.state.edges);
        setDisplayedReads(Object.keys(readingStateData.state.readRecords));
        resetControlStates();
      } else {
        // No reading state data exists - start with fresh state
        resetPaperContext();
      }
    }
  }

  useEffect(() => {
    setChronologicalSeq(highlights.filter((h) => h.id.startsWith(currentReadId.toString())).length);
  }, [currentReadId]);

  useEffect(() => {
    setEdges(edges.map((e: Edge) => ({
      ...e,
      hidden: !displayEdgeTypes.includes(e.type ?? "")
    })));
  }, [displayEdgeTypes]);

  const generateReadingGoals = async () => {
    if (!pdfViewerRef.current) return [] as ReadingGoal[];

    const paperContent = await pdfViewerRef.current.getAllText();

    const completedGoals = Object.values(readRecords).map((r) => r.title + ": " + r.description).join("\n");
    const prompt = READING_GOAL_GENERATE_PROMPT + "\n\n" + completedGoals + "\n\n" + "Below is the full text of the paper:\n" + paperContent;

    const response = await query_gemini(prompt);

    if (response) {
      return JSON.parse(response) as ReadingGoal[];
    }

    return [] as ReadingGoal[];
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
    console.log("Add highlight", highlight, highlights);
    const id = `${currentReadId}-${chronologicalSeq}`;

    setHighlights((prevHighlights: Array<ReadHighlight>) => [
      ...prevHighlights,
      {
        ...highlight,
        id: id,
        readRecordId: currentReadId,
        sessionId: currentSessionId,
        timestamp: Date.now(),
      },
    ]);

    // add a node to the graph
    const isFirstHighlight = chronologicalSeq === 0;
    setNodes((prevNodes: Array<Node>) => [
      ...prevNodes,
      {
        id: id,
        type: NODE_TYPES.HIGHLIGHT,
        data: {
          id: id,
          readRecordId: currentReadId,
          ...processHighlightText(highlight),
          // user notes
          summary: "",
          references: [],
          notes: "",
        },
        position: {
          x: isFirstHighlight
            ? Object.keys(readRecords).findIndex((id) => id === currentReadId) * NODE_OFFSET_X
            : nodes[nodes.length - 1].position.x,
          y: isFirstHighlight ? NODE_OFFSET_Y : nodes[nodes.length - 1].position.y + NODE_OFFSET_Y,
        },
        style: {
          backgroundColor: readRecords[currentReadId].color,
        }
      },
    ]);

    // add an edge to the graph
    if (!isFirstHighlight) {
      // TODO: should chronological link capture the switch between reads?
      const lastId = nodes[nodes.length - 1].id;
      setEdges((prevEdges: Array<Edge>) => [
        ...prevEdges,
        {
          id: id,
          source: lastId,
          sourceHandle: `chronological-handle-${lastId}-source`,
          target: id,
          targetHandle: `chronological-handle-${id}-target`,
          type: EDGE_TYPES.CHRONOLOGICAL,
          markerEnd: { type: MarkerType.Arrow },
          hidden: !displayEdgeTypes.includes(EDGE_TYPES.CHRONOLOGICAL)
        },
      ]);
    }

    setSelectedHighlightId(id);
    setChronologicalSeq((prevChronologicalSeq) => prevChronologicalSeq + 1);
  };

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

  const onConnect = useCallback((connection: Connection) => {
    console.log("Connect", connection);
    const edge = {
      ...connection,
      sourceHandle: `relational-handle-${connection.source}-source`,
      targetHandle: `relational-handle-${connection.target}-target`,
      type: EDGE_TYPES.RELATIONAL,
      markerEnd: { type: MarkerType.Arrow },
      hidden: !displayEdgeTypes.includes(EDGE_TYPES.RELATIONAL)
    };
    setEdges((prevEdges) => addEdge(edge, prevEdges));
  }, []);

  const createGroupNode = (nodeIds: string[]) => {
    if (nodeIds.length === 0) return;

    // Create a new group node
    const id = `${currentReadId}-${chronologicalSeq}`;
    const groupNode = {
      id: id,
      type: NODE_TYPES.HIGHLIGHT,
      data: {
        id: id,
        readRecordId: currentReadId,
        label: 'Group',
        children: nodeIds,
        notes: "",
      },
      position: {
        // Position the group node at the average position of its children
        x: nodes.filter(node => nodeIds.includes(node.id))
          .reduce((sum, node) => sum + node.position.x, 0) / nodeIds.length + NODE_OFFSET_X, // Position slightly right
        y: nodes.filter(node => nodeIds.includes(node.id))
          .reduce((sum, node) => sum + node.position.y, 0) / nodeIds.length
      },
      style: {
        backgroundColor: readRecords[currentReadId].color,
      }
    };

    // Add the group node to the nodes array
    setNodes(prevNodes => [...prevNodes, groupNode]);

    // add an chronological edge
    console.log("nodes", nodes);
    const lastId = nodes[nodes.length - 1].id;
    setEdges((prevEdges: Array<Edge>) => [
      ...prevEdges,
      {
        id: id,
        source: lastId,
        sourceHandle: `chronological-handle-${lastId}-source`,
        target: id,
        targetHandle: `chronological-handle-${id}-target`,
        type: EDGE_TYPES.CHRONOLOGICAL,
        markerEnd: { type: MarkerType.Arrow },
        hidden: !displayEdgeTypes.includes(EDGE_TYPES.CHRONOLOGICAL)
      },
    ]);

    // Create edges from the group node to each child node
    const newEdges = nodeIds.map(nodeId => ({
      id: `${id}-${nodeId}`,
      source: id,
      sourceHandle: `relational-handle-${id}-source`,
      target: nodeId,
      targetHandle: `relational-handle-${nodeId}-target`,
      type: EDGE_TYPES.RELATIONAL,
      hidden: !displayEdgeTypes.includes(EDGE_TYPES.RELATIONAL)
    }));

    setEdges(prevEdges => [...prevEdges, ...newEdges]);

    // update control states
    setChronologicalSeq((prevChronologicalSeq) => prevChronologicalSeq + 1);
  }

  const deleteHighlight = (highlightId: string) => {
    console.log("Delete highlight", highlightId);
    setHighlights(highlights.filter((h) => h.id !== highlightId));
    setNodes(nodes.filter((n) => n.id !== highlightId));
    // TODO: connnect prev and next node
    setEdges(edges.filter((e) => e.id !== highlightId && e.source !== highlightId && e.target !== highlightId));
    setSelectedHighlightId(null);
  };

  const resetHighlights = () => {
    console.log("Reset highlights");
    setHighlights([]);
    setNodes([]);
    setEdges([]);
    setSelectedHighlightId(null);
    setChronologicalSeq(0);
  };

  const createRead = (title: string, color: string) => {
    const newReadId = uuidv4();
    setReadRecords((prevReadRecords) => ({
      ...prevReadRecords,
      [newReadId]: { id: newReadId, title, color },
    }));
    setCurrentReadId(newReadId);
    showRead(newReadId);

    // Start the tour when adding first read -- TODO: redesign tour trigger to be more flexible
    // if (currentReadId === "-1") {
    //   if (Object.keys(readRecords).length === 0) {
    //     setRunTour(true);
    //   }
    // }
  };

  const hideRead = (readId: string) => {
    setDisplayedReads((prevDisplayedReads) => prevDisplayedReads.filter((id) => id !== readId));
  };

  const showRead = (readId: string) => {
    setDisplayedReads((prevDisplayedReads) => [...prevDisplayedReads, readId]);
  };

  const query_gemini = async (prompt: string, data?: any) => {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents:
        prompt + (data ? "\n" + data : ""),
      config: {
        systemInstruction: READING_GOAL_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
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
            }
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
        paperId,
        setPaperId,
        paperUrl,
        setPaperUrl,
        generateReadingGoals,
        highlights,
        setHighlights,
        addHighlight,
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
        // Shared
        readRecords,
        createRead,
        currentReadId,
        setCurrentReadId,
        currentSessionId,
        setCurrentSessionId,
        displayedReads,
        setReadRecords,
        hideRead,
        showRead,
        selectedHighlightId,
        setSelectedHighlightId,
        // LLM
        query_gemini,
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