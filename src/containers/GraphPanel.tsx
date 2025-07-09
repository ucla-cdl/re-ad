import "@xyflow/react/dist/style.css";
import Dagre from '@dagrejs/dagre';
import { useState, useEffect, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  NodeMouseHandler,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import { Box, Checkbox, FormControlLabel, FormGroup, IconButton, Paper } from "@mui/material";
import HighlightNode from "../components/graph-components/HighlightNode";
import OverviewNode from "../components/graph-components/OverviewNode";
import ChronologicalEdge from "../components/graph-components/ChronologicalEdge";
import RelationalEdge from "../components/graph-components/RelationalEdge";
import { usePaperContext, EDGE_TYPES } from "../contexts/PaperContext";
import NodeEditor from "../components/node-components/NodeEditor";
import { CloseFullscreen, OpenInFull, Settings } from "@mui/icons-material";
import ThemeNode from "../components/graph-components/ThemeNode";
import ContextMenu from "../components/graph-components/ContextMenu";
import { ConnectionLineComponent } from "../components/graph-components/utils";

const nodeTypes = {
  highlight: HighlightNode,
  overview: OverviewNode,
  theme: ThemeNode,
};

const edgeTypes = {
  chronological: ChronologicalEdge,
  relational: RelationalEdge,
};

function Flow(props: any) {
  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    selectedHighlightIds,
    setSelectedHighlightIds,
    onSelectNode,
    setOnSelectNode,
    createGroupNode,
    displayEdgeTypes,
    setDisplayEdgeTypes
  } = props;

  const { fitView } = useReactFlow();
  const [isOverview, setIsOverview] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    open: boolean;
    anchorPosition: { top: number; left: number } | undefined;
  }>({ open: false, anchorPosition: undefined });
  const [resetSelectedIdsWhenPaneClick, setResetSelectedIdsWhenPaneClick] = useState(true);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedHighlightIds([]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [setSelectedHighlightIds]);

  const onNodeClick: NodeMouseHandler = (event, node) => {
    if (isOverview || !event) return;

    // Multi-select with Shift key
    if (event.shiftKey) {
      if (selectedHighlightIds.includes(node.id)) {
        // Remove from selection if already selected
        const newSelection = selectedHighlightIds.filter((id: string) => id !== node.id);
        setSelectedHighlightIds(newSelection);
      } else {
        // Add to selection
        const newSelection = [...selectedHighlightIds, node.id];
        setSelectedHighlightIds(newSelection);
      }
    } else {
      // Single select (clear all others)
      setSelectedHighlightIds([node.id]);
    }
  };

  const onNodeDoubleClick: NodeMouseHandler = (event, _node) => {
    if (isOverview || !event) return;

    setOnSelectNode((prev: boolean) => !prev);
  }

  const onNodeContextMenu: NodeMouseHandler = (event, node) => {
    if (isOverview || !event) return;

    event.preventDefault();

    // If the right-clicked node is not selected, select it
    if (!selectedHighlightIds.includes(node.id)) {
      setSelectedHighlightIds([node.id]);
    }

    setContextMenu({
      open: true,
      anchorPosition: { top: event.clientY, left: event.clientX },
    });
  };

  const handleContextMenuClose = () => {
    setContextMenu({ open: false, anchorPosition: undefined });
  };

  const handleCreateGroup = (label: string) => {
    createGroupNode(selectedHighlightIds, label);
    handleContextMenuClose();
  };

  const handleDeleteSelected = () => {
    // TODO: Implement delete multiple nodes functionality
    console.log("Delete selected nodes:", selectedHighlightIds);
    handleContextMenuClose();
  };

  const openOverview = () => {
    console.log("open Overview");
    if (isOverview) {
      setNodes(nodes.map((node: any) => ({ ...node, type: "highlight" })));
    } else {
      setNodes(nodes.map((node: any) => ({ ...node, type: "overview" })));
    }

    setSelectedHighlightIds([]);
    setIsOverview(!isOverview);
  };

  const getLayoutedElements = (nodes: any, edges: any, options: any) => {
    const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
    g.setGraph({ rankdir: options.direction });

    edges.forEach((edge: any) => g.setEdge(edge.source, edge.target));
    nodes.forEach((node: any) =>
      g.setNode(node.id, {
        ...node,
        width: node.measured?.width ?? 0,
        height: node.measured?.height ?? 0,
      }),
    );

    Dagre.layout(g);

    return {
      nodes: nodes.map((node: any) => {
        const position = g.node(node.id);
        // We are shifting the dagre node position (anchor=center center) to the top left
        // so it matches the React Flow node anchor point (top left).
        const x = position.x - (node.measured?.width ?? 0) / 2;
        const y = position.y - (node.measured?.height ?? 0) / 2;

        return { ...node, position: { x, y } };
      }),
      edges,
    };
  };

  const onLayout = useCallback((direction: string) => {
    console.log(nodes);
    const layouted = getLayoutedElements(nodes, edges, { direction });

    setNodes([...layouted.nodes]);
    setEdges([...layouted.edges]);

    window.requestAnimationFrame(() => {
      fitView();
    });
  }, [nodes, edges]);

  useEffect(() => {
    if (selectedHighlightIds.length > 0 && onSelectNode) {
      console.log("viewport focus on selected nodes");
      const selectedNodes = nodes.filter((node: any) => selectedHighlightIds.includes(node.id));
      if (selectedNodes.length > 0) {
        fitView({ padding: 3.5, nodes: selectedNodes });
      }
    }
    else {
      fitView({ padding: 1 });
    }
  }, [nodes, onSelectNode, selectedHighlightIds]);

  const changeDisplayEdgeTypes = (edgeType: string) => {
    setDisplayEdgeTypes(displayEdgeTypes.includes(edgeType) ? displayEdgeTypes.filter((type: string) => type !== edgeType) : [...displayEdgeTypes, edgeType]);
  }

  const toggleSettings = () => {
    setSettingsOpen(!settingsOpen);
  }

  const onPaneClick = () => {
    if (resetSelectedIdsWhenPaneClick) {
      setSelectedHighlightIds([]);
    }

    setResetSelectedIdsWhenPaneClick(true);
  }

  const onConnectEnd = (_event: any, connectionState: any) => {
    // do not reset the selected nodes when the connection is dropped on athe canvas
    if (!connectionState.isValid) {
      console.log("connectionState", connectionState);
      setResetSelectedIdsWhenPaneClick(false);
    }
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      connectionLineComponent={ConnectionLineComponent}
      onNodeClick={onNodeClick}
      onNodeDoubleClick={onNodeDoubleClick}
      onNodeContextMenu={onNodeContextMenu}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView
      onPaneClick={onPaneClick}
      onConnect={onConnect}
      onConnectEnd={onConnectEnd}
      style={{ width: "100%", height: "100%" }}
    >
      <Background />
      <Controls onFitView={() => onLayout("TB")} style={{ color: "black" }} />
      <MiniMap />

      <Panel position="top-right" style={{ color: "black" }}>
        <Box sx={{ position: 'relative' }}>
          <IconButton
            onClick={toggleSettings}
            size="small"
            sx={{
              backgroundColor: settingsOpen ? 'rgba(0, 0, 0, 0.1)' : 'transparent',
              '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.1)' },
              '&:focus': { outline: 'none' }
            }}
          >
            <Settings />
          </IconButton>

          {settingsOpen && (
            <Paper
              elevation={4}
              sx={{
                position: 'absolute',
                top: '100%',
                right: 0,
                mt: 0.5,
                p: 1.5,
                backgroundColor: 'white',
                minWidth: 200,
                zIndex: 1000,
                borderRadius: 1
              }}
            >
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={displayEdgeTypes.includes(EDGE_TYPES.CHRONOLOGICAL)}
                      onChange={() => changeDisplayEdgeTypes(EDGE_TYPES.CHRONOLOGICAL)}
                    />
                  }
                  label="Chronological Link"
                  sx={{ fontSize: '0.875rem', mb: 0.5 }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={displayEdgeTypes.includes(EDGE_TYPES.RELATIONAL)}
                      onChange={() => changeDisplayEdgeTypes(EDGE_TYPES.RELATIONAL)}
                    />
                  }
                  label="Relational Link"
                  sx={{ fontSize: '0.875rem' }}
                />
              </FormGroup>
            </Paper>
          )}
        </Box>
      </Panel>
      <Panel position="top-right">
        <IconButton onClick={openOverview}>{isOverview ? <CloseFullscreen /> : <OpenInFull />}</IconButton>
      </Panel>

      <ContextMenu
        open={contextMenu.open}
        anchorPosition={contextMenu.anchorPosition}
        onClose={handleContextMenuClose}
        onCreateGroup={handleCreateGroup}
        onDeleteSelected={handleDeleteSelected}
        selectedCount={selectedHighlightIds.length}
      />
    </ReactFlow>
  );
}

export default function GraphPanel() {
  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    selectedHighlightIds,
    setSelectedHighlightIds,
    onSelectNode,
    setOnSelectNode,
    createGroupNode,
    displayEdgeTypes,
    setDisplayEdgeTypes
  } = usePaperContext();

  return (
    <Box style={{ width: "100%", height: "100%", position: "relative" }}>
      <ReactFlowProvider>
        <Flow
          style={{ height: "auto" }}
          nodes={nodes}
          edges={edges}
          setNodes={setNodes}
          setEdges={setEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          selectedHighlightIds={selectedHighlightIds}
          setSelectedHighlightIds={setSelectedHighlightIds}
          onSelectNode={onSelectNode}
          setOnSelectNode={setOnSelectNode}
          createGroupNode={createGroupNode}
          displayEdgeTypes={displayEdgeTypes}
          setDisplayEdgeTypes={setDisplayEdgeTypes}
        />
      </ReactFlowProvider>

      {onSelectNode && selectedHighlightIds.length > 0 && (
        <Box
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            height: "40%",
            backgroundColor: "white",
            borderTop: "1px solid #ccc",
            zIndex: 5,
          }}
        >
          <NodeEditor />
        </Box>
      )}
    </Box>
  );
}
