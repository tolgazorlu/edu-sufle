'use client';

import {useEffect, useState, useCallback, useMemo} from 'react';
import {
    ReactFlow,
    Background,
    applyNodeChanges,
    applyEdgeChanges,
    type NodeChange,
    type EdgeChange,
    type Node,
    type Edge,
    MarkerType,
    Panel,
    type Connection,
    addEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import {Button} from '@/components/ui/button';
import {ArrowRight, Brain, Layers, LineChart, Sparkles, Trophy} from 'lucide-react';
import Image from 'next/image';
import {useOCAuth} from '@opencampus/ocid-connect-js';
import LoginButton from '@/components/LoginButton';
import Link from 'next/link';
import {HoverEffect} from '@/components/ui/card-hover-effect';

const SECTION = [
    {
        icon: <Brain className="w-6 h-6" />,
        title: 'AI-Powered Roadmaps',
        description: 'Generate personalized learning paths tailored to your goals and interests using advanced AI technology.',
    },
    {
        icon: <Trophy className="w-6 h-6" />,
        title: 'Gamified Learning',
        description: 'Complete tasks, earn rewards, and track your progress in an engaging, game-like educational environment.',
    },
    {
        icon: <Layers className="w-6 h-6" />,
        title: 'Blockchain Rewards',
        description: 'Earn EduTokens for completing tasks and receiving community validation on your learning journey.',
    },
    {
        icon: <LineChart className="w-6 h-6" />,
        title: 'Progress Tracking',
        description: 'Monitor your educational growth with detailed analytics and blockchain-verified achievements.',
    },
    {
        icon: <Sparkles className="w-6 h-6" />,
        title: 'Personalized Tasks',
        description: 'Receive custom-tailored assignments that match your learning style and educational objectives.',
    },
    {
        icon: <ArrowRight className="w-6 h-6" />,
        title: 'Decentralized Knowledge',
        description: 'Participate in a community-driven ecosystem that values and rewards knowledge sharing.',
    },
];

// Custom node component with better styling
const CustomNode = ({data, id}: {data: {label: string}; id: string}) => {
    return (
        <div className="px-4 py-2 shadow-md rounded-md border-2 text-center min-w-[180px] max-w-[250px] bg-white border-purple-200 hover:border-purple-400 transition-colors">
            <div className="truncate text-sm font-medium text-slate-800">{data.label}</div>
        </div>
    );
};

// Initial nodes and edges for the flow diagram
const initialNodes: Node[] = [
    {
        id: '1',
        type: 'custom',
        position: {x: 0, y: 0},
        data: {label: 'AI Learning'},
    },
    {
        id: '2',
        type: 'custom',
        position: {x: -150, y: 100},
        data: {label: 'Blockchain Rewards'},
    },
    {
        id: '3',
        type: 'custom',
        position: {x: 150, y: 100},
        data: {label: 'Personalized Tasks'},
    },
    {
        id: '4',
        type: 'custom',
        position: {x: -200, y: 200},
        data: {label: 'Progress Tracking'},
    },
    {
        id: '5',
        type: 'custom',
        position: {x: 0, y: 200},
        data: {label: 'Community Learning'},
    },
    {
        id: '6',
        type: 'custom',
        position: {x: 200, y: 200},
        data: {label: 'Knowledge Sharing'},
    },
];

const initialEdges: Edge[] = [
    {
        id: 'e1-2',
        source: '1',
        target: '2',
        animated: true,
        style: {stroke: '#a855f7', strokeWidth: 3},
        markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 25,
            height: 25,
            color: '#a855f7',
        },
    },
    {
        id: 'e1-3',
        source: '1',
        target: '3',
        animated: true,
        style: {stroke: '#a855f7', strokeWidth: 3},
        markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 25,
            height: 25,
            color: '#a855f7',
        },
    },
    {
        id: 'e2-4',
        source: '2',
        target: '4',
        animated: true,
        style: {stroke: '#a855f7', strokeWidth: 3},
        markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 25,
            height: 25,
            color: '#a855f7',
        },
    },
    {
        id: 'e2-5',
        source: '2',
        target: '5',
        animated: true,
        style: {stroke: '#a855f7', strokeWidth: 3},
        markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 25,
            height: 25,
            color: '#a855f7',
        },
    },
    {
        id: 'e3-5',
        source: '3',
        target: '5',
        animated: true,
        style: {stroke: '#a855f7', strokeWidth: 3},
        markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 25,
            height: 25,
            color: '#a855f7',
        },
    },
    {
        id: 'e3-6',
        source: '3',
        target: '6',
        animated: true,
        style: {stroke: '#a855f7', strokeWidth: 3},
        markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 25,
            height: 25,
            color: '#a855f7',
        },
    },
    // Yeni bağlantılar ekliyorum
    {
        id: 'e4-5',
        source: '4',
        target: '5',
        animated: true,
        style: {stroke: '#a855f7', strokeWidth: 3},
        markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 25,
            height: 25,
            color: '#a855f7',
        },
    },
    {
        id: 'e4-6',
        source: '4',
        target: '6',
        animated: true,
        style: {stroke: '#a855f7', strokeWidth: 3},
        markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 25,
            height: 25,
            color: '#a855f7',
        },
    },
    {
        id: 'e5-6',
        source: '5',
        target: '6',
        animated: true,
        style: {stroke: '#a855f7', strokeWidth: 3},
        markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 25,
            height: 25,
            color: '#a855f7',
        },
    },
];

export default function LandingPage() {
    const {authState} = useOCAuth();
    const [mounted, setMounted] = useState(false);

    // React Flow state
    const [nodes, setNodes] = useState<Node[]>(initialNodes);
    const [edges, setEdges] = useState<Edge[]>(initialEdges);

    // Node types for React Flow

    // React Flow event handlers
    const onNodesChange = useCallback((changes: NodeChange[]) => setNodes(nds => applyNodeChanges(changes, nds)), []);

    const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges(eds => applyEdgeChanges(changes, eds)), []);

    const onConnect = useCallback((params: Connection) => setEdges(eds => addEdge(params, eds)), []);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className="h-full bg-gradient-to-b from-slate-950 to-purple-950 text-white overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div
                    className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse"
                    style={{animationDelay: '1s'}}
                />
                <div
                    className="absolute top-1/3 right-1/4 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl animate-pulse"
                    style={{animationDelay: '2s'}}
                />

                {/* Grid pattern overlay */}
                <div className="absolute inset-0 bg-[url('/placeholder.svg?height=1000&width=1000')] bg-repeat opacity-5" />
            </div>

            {/* Navigation */}
            <nav className="relative z-10 container mx-auto px-4 py-6 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Image src="/sufle.png" alt="Sufle Logo" width={32} height={32} />
                    <span className="text-xl font-bold">Sufle</span>
                </div>
                <div className="hidden md:flex items-center gap-8">
                    <Link href="#features" className="text-sm hover:text-purple-300 transition-colors">
                        Features
                    </Link>
                    <Link href="#how-it-works" className="text-sm hover:text-purple-300 transition-colors">
                        How It Works
                    </Link>
                    <Link href="#technology" className="text-sm hover:text-purple-300 transition-colors">
                        Technology
                    </Link>
                    {mounted && authState.isAuthenticated ? (
                        <Button
                            onClick={() => {
                                window.location.href = '/app';
                            }}
                            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
                        >
                            Go to App
                        </Button>
                    ) : (
                        <LoginButton />
                    )}
                </div>
                <div className="md:hidden">
                    {mounted && authState.isAuthenticated ? (
                        <Button
                            onClick={() => {
                                window.location.href = '/app';
                            }}
                            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
                            size="sm"
                        >
                            Dashboard
                        </Button>
                    ) : (
                        <LoginButton />
                    )}
                </div>
            </nav>

            {/* Hero Section with React Flow */}
            <section className="relative z-10 container mx-auto px-4 pt-16 pb-24 md:pt-24 md:pb-32">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-8">
                        <div>
                            <div className="inline-block px-3 py-1 mb-4 text-xs font-medium bg-purple-900/50 text-purple-300 rounded-full border border-purple-700/50 backdrop-blur-sm">
                                Education AI Coach
                            </div>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-blue-200">
                                Your AI-Guided Learning Journey
                            </h1>
                            <p className="mt-6 text-lg text-slate-300 max-w-lg">
                                Create personalized educational roadmaps, complete tasks, and earn rewards in a decentralized ecosystem
                                powered by blockchain technology.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
                            {mounted && authState.isAuthenticated ? (
                                <Button
                                    onClick={() => {
                                        window.location.href = '/app';
                                    }}
                                    className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-8 py-6 h-auto text-lg group"
                                >
                                    Go to App
                                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            ) : (
                                <div className="relative">
                                    <LoginButton />
                                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full blur opacity-30 animate-pulse"></div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* React Flow Visualization */}
                    <div className="relative h-[400px] md:h-[500px]">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl blur opacity-20"></div>
                        <div className="relative z-10 h-full w-full bg-slate-900/80 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-4 shadow-2xl overflow-hidden">
                            <ReactFlow
                                nodes={nodes}
                                edges={edges}
                                onNodesChange={onNodesChange}
                                onEdgesChange={onEdgesChange}
                                onConnect={onConnect}
                                fitView
                                minZoom={0.5}
                                maxZoom={1.5}
                                zoomOnScroll={false}
                                zoomOnPinch={false}
                                panOnScroll={false}
                                panOnDrag={false}
                                style={{backgroundColor: 'transparent'}}
                                proOptions={{hideAttribution: true}}
                            >
                                <Background color="#6b21a8" gap={16} size={1} />
                                <Panel
                                    position="top-center"
                                    className="bg-slate-900/70 backdrop-blur-sm border border-purple-500/20 rounded-lg p-2 text-sm text-purple-300"
                                >
                                    Interactive Learning Path Visualization
                                </Panel>
                            </ReactFlow>

                            {/* Overlay gradient */}
                            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none"></div>
                        </div>

                        {/* Decorative elements */}
                        <div className="absolute -top-6 -right-6 w-24 h-24 bg-blue-500/20 rounded-full blur-xl"></div>
                        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-purple-500/20 rounded-full blur-xl"></div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="relative z-10 bg-slate-950/80 backdrop-blur-md py-24">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Revolutionizing Education with Blockchain</h2>
                        <p className="text-slate-300 max-w-2xl mx-auto">
                            Sufle combines AI-powered learning paths with blockchain incentives to create a unique educational experience.
                        </p>
                    </div>
                    <HoverEffect className="" items={SECTION} />
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="relative z-10 py-24">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">How Sufle Works</h2>
                        <p className="text-slate-300 max-w-2xl mx-auto">
                            Our token-based economy incentivizes learning and knowledge sharing in a decentralized ecosystem.
                        </p>
                    </div>

                    <div className="relative">
                        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 to-blue-500 hidden md:block"></div>

                        <div className="space-y-24">
                            {[
                                {
                                    title: 'Ask Questions & Get Guidance',
                                    description:
                                        'Spend EduTokens to ask questions to Sufle AI and receive personalized guidance on your learning journey.',
                                    image: '/sufle-bg-2.jpg',
                                },
                                {
                                    title: 'Complete Tasks & Share Progress',
                                    description:
                                        'Work through your personalized tasks and share your progress with the community through posts.',
                                    image: '/sufle-bg-3.jpg',
                                },
                                {
                                    title: 'Earn Rewards & Recognition',
                                    description:
                                        'Gain likes on your progress posts to earn back EduTokens and receive recognition for your achievements.',
                                    image: '/sufle-bg-1.jpg',
                                },
                            ].map((step, index) => (
                                <div key={index} className="grid md:grid-cols-2 gap-8 items-center">
                                    <div className={`space-y-4 ${index % 2 === 1 ? 'md:order-2' : ''}`}>
                                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-900 text-white font-bold text-xl border-4 border-slate-950 relative z-10">
                                            {index + 1}
                                        </div>
                                        <h3 className="text-2xl font-bold">{step.title}</h3>
                                        <p className="text-slate-300">{step.description}</p>
                                    </div>
                                    <div className={`relative ${index % 2 === 1 ? 'md:order-1' : ''}`}>
                                        <div className="relative z-10 bg-slate-900/80 backdrop-blur-sm border border-purple-500/20 rounded-xl p-4 shadow-xl">
                                            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl blur opacity-20"></div>
                                            <Image
                                                src={step.image || '/placeholder.svg'}
                                                width={500}
                                                height={300}
                                                alt={`Step ${index + 1}: ${step.title}`}
                                                className="rounded-lg w-full h-auto"
                                            />
                                        </div>
                                        <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl blur-xl -z-10"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative z-10 py-24">
                <div className="container mx-auto px-4">
                    <div className="relative bg-gradient-to-br from-slate-900 to-purple-900/80 backdrop-blur-md rounded-2xl p-8 md:p-12 overflow-hidden">
                        {/* Decorative elements */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl"></div>

                        <div className="relative z-10 max-w-3xl mx-auto text-center">
                            <h2 className="text-3xl md:text-4xl font-bold mb-6">Start Your Personalized Learning Journey Today</h2>
                            <p className="text-lg text-slate-300 mb-8">
                                Join Sufle and revolutionize the way you learn with AI-powered roadmaps and blockchain rewards.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                {mounted && authState.isAuthenticated ? (
                                    <Button
                                        onClick={() => {
                                            window.location.href = '/app';
                                        }}
                                        className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-8 py-6 h-auto text-lg"
                                    >
                                        Go to App
                                    </Button>
                                ) : (
                                    <div className="relative">
                                        <LoginButton />
                                        <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full blur opacity-30 animate-pulse"></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 bg-slate-950 border-t border-purple-900/30 py-12">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="flex items-center gap-2 mb-4 md:mb-0">
                            <Image src="/sufle.png" alt="Sufle Logo" width={32} height={32} />
                            <span className="text-xl font-bold">Sufle</span>
                        </div>
                        <div className="flex gap-8 mb-4 md:mb-0">
                            <a href="#features" className="text-sm text-slate-300 hover:text-purple-300 transition-colors">
                                Features
                            </a>
                            <a href="#how-it-works" className="text-sm text-slate-300 hover:text-purple-300 transition-colors">
                                How It Works
                            </a>
                            <a href="#technology" className="text-sm text-slate-300 hover:text-purple-300 transition-colors">
                                Technology
                            </a>
                        </div>
                        <div className="text-sm text-slate-400">&copy; {new Date().getFullYear()} Sufle. All rights reserved.</div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
