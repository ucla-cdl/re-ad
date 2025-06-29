import "@xyflow/react/dist/style.css";
import Dagre from '@dagrejs/dagre';
import { useState, useEffect, useCallback } from "react";
import {
  ReactFlow,
  type OnNodeDrag,
  Background,
  Controls,
  MiniMap,
  Panel,
  NodeMouseHandler,
  useReactFlow,
  ReactFlowProvider,
  type Node,
} from "@xyflow/react";
import { Box, Checkbox, FormControlLabel, FormGroup, IconButton } from "@mui/material";
import HighlightNode from "../components/graph-components/HighlightNode";
import OverviewNode from "../components/graph-components/OverviewNode";
import ChronologicalEdge from "../components/graph-components/ChronologicalEdge";
import RelationalEdge from "../components/graph-components/RelationalEdge";
import { usePaperContext, EDGE_TYPES } from "../contexts/PaperContext";
import NodeEditor from "../components/node-components/NodeEditor";
import { CloseFullscreen, OpenInFull } from "@mui/icons-material";
import GroupNode from "../components/graph-components/GroupNode";

const nodeTypes = {
  highlight: HighlightNode,
  overview: OverviewNode,
  group: GroupNode,
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
    selectedHighlightId,
    setSelectedHighlightId,
    onSelectNode,
    setOnSelectNode,
    createGroupNode,
    displayEdgeTypes,
    setDisplayEdgeTypes
  } = props;

  const { fitView, getIntersectingNodes } = useReactFlow();
  const [isOverview, setIsOverview] = useState(false);

  const onNodeDrag: OnNodeDrag = useCallback((_, node) => {
    const intersections = getIntersectingNodes(node).map((n) => n.id);

    setNodes((ns: Node[]) =>
      ns.map((n) => ({
        ...n,
        data: {
          ...n.data,
          intersected: intersections.includes(n.id) ? true : false,
        },
      })),
    );
  }, []);

  const onNodeDragStop: OnNodeDrag = useCallback((_, node) => {
    console.log("onNodeDragStop", node);
    const intersections = getIntersectingNodes(node).map((n) => n.id);
    if (intersections.length > 0) {
      createGroupNode([node.id, ...intersections]);
    }
  }, [createGroupNode]);

  const onNodeClick: NodeMouseHandler = (event, node) => {
    if (isOverview || !event) return;

    setSelectedHighlightId(node.id);
  };

  const onNodeDoubleClick: NodeMouseHandler = (event, node) => {
    console.log("onNodeDoubleClick", node);
    if (isOverview || !event) return;

    setOnSelectNode((prev: boolean) => !prev);
  }

  const openOverview = () => {
    console.log("open Overview");
    if (isOverview) {
      setNodes(nodes.map((node: any) => ({ ...node, type: "highlight" })));
    } else {
      setNodes(nodes.map((node: any) => ({ ...node, type: "overview" })));
    }

    setSelectedHighlightId(null);
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
    if (selectedHighlightId && onSelectNode) {
      console.log("viewport focus on selected node");
      const selectedNode = nodes.find((node: any) => node.id === selectedHighlightId);
      fitView({ padding: 3.5, nodes: [selectedNode] });
    }
    else {
      fitView({ padding: 1 });
    }
  }, [nodes, onSelectNode, selectedHighlightId]);

  const changeDisplayEdgeTypes = (edgeType: string) => {
    setDisplayEdgeTypes(displayEdgeTypes.includes(edgeType) ? displayEdgeTypes.filter((type: string) => type !== edgeType) : [...displayEdgeTypes, edgeType]);
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeDrag={onNodeDrag}
      onNodeDragStop={onNodeDragStop}
      onNodeClick={onNodeClick}
      onNodeDoubleClick={onNodeDoubleClick}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView
      style={{ width: "100%", height: "100%" }}
    >
      <Background />
      <Controls onFitView={() => onLayout("TB")} style={{ color: "black" }} />
      <MiniMap />

      <Panel position="top-left" style={{ color: "black" }}>
        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox
                checked={displayEdgeTypes.includes(EDGE_TYPES.CHRONOLOGICAL)}
                onClick={() => changeDisplayEdgeTypes(EDGE_TYPES.CHRONOLOGICAL)}
              />
            }
            label="Chronological Link"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={displayEdgeTypes.includes(EDGE_TYPES.RELATIONAL)}
                onClick={() => changeDisplayEdgeTypes(EDGE_TYPES.RELATIONAL)}
              />
            }
            label="Relational Link"
          />
        </FormGroup>
      </Panel>
      <Panel position="top-right">
        <IconButton onClick={openOverview}>{isOverview ? <CloseFullscreen /> : <OpenInFull />}</IconButton>
      </Panel>
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
    selectedHighlightId,
    setSelectedHighlightId,
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
          selectedHighlightId={selectedHighlightId}
          setSelectedHighlightId={setSelectedHighlightId}
          onSelectNode={onSelectNode}
          setOnSelectNode={setOnSelectNode}
          createGroupNode={createGroupNode}
          displayEdgeTypes={displayEdgeTypes}
          setDisplayEdgeTypes={setDisplayEdgeTypes}
        />
      </ReactFlowProvider>

      {onSelectNode && selectedHighlightId && (
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
