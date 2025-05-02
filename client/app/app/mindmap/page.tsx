'use client'

import { SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  applyNodeChanges, 
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  Node,
  Edge,
  NodeTypes,
  EdgeTypes,
  MarkerType,
  Panel
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Custom node component with better styling for a hierarchical diagram
const CustomNode = ({ data, id }: { data: any; id: string }) => {
  return (
    <div className={`px-4 py-2 shadow-md rounded-md border-2 text-center min-w-[180px] max-w-[250px]
      ${id === 'main' 
        ? 'bg-blue-100 border-blue-500 font-bold' 
        : id.startsWith('header-') 
          ? 'bg-slate-100 border-slate-400 font-semibold' 
          : 'bg-white border-gray-200'
      }`}>
      <div className="truncate text-sm">{data.label}</div>
    </div>
  );
};

export default function Mindmap() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [dataSource, setDataSource] = useState<'localStorage' | 'api' | 'default'>('default');
  
  // Define custom node types
  const nodeTypes = useMemo(() => ({ 
    custom: CustomNode 
  }), []);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [],
  );
  
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [],
  );

  // Process nodes and edges to apply styling
  const processNodesAndEdges = useCallback((rawNodes: Node[], rawEdges: Edge[]) => {
    // Add custom styling to nodes
    const styledNodes = rawNodes.map(node => ({
      ...node,
      type: 'custom', // Use our custom node component
      style: {
        width: 'auto',
        height: 'auto',
      }
    }));

    // Add custom styling to edges
    const styledEdges = rawEdges.map(edge => {
      const edgeType = edge.type || 'smoothstep';
      const isTagConnection = edge.id.startsWith('e-tag-');
      
      return {
        ...edge,
        type: edgeType,
        animated: isTagConnection,
        style: {
          stroke: getEdgeColor(edge.label as string, isTagConnection),
          strokeWidth: isTagConnection ? 1 : 1.5,
          strokeDasharray: isTagConnection ? '5,5' : undefined
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: getEdgeColor(edge.label as string, isTagConnection),
          width: 15,
          height: 15
        },
        labelStyle: {
          fill: getEdgeColor(edge.label as string, isTagConnection),
          fontWeight: '500',
          fontSize: '10px'
        },
        labelBgStyle: {
          fill: '#ffffff',
          fillOpacity: 0.8,
          rx: 10,
          ry: 10
        }
      };
    });

    return { nodes: styledNodes, edges: styledEdges };
  }, []);

  // Helper function to determine edge color based on priority or label
  const getEdgeColor = (label: string | undefined, isTagConnection: boolean) => {
    if (!label) return '#94a3b8';
    const lowercaseLabel = label.toLowerCase();
    
    if (isTagConnection) {
      // Tag-based connections use different colors
      if (lowercaseLabel.includes('web3')) return '#8b5cf6';
      if (lowercaseLabel.includes('blockchain')) return '#3b82f6';
      if (lowercaseLabel.includes('security')) return '#ec4899';
      return '#6366f1'; // Default for tag connections
    }
    
    // Priority-based connections
    if (lowercaseLabel.includes('critical')) return '#ef4444';
    if (lowercaseLabel.includes('high')) return '#f97316';
    if (lowercaseLabel.includes('medium')) return '#eab308';
    if (lowercaseLabel.includes('low')) return '#22c55e';
    
    return '#94a3b8'; // Default gray
  };

  useEffect(() => {
    // Check for data in localStorage when component mounts
    if (typeof window !== 'undefined') {
      const storedData = localStorage.getItem('mindmapData');
      if (storedData) {
        try {
          const { nodes: storedNodes, edges: storedEdges } = JSON.parse(storedData);
          if (Array.isArray(storedNodes) && Array.isArray(storedEdges)) {
            const { nodes: processedNodes, edges: processedEdges } = processNodesAndEdges(storedNodes, storedEdges);
            setNodes(processedNodes);
            setEdges(processedEdges);
            setDataSource('localStorage');
            toast.success('Loaded mindmap from your learning path');
          }
        } catch (err) {
          console.error('Error parsing mindmap data from localStorage:', err);
          toast.error('Error loading saved mindmap');
        }
      }
    }
  }, [processNodesAndEdges]);

  const generateMindmap = async () => {
    if (!topic) {
      setError('Please enter a topic');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/mindmap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate mindmap');
      }
      
      if (data.result && data.result.nodes && data.result.edges) {
        const { nodes: processedNodes, edges: processedEdges } = processNodesAndEdges(data.result.nodes, data.result.edges);
        setNodes(processedNodes);
        setEdges(processedEdges);
        setDataSource('api');
        // Clear localStorage data to avoid confusion
        localStorage.removeItem('mindmapData');
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: unknown) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const clearMindmap = () => {
    setNodes([]);
    setEdges([]);
    setDataSource('default');
    localStorage.removeItem('mindmapData');
    toast.success('Mindmap cleared');
  };

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 p-4 border-b">
            <Input 
              placeholder="Enter a topic for your mindmap..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && generateMindmap()}
              disabled={isLoading}
              className="flex-1"
            />
            <Button onClick={generateMindmap} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate'
              )}
            </Button>
            {nodes.length > 0 && (
              <Button 
                variant="outline" 
                onClick={clearMindmap}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                Clear
              </Button>
            )}
          </div>
          
          {error && (
            <div className="p-2 text-sm text-red-500">
              {error}
            </div>
          )}
          
          {dataSource === 'localStorage' && (
            <div className="p-2 text-sm text-purple-700 bg-purple-50 border-b border-purple-100">
              Showing mindmap from your learning path. Generate a new mindmap to replace it.
            </div>
          )}
          
          <div className="flex-1 bg-gray-50">
            {nodes.length > 0 ? (
              <ReactFlow
                nodes={nodes}
                onNodesChange={onNodesChange}
                edges={edges}
                onEdgesChange={onEdgesChange}
                fitView
                nodeTypes={nodeTypes}
                defaultEdgeOptions={{
                  type: 'smoothstep'
                }}
                proOptions={{ hideAttribution: true }}
              >
                <Background color="#e5e7eb" gap={16} size={1} />
                <Controls />
                <Panel position="top-center" className="bg-white bg-opacity-75 p-2 rounded shadow">
                  <h3 className="text-sm font-medium">Learning Path Mindmap</h3>
                </Panel>
              </ReactFlow>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                {isLoading ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
                    <p>Generating your mindmap...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center max-w-md text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <p className="mb-2">Enter a topic and click Generate to create a mindmap</p>
                    <p className="text-sm text-gray-400">Example topics: Web3 Development, Blockchain Security, Smart Contract Development</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}