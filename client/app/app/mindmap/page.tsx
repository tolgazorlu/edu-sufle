'use client'

import { SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { SiteHeader } from '@/components/site-header';
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
  MarkerType,
  Panel,
  Connection,
  addEdge,
  EdgeProps
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Custom node component with better styling
const CustomNode = ({ data }: { data: any }) => {
  return (
    <div className="px-4 py-2 shadow-md rounded-md border-2 text-center min-w-[180px] max-w-[250px] bg-white border-blue-200 hover:border-blue-400 transition-colors">
      <div className="truncate text-sm font-medium">{data.label}</div>
    </div>
  );
};

// Define custom edge types
const StraightEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style = {},
  markerEnd,
}: EdgeProps) => {
  return (
    <>
      <path
        id={id}
        style={{
          ...style,
          stroke: '#1a365d',
          strokeWidth: 2,
        }}
        className="react-flow__edge-path"
        d={`M${sourceX},${sourceY} L${targetX},${targetY}`}
        markerEnd={markerEnd}
      />
    </>
  );
};

export default function Mindmap() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [dataSource, setDataSource] = useState<'localStorage' | 'api' | 'default'>('default');
  const [connectedAddress, setConnectedAddress] = useState("");
  const [accountBalance, setAccountBalance] = useState("0");
  
  // Define custom node and edge types
  const nodeTypes = useMemo(() => ({ 
    custom: CustomNode 
  }), []);

  const edgeTypes = useMemo(() => ({
    custom: StraightEdge
  }), []);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [],
  );
  
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [],
  );

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [],
  );

  // Apply styling to nodes and edges
  const processNodesAndEdges = useCallback((rawNodes: Node[], rawEdges: Edge[]) => {
    console.log("Processing raw nodes:", rawNodes);
    console.log("Processing raw edges:", rawEdges);
    
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
    const styledEdges = rawEdges.map(edge => ({
      ...edge,
      type: 'custom', // Use our custom edge component
      animated: false,
      style: { 
        stroke: '#1a365d', 
        strokeWidth: 2,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: '#1a365d'
      }
    }));

    console.log("Styled nodes:", styledNodes);
    console.log("Styled edges:", styledEdges);

    return { nodes: styledNodes, edges: styledEdges };
  }, []);

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
        console.log("Received mindmap data:", JSON.stringify(data.result));
        
        // Validate that we have edges before proceeding
        if (!data.result.edges || data.result.edges.length === 0) {
          // Create default edges if none exist
          data.result.edges = [];
          for (let i = 2; i <= data.result.nodes.length; i++) {
            data.result.edges.push({
              id: `e${i-1}`,
              source: "1",
              target: i.toString(),
              type: "straight"
            });
          }
        }
        
        const { nodes: processedNodes, edges: processedEdges } = processNodesAndEdges(data.result.nodes, data.result.edges);
        setNodes(processedNodes);
        setEdges(processedEdges);
        setDataSource('api');
        
        // Save to localStorage for later use
        localStorage.setItem('mindmapData', JSON.stringify(data.result));
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

  const handleConnect = (address: string) => {
    setConnectedAddress(address);
  };

  const handleDisconnect = () => {
    setConnectedAddress("");
  };

  const handleBalanceUpdate = (balance: string) => {
    setAccountBalance(balance);
  };

  // Input component to be reused in multiple places
  const InputContainer = () => (
    <div className="flex items-center gap-3 p-2 px-5 bg-gradient-to-r from-violet-500/80 to-indigo-400/80 hover:from-violet-500/90 hover:to-indigo-400/90 backdrop-blur-md rounded-full shadow-lg border border-violet-300/30 transition-all min-w-[550px]">
      <div className="relative flex-1">
        <Input 
          placeholder="Enter a topic for your mindmap..."
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && generateMindmap()}
          disabled={isLoading}
          className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 pl-2 text-white placeholder:text-white/80"
        />
      </div>
      <Button 
        onClick={generateMindmap} 
        disabled={isLoading}
        className="rounded-full px-6 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 shadow-sm"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          'Generate'
        )}
      </Button>
    </div>
  );

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader 
          title="Learning Path Mindmap" 
          handleConnect={handleConnect} 
          handleDisconnect={handleDisconnect} 
          handleBalanceUpdate={handleBalanceUpdate} 
        />
        <div className="flex flex-col h-full">
          {error && (
            <div className="p-2 text-sm text-red-500">
              {error}
            </div>
          )}
          
          {dataSource === 'localStorage' && (
            <div className="p-2 px-6 text-sm text-purple-700 bg-purple-50 border-b border-purple-100">
              Showing mindmap from your learning path. Generate a new mindmap to replace it.
            </div>
          )}
          
          <div className="flex-1 bg-gray-50 relative">
            {nodes.length > 0 ? (
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                minZoom={0.2}
                style={{ backgroundColor: "#F7F9FB" }}
                defaultEdgeOptions={{
                  type: 'custom'
                }}
                proOptions={{ hideAttribution: true }}
              >
                <Background color="#e5e7eb" gap={16} size={1} />
                <Controls />
                <Panel position="bottom-center" className="bottom-6">
                  <InputContainer />
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
                    <p className="mb-2">Enter a topic below to create a mindmap</p>
                    <p className="text-sm text-gray-400 mb-16">Example topics: Web3 Development, Blockchain Security, Smart Contract Development</p>
                  </div>
                )}
                
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                  <InputContainer />
                </div>
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}