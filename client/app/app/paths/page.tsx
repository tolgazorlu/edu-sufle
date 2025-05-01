"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

interface Task {
  title: string;
  description: string;
  priority: string;
  status: string;
  tags?: string;
}

interface Path {
  id: string;
  title: string;
  description: string;
  timestamp: number;
  tasks: Task[];
  transactionHash?: string;
}

export default function PathsPage() {
  const [paths, setPaths] = useState<Path[]>([])
  const [loading, setLoading] = useState(true)
  const [connectedAddress, setConnectedAddress] = useState("")
  const [accountBalance, setAccountBalance] = useState("0");
  const router = useRouter()

  useEffect(() => {
    if (connectedAddress) {
      fetchUserPaths()
    } else {
      setLoading(false)
    }
  }, [connectedAddress])

  const fetchUserPaths = async () => {
    setLoading(true)
    try {
  

      
      setPaths([])
    } catch (error) {
      console.error("Error fetching paths:", error)
      toast.error("Failed to fetch your paths")
    } finally {
      setLoading(false)
    }
  }
  
  const handleViewOnExplorer = (transactionHash: string) => {
    if (transactionHash) {
      window.open(`https://sepolia.etherscan.io/tx/${transactionHash}`, '_blank')
    }
  }

  const handleViewPath = (pathId: string) => {
    router.push(`/app/paths/${pathId}`)
  }

  const handleConnect = (address: string) => {
    setConnectedAddress(address);
  };

  const handleDisconnect = () => {
    setConnectedAddress("");
  };

  const handleBalanceUpdate = (balance: string) => {
    setAccountBalance(balance);
  };

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title="Paths" handleConnect={handleConnect} handleDisconnect={handleDisconnect} handleBalanceUpdate={handleBalanceUpdate} />
        <div className="flex flex-1 flex-col p-4 md:p-6">

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {paths.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                  <p className="text-lg text-muted-foreground">You don&apos;t have any learning paths yet.</p>
                  <Button 
                    onClick={() => router.push('/app')}
                    className="px-8 rounded-full h-12 text-base"
                  >
                    Generate Your First Path
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mt-6">
                    {paths.map((path) => (
                      <Card key={path.id} className="overflow-hidden hover:shadow-md transition-shadow duration-300">
                        <CardHeader>
                          <CardTitle className="line-clamp-1">{path.title}</CardTitle>
                          <CardDescription className="line-clamp-2">{path.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium">Tasks ({path.tasks.length})</h4>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                              {path.tasks.map((task, index) => (
                                <div key={index} className="p-3 bg-muted rounded-md">
                                  <div className="flex justify-between items-start">
                                    <h5 className="font-medium line-clamp-1">{task.title}</h5>
                                    <div className="flex gap-1">
                                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                                        task.priority === 'high' ? 'bg-red-100 text-red-800' : 
                                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                                        'bg-green-100 text-green-800'
                                      }`}>
                                        {task.priority}
                                      </span>
                                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                                        task.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                        task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : 
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {task.status}
                                      </span>
                                    </div>
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                                  {task.tags && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {task.tags.split(',').map((tag, tagIndex) => (
                                        <span key={tagIndex} className="text-xs bg-background px-2 py-0.5 rounded-full">
                                          {tag.trim()}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t pt-4">
                          <div className="text-xs text-muted-foreground">
                            Created: {new Date(path.timestamp).toLocaleDateString()}
                          </div>
                          <div className="flex gap-2">
                            {path.transactionHash && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleViewOnExplorer(path.transactionHash!)}
                              >
                                View on Explorer
                              </Button>
                            )}
                            <Button 
                              size="sm"
                              onClick={() => handleViewPath(path.id)}
                            >
                              View Details
                            </Button>
                          </div>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                  
                  <div className="mt-8 text-center">
                    <Button 
                      onClick={() => router.push('/app')}
                      variant="outline"
                      className="px-8 rounded-full h-12 text-base"
                    >
                      Generate a New Path
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 