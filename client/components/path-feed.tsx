'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ITask } from '@/lib/contractUtils';
import Web3 from 'web3';
import { SUFLE_ABI, SUFLE_CONTRACT_ADDRESS } from '@/lib/contracts';
import { formatDistanceToNow } from 'date-fns';
import { CalendarIcon, CheckCircle2, Clock, Heart, MessageCircle, Send, Tag } from 'lucide-react';
import { toast } from 'sonner';

// Define interfaces for our component
interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: number;
}

interface PathData {
  id: string;
  title: string;
  description: string;
  creator: string;
  timestamp: number;
  tasks: ITask[];
  likes: number;
  liked: boolean;
  comments: Comment[];
}

export default function PathFeed() {
  const [paths, setPaths] = useState<PathData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [newComments, setNewComments] = useState<Record<string, string>>({});
  const commentInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Handle liking a path
  const handleLike = (pathId: string) => {
    setPaths(paths.map(path => {
      if (path.id === pathId) {
        return {
          ...path,
          likes: path.liked ? path.likes - 1 : path.likes + 1,
          liked: !path.liked
        };
      }
      return path;
    }));
    
    // In a real implementation, you would call a contract method to like the path
    toast.success(`${paths.find(p => p.id === pathId)?.liked ? 'Unliked' : 'Liked'} the path`);
  };

  // Handle toggling comments visibility
  const toggleComments = (pathId: string) => {
    setExpandedComments(prev => ({
      ...prev,
      [pathId]: !prev[pathId]
    }));
  };

  // Handle comment input change
  const handleCommentChange = (pathId: string, value: string) => {
    setNewComments(prev => ({
      ...prev,
      [pathId]: value
    }));
  };

  // Handle adding a new comment
  const addComment = (pathId: string) => {
    const commentText = newComments[pathId]?.trim();
    if (!commentText) return;

    // Get the path and add the new comment
    setPaths(paths.map(path => {
      if (path.id === pathId) {
        const newComment: Comment = {
          id: `${path.id}-${Date.now()}`,
          author: window.ethereum?.selectedAddress || 'Anonymous',
          content: commentText,
          timestamp: Date.now()
        };
        return {
          ...path,
          comments: [...path.comments, newComment]
        };
      }
      return path;
    }));

    // Clear the input
    setNewComments(prev => ({
      ...prev,
      [pathId]: ''
    }));

    // In a real implementation, you would call a contract method to add the comment
    toast.success('Comment added');
  };

  useEffect(() => {
    const fetchAllPaths = async () => {
      try {
        if (typeof window === 'undefined' || !window.ethereum) {
          setError('MetaMask is not installed');
          setLoading(false);
          return;
        }

        // Request account access if needed
        try {
          await window.ethereum.request({ method: 'eth_requestAccounts' });
        } catch (requestError) {
          console.error('User denied account access', requestError);
          setError('Please connect your wallet to view paths');
          setLoading(false);
          return;
        }

        const web3 = new Web3(window.ethereum);
        const accounts = await web3.eth.getAccounts();
        const userAddress = accounts[0];
        const contract = new web3.eth.Contract(SUFLE_ABI as any, SUFLE_CONTRACT_ADDRESS);

        // Create some mock data for demonstration
        // In a real implementation, you would fetch this from the contract
        const mockPaths: PathData[] = [
          {
            id: '1',
            title: 'Introduction to Web3 Development',
            description: 'Learn the fundamentals of blockchain development with Ethereum and Solidity',
            creator: '0x5B38Da6a701c568545dCfcB03FcB875f56beddC4',
            timestamp: Date.now() - 86400000 * 2, // 2 days ago
            tasks: [
              {
                title: 'Set up MetaMask',
                description: 'Install and configure MetaMask for development',
                priority: 'high',
                status: 'completed',
                tags: 'setup,wallet,beginner'
              },
              {
                title: 'Learn Solidity Basics',
                description: 'Understand variables, functions, and basic syntax',
                priority: 'high',
                status: 'in-progress',
                tags: 'solidity,programming,beginner'
              },
              {
                title: 'Deploy Your First Smart Contract',
                description: 'Create and deploy a simple smart contract to a testnet',
                priority: 'medium',
                status: 'pending',
                tags: 'deployment,contract,intermediate'
              },
              {
                title: 'Interact with Smart Contracts via Web3.js',
                description: 'Learn how to use Web3.js to interact with deployed contracts',
                priority: 'medium',
                status: 'pending',
                tags: 'javascript,web3,frontend'
              }
            ],
            likes: 24,
            liked: false,
            comments: [
              {
                id: '101',
                author: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
                content: 'Great path for beginners! I completed it in two weeks.',
                timestamp: Date.now() - 86400000 * 1.5 // 1.5 days ago
              },
              {
                id: '102',
                author: '0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db',
                content: 'The MetaMask setup task was really helpful. Looking forward to the next steps!',
                timestamp: Date.now() - 86400000 * 0.5 // 0.5 days ago
              }
            ]
          },
          {
            id: '2',
            title: 'DeFi Protocol Development',
            description: 'Advanced path for building decentralized finance applications',
            creator: '0x78731D3Ca6b7E34aC0F824c42a7cC18A495cabaB',
            timestamp: Date.now() - 86400000 * 5, // 5 days ago
            tasks: [
              {
                title: 'Understand Liquidity Pools',
                description: 'Learn how automated market makers work',
                priority: 'high',
                status: 'completed',
                tags: 'defi,amm,advanced'
              },
              {
                title: 'Implement ERC-20 Token',
                description: 'Create a custom ERC-20 token with advanced features',
                priority: 'high',
                status: 'completed',
                tags: 'token,erc20,intermediate'
              },
              {
                title: 'Build Staking Mechanism',
                description: 'Implement a staking contract with rewards distribution',
                priority: 'medium',
                status: 'in-progress',
                tags: 'staking,rewards,advanced'
              }
            ],
            likes: 42,
            liked: true,
            comments: [
              {
                id: '201',
                author: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
                content: 'This is exactly what I needed for my DeFi project. Thanks for sharing!',
                timestamp: Date.now() - 86400000 * 4 // 4 days ago
              },
              {
                id: '202',
                author: userAddress,
                content: 'The staking mechanism task is challenging but rewarding.',
                timestamp: Date.now() - 86400000 * 2 // 2 days ago
              },
              {
                id: '203',
                author: '0xFABB0ac9d68B0B445fB7357272Ff202C5651694a',
                content: 'Would love to see more about yield farming strategies in this path.',
                timestamp: Date.now() - 86400000 * 1 // 1 day ago
              }
            ]
          },
          {
            id: '3',
            title: 'NFT Marketplace Development',
            description: 'Build your own NFT marketplace from scratch',
            creator: userAddress,
            timestamp: Date.now() - 86400000 * 1, // 1 day ago
            tasks: [
              {
                title: 'Implement ERC-721 Contract',
                description: 'Create a standard-compliant NFT contract',
                priority: 'high',
                status: 'completed',
                tags: 'nft,erc721,intermediate'
              },
              {
                title: 'Build Frontend for NFT Display',
                description: 'Create a responsive UI to showcase NFTs',
                priority: 'medium',
                status: 'in-progress',
                tags: 'frontend,ui,react'
              },
              {
                title: 'Implement Bidding System',
                description: 'Create a secure auction mechanism for NFTs',
                priority: 'high',
                status: 'pending',
                tags: 'auction,smart-contract,advanced'
              },
              {
                title: 'Add Royalty Features',
                description: 'Implement creator royalties for secondary sales',
                priority: 'medium',
                status: 'pending',
                tags: 'royalties,payments,advanced'
              },
              {
                title: 'Deploy to Mainnet',
                description: 'Finalize and deploy the marketplace to Ethereum mainnet',
                priority: 'low',
                status: 'pending',
                tags: 'deployment,mainnet,production'
              }
            ],
            likes: 8,
            liked: false,
            comments: [
              {
                id: '301',
                author: '0x1dF62f291b2E969fB0849d99D9Ce41e2F137006e',
                content: 'Just started this path yesterday. The ERC-721 task is very well explained!',
                timestamp: Date.now() - 86400000 * 0.3 // 0.3 days ago
              }
            ]
          }
        ];

        // Try to fetch real data from contract (commented out for now since we're using mock data)
        // Uncomment and adapt this code when the contract methods are available
        /*
        try {
          // Get all generated paths for the current user
          const userPathIds = await contract.methods.getUserGeneratedPaths(userAddress).call();
          const contractPaths: PathData[] = [];

          for (const pathId of userPathIds) {
            try {
              // Get path info
              const pathInfo = await contract.methods.getGeneratedPathInfo(pathId).call();
              
              // Fetch tasks for this path
              const taskIds = [];
              try {
                // Get task IDs for this path
                taskIds = await contract.methods.getPathTasks(pathId).call();
              } catch (taskIdsError) {
                console.error(`Error fetching task IDs for path ${pathId}:`, taskIdsError);
              }
              
              const pathTasks: Task[] = [];
              for (const taskId of taskIds) {
                try {
                  const taskInfo = await contract.methods.getTask(taskId).call();
                  pathTasks.push({
                    title: taskInfo.title || '',
                    description: taskInfo.description || '',
                    priority: taskInfo.priority || 'medium',
                    status: taskInfo.status || 'pending',
                    tags: taskInfo.tags || ''
                  });
                } catch (taskError) {
                  console.error(`Error fetching task ${taskId}:`, taskError);
                }
              }
              
              contractPaths.push({
                id: pathId.toString(),
                title: pathInfo.title || `Path #${pathId}`,
                description: pathInfo.description || '',
                creator: pathInfo.creator || userAddress,
                timestamp: Number(pathInfo.timestamp || Date.now()/1000) * 1000,
                tasks: pathTasks
              });
            } catch (pathError) {
              console.error(`Error fetching path ${pathId}:`, pathError);
            }
          }

          if (contractPaths.length > 0) {
            setPaths(contractPaths);
            return;
          }
        } catch (contractError) {
          console.error('Error fetching paths from contract:', contractError);
          toast.error('Could not fetch paths from contract, showing demo data instead');
        }
        */

        // If we get here, either we're using mock data or contract fetching failed
        setPaths(mockPaths);
        toast.info('Showing demo path data');
        
      } catch (err) {
        console.error('Error in path fetching process:', err);
        setError('Failed to fetch paths');
      } finally {
        setLoading(false);
      }
    };

    fetchAllPaths();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="w-full">
            <CardHeader className="gap-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-3 w-[100px]" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-[90%]" />
              <Skeleton className="h-4 w-[80%]" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-8 w-[120px]" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (paths.length === 0) {
    return <div className="text-center py-8">No paths found. Be the first to create one!</div>;
  }

  return (
    <div className="space-y-6">
      {paths.map((path) => (
        <Card key={path.id} className="w-full hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>
                    {path.creator.slice(0, 2)}
                  </AvatarFallback>
                  <AvatarImage src={`https://avatar.vercel.sh/${path.creator.toLowerCase()}.svg`} />
                </Avatar>
                <div>
                  <div className="font-medium">
                    {path.creator.slice(0, 6)}...{path.creator.slice(-4)}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    {formatDistanceToNow(new Date(path.timestamp), { addSuffix: true })}
                  </div>
                </div>
              </div>
              <Badge variant="outline">{path.tasks.length} tasks</Badge>
            </div>
            <CardTitle className="mt-2">{path.title}</CardTitle>
            <CardDescription>{path.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {path.tasks.slice(0, 3).map((task, index) => (
                <div key={index} className="bg-muted p-3 rounded-md">
                  <div className="flex justify-between items-start">
                    <div className="font-medium">{task.title}</div>
                    <Badge variant={
                      task.priority === 'high' ? 'destructive' : 
                      task.priority === 'medium' ? 'default' : 
                      'secondary'
                    }>
                      {task.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <div className="flex items-center text-xs">
                      <Clock className="mr-1 h-3 w-3" />
                      <span>{task.status}</span>
                    </div>
                    {task.tags.split(',').map((tag, tagIndex) => (
                      <div key={tagIndex} className="flex items-center text-xs">
                        <Tag className="mr-1 h-3 w-3" />
                        <span>{tag.trim()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {path.tasks.length > 3 && (
                <div className="text-center text-sm text-muted-foreground mt-2">
                  +{path.tasks.length - 3} more tasks
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <div className="flex justify-between w-full">
              <div className="text-sm text-muted-foreground">
                Path #{path.id}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {path.tasks.filter(t => t.status === 'completed').length}/{path.tasks.length} completed
                </Badge>
              </div>
            </div>
            
            {/* Social interaction section */}
            <div className="w-full pt-2 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  {/* Like button */}
                  <button 
                    onClick={() => handleLike(path.id)} 
                    className="flex items-center space-x-1 text-sm hover:text-blue-500 transition-colors"
                  >
                    <Heart className={`h-5 w-5 ${path.liked ? 'fill-red-500 text-red-500' : ''}`} />
                    <span>{path.likes}</span>
                  </button>
                  
                  {/* Comment button */}
                  <button 
                    onClick={() => toggleComments(path.id)} 
                    className="flex items-center space-x-1 text-sm hover:text-blue-500 transition-colors"
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span>{path.comments.length}</span>
                  </button>
                </div>
              </div>

              {/* Comments section */}
              {expandedComments[path.id] && (
                <div className="mt-4">
                  <Separator className="my-2" />
                  <h4 className="text-sm font-medium mb-2">Comments</h4>
                  
                  {/* Comment list */}
                  <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                    {path.comments.map(comment => (
                      <div key={comment.id} className="flex space-x-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`https://avatar.vercel.sh/${comment.author}`} />
                          <AvatarFallback>{comment.author.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-medium truncate max-w-[150px]">{comment.author.slice(0, 6)}...{comment.author.slice(-4)}</p>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm mt-1">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Add comment form */}
                  <div className="flex items-center space-x-2">
                    <Input
                      ref={el => { commentInputRefs.current[path.id] = el }}
                      value={newComments[path.id] || ''}
                      onChange={(e) => handleCommentChange(path.id, e.target.value)}
                      placeholder="Add a comment..."
                      className="flex-1"
                      onKeyDown={(e) => e.key === 'Enter' && addComment(path.id)}
                    />
                    <Button 
                      size="icon" 
                      onClick={() => addComment(path.id)}
                      disabled={!newComments[path.id]?.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
