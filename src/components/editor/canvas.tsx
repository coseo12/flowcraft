"use client";

import { useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  type Connection,
  type Node,
  type NodeChange,
  type EdgeChange,
  BackgroundVariant,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { v4 as uuidv4 } from "uuid";
import { useWorkflowStore } from "@/lib/store/workflow-store";
import { useUIStore } from "@/lib/store/ui-store";
import { nodeTypes } from "./nodes";
import { DEFAULT_CONFIGS, type FlowNodeType } from "@/lib/nodes/types";

function FlowCanvasInner() {
  const nodes = useWorkflowStore((s) => s.nodes);
  const edges = useWorkflowStore((s) => s.edges);
  const setNodes = useWorkflowStore((s) => s.setNodes);
  const setEdges = useWorkflowStore((s) => s.setEdges);
  const selectNode = useUIStore((s) => s.selectNode);
  const setBottomTab = useUIStore((s) => s.setBottomTab);
  const { screenToFlowPosition } = useReactFlow();

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes(applyNodeChanges(changes, nodes));
    },
    [nodes, setNodes]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges(applyEdgeChanges(changes, edges));
    },
    [edges, setEdges]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges(addEdge(params, edges));
    },
    [edges, setEdges]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      selectNode(node.id);
      setBottomTab("settings");
    },
    [selectNode, setBottomTab]
  );

  const onPaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const nodeType = event.dataTransfer.getData(
        "application/flowcraft-node-type"
      );
      const nodeLabel = event.dataTransfer.getData(
        "application/flowcraft-node-label"
      );

      if (!nodeType) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const config = DEFAULT_CONFIGS[nodeType as FlowNodeType];
      const newNode: Node = {
        id: `${nodeType}-${uuidv4()}`,
        type: nodeType,
        position,
        data: { label: nodeLabel, ...config },
      };

      setNodes([...nodes, newNode]);
    },
    [nodes, setNodes, screenToFlowPosition]
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={onNodeClick}
      onPaneClick={onPaneClick}
      onDragOver={onDragOver}
      onDrop={onDrop}
      defaultEdgeOptions={{
        animated: true,
        style: { stroke: "#6366f1", strokeWidth: 2 },
      }}
      fitView
      className="bg-background"
    >
      <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#2a2a3a" />
      <Controls
        className="!bg-surface !border-border !shadow-none [&>button]:!bg-surface [&>button]:!border-border [&>button]:!text-foreground [&>button:hover]:!bg-surface-hover"
      />
      <MiniMap
        className="!bg-surface !border-border"
        nodeColor="#6366f1"
        maskColor="rgba(0, 0, 0, 0.5)"
      />
    </ReactFlow>
  );
}

export function FlowCanvas() {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner />
    </ReactFlowProvider>
  );
}
