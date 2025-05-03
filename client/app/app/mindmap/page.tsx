'use client';

import {SidebarInset} from '@/components/ui/sidebar';
import {AppSidebar} from '@/components/app-sidebar';
import {SidebarProvider} from '@/components/ui/sidebar';
import {SiteHeader} from '@/components/site-header';
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
    EdgeProps,
    useReactFlow,
    NodeMouseHandler,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import React, {useState, useCallback, useEffect, useMemo} from 'react';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {Loader2, ExternalLink, X} from 'lucide-react';
import {toast} from 'sonner';
import {cn} from '@/lib/utils';
import {ExportButton} from '@/components/export-button';

// Resource type definition
interface Resource {
    title: string;
    description: string;
    url: string;
}

// Node data type with resources
interface NodeData {
    label: string;
    description?: string;
    resources?: Resource[];
    [key: string]: unknown; // Add index signature to satisfy Record<string, unknown> constraint
}

// Custom node component with better styling
const CustomNode = ({data, id}: {data: NodeData; id: string}) => {
    return (
        <div className="px-4 py-2 shadow-md rounded-md border-2 text-center min-w-[180px] max-w-[250px] bg-white border-blue-200 hover:border-blue-400 transition-colors">
            <div className="truncate text-sm font-medium">{data.label}</div>
        </div>
    );
};

// Define custom edge types
const StraightEdge = ({id, sourceX, sourceY, targetX, targetY, style = {}, markerEnd}: EdgeProps) => {
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

// Custom Right Drawer Component
interface RightDrawerProps {
    open: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children: React.ReactNode;
}

const RightDrawer: React.FC<RightDrawerProps> = ({open, onClose, title, description, children}) => {
    return (
        <>
            {/* Overlay */}
            <div
                className={cn('fixed inset-0 bg-black/40 z-50 transition-opacity', open ? 'opacity-100' : 'opacity-0 pointer-events-none')}
                onClick={onClose}
            />

            {/* Drawer panel */}
            <div
                className={cn(
                    'fixed top-0 right-0 h-full w-[400px] max-w-[90vw] bg-white z-50 shadow-xl transform transition-transform duration-300 ease-in-out border-l border-gray-200',
                    open ? 'translate-x-0' : 'translate-x-full'
                )}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-indigo-700">{title}</h2>
                        <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100 transition-colors">
                            <X size={18} className="text-gray-500" />
                        </button>
                    </div>
                    {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto" style={{height: 'calc(100% - 70px)'}}>
                    {children}
                </div>
            </div>
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
    const [connectedAddress, setConnectedAddress] = useState('');
    const [accountBalance, setAccountBalance] = useState('0');
    const [selectedNode, setSelectedNode] = useState<Node<NodeData> | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    // Define custom node and edge types
    const nodeTypes = useMemo(
        () => ({
            custom: CustomNode,
        }),
        []
    );

    const edgeTypes = useMemo(
        () => ({
            custom: StraightEdge,
        }),
        []
    );

    const onNodesChange = useCallback((changes: NodeChange[]) => setNodes(nds => applyNodeChanges(changes, nds)), []);

    const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges(eds => applyEdgeChanges(changes, eds)), []);

    const onConnect = useCallback((params: Connection) => setEdges(eds => addEdge(params, eds)), []);

    // Handle node click to show resources
    const onNodeClick: NodeMouseHandler = useCallback((event, node) => {
        setSelectedNode(node as Node<NodeData>);
        setDrawerOpen(true);
    }, []);

    // Apply styling to nodes and edges
    const processNodesAndEdges = useCallback((rawNodes: Node[], rawEdges: Edge[]) => {
        console.log('Processing raw nodes:', rawNodes);
        console.log('Processing raw edges:', rawEdges);

        // Add custom styling to nodes
        const styledNodes = rawNodes.map(node => ({
            ...node,
            type: 'custom', // Use our custom node component
            style: {
                width: 'auto',
                height: 'auto',
            },
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
                color: '#1a365d',
            },
        }));

        console.log('Styled nodes:', styledNodes);
        console.log('Styled edges:', styledEdges);

        return {nodes: styledNodes, edges: styledEdges};
    }, []);

    useEffect(() => {
        // Check for data in localStorage when component mounts
        if (typeof window !== 'undefined') {
            const storedData = localStorage.getItem('mindmapData');
            if (storedData) {
                try {
                    const {nodes: storedNodes, edges: storedEdges} = JSON.parse(storedData);
                    if (Array.isArray(storedNodes) && Array.isArray(storedEdges)) {
                        const {nodes: processedNodes, edges: processedEdges} = processNodesAndEdges(storedNodes, storedEdges);
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
                body: JSON.stringify({topic}),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate mindmap');
            }

            if (data.result && data.result.nodes && data.result.edges) {
                console.log('Received mindmap data:', JSON.stringify(data.result));

                // Validate that we have edges before proceeding
                if (!data.result.edges || data.result.edges.length === 0) {
                    // Create default edges if none exist
                    data.result.edges = [];
                    for (let i = 2; i <= data.result.nodes.length; i++) {
                        data.result.edges.push({
                            id: `e${i - 1}`,
                            source: '1',
                            target: i.toString(),
                            type: 'straight',
                        });
                    }
                }

                const {nodes: processedNodes, edges: processedEdges} = processNodesAndEdges(data.result.nodes, data.result.edges);
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
        setConnectedAddress('');
    };

    const handleBalanceUpdate = (balance: string) => {
        setAccountBalance(balance);
    };

    // Input component to be reused in multiple places
    const InputContainer = () => (
        <div className="flex items-center gap-3 p-2 px-5 bg-gradient-to-r from-violet-500/80 to-indigo-400/80 hover:from-violet-500/90 hover:to-indigo-400/90 backdrop-blur-md rounded-full shadow-lg border border-violet-300/30 transition-all min-w-[550px] relative z-[100]">
            <div className="relative flex-1">
                <Input
                    placeholder="Enter a topic for your mindmap..."
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    onKeyDown={e => {
                        e.stopPropagation(); // Prevent ReactFlow from intercepting keyboard events
                        if (e.key === 'Enter') generateMindmap();
                    }}
                    onClick={e => e.stopPropagation()} // Prevent click from propagating to ReactFlow
                    disabled={isLoading}
                    className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 pl-2 text-white placeholder:text-white/80"
                    autoFocus
                />
            </div>
            <Button
                onClick={generateMindmap}
                disabled={isLoading}
                className="rounded-full px-6 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 shadow-sm"
                onMouseDown={e => e.preventDefault()} // Prevent focus loss on button click
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
                    {error && <div className="p-2 text-sm text-red-500">{error}</div>}

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
                                onNodeClick={onNodeClick}
                                // nodeTypes={nodeTypes}
                                edgeTypes={edgeTypes}
                                fitView
                                minZoom={0.2}
                                style={{backgroundColor: '#F7F9FB'}}
                                defaultEdgeOptions={{
                                    type: 'custom',
                                }}
                                proOptions={{hideAttribution: true}}
                                disableKeyboardA11y={true}
                            >
                                <Background color="#e5e7eb" gap={16} size={1} />
                                <Controls />
                                <Panel position="top-right" className="top-4 right-4 !z-[90]">
                                    <ExportButton filename={`mindmap-${topic}`} />
                                </Panel>
                                <Panel position="bottom-center" className="bottom-6 !z-[90]">
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
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-16 w-16 text-gray-300 mb-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1}
                                                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                            />
                                        </svg>
                                        <p className="mb-2">Enter a topic below to create a mindmap</p>
                                        <p className="text-sm text-gray-400 mb-16">
                                            Example topics: Web3 Development, Blockchain Security, Smart Contract Development
                                        </p>
                                    </div>
                                )}

                                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-[100]">
                                    <InputContainer />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Resource Right Drawer */}
                    {selectedNode && (
                        <RightDrawer
                            open={drawerOpen}
                            onClose={() => setDrawerOpen(false)}
                            title={`Resources for: ${selectedNode.data.label}`}
                            description="Click on any resource to open it in a new tab"
                        >
                            {/* Node description section */}
                            {selectedNode.data.description && (
                                <div className="mb-6">
                                    <h3 className="text-md font-medium text-gray-800 mb-2">About this topic:</h3>
                                    <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100 text-gray-700">
                                        {selectedNode.data.description}
                                    </div>
                                </div>
                            )}

                            {/* Resources section */}
                            <div>
                                <h3 className="text-md font-medium text-gray-800 mb-3">Learning resources:</h3>
                                {selectedNode.data.resources && selectedNode.data.resources.length > 0 ? (
                                    <div className="space-y-4">
                                        {selectedNode.data.resources.map((resource: Resource, index: number) => (
                                            <div
                                                key={index}
                                                className="p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer"
                                                onClick={() => window.open(resource.url, '_blank')}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <h3 className="font-medium text-indigo-600 mb-1">{resource.title}</h3>
                                                    <ExternalLink className="h-4 w-4 text-gray-400" />
                                                </div>
                                                <p className="text-sm text-gray-600">{resource.description}</p>
                                                <div className="mt-2 text-xs text-gray-400 truncate">{resource.url}</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-8 text-center text-gray-500">
                                        <p>No resources available for this topic.</p>
                                    </div>
                                )}
                            </div>
                        </RightDrawer>
                    )}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
