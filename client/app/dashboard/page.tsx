"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { MetaMaskConnect } from "@/components/MetaMaskConnect"
import { createTask, createPath, generatePathWithAI, Task, Path } from "@/lib/contractUtils"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Web3 from "web3"

import data from "./data.json"

export default function Page() {
  const [newTask, setNewTask] = useState<Task>({
    title: "",
    description: "",
    priority: "medium",
    status: "not started",
    tags: ""
  });
  const [connectedAddress, setConnectedAddress] = useState("");
  const [createdTasks, setCreatedTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [generatedPathInfo, setGeneratedPathInfo] = useState({
    title: "",
    description: "",
    taskCount: 0,
    transactionHash: ""
  });
  const EDU_TOKEN_PRICE = "0.01";

  const handleConnect = (address: string) => {
    setConnectedAddress(address);
  };

  const handleDisconnect = () => {
    setConnectedAddress("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewTask(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (value: string, field: string) => {
    setNewTask(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!connectedAddress) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    if (!newTask.title || !newTask.description) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    setLoading(true);
    
    try {
      const taskHash = await createTask(
        connectedAddress,
        newTask.title,
        newTask.description,
        newTask.priority,
        newTask.status,
        newTask.tags
      );
      
      if (taskHash) {
        setCreatedTasks(prev => [...prev, { ...newTask }]);
        setNewTask({
          title: "",
          description: "",
          priority: "medium",
          status: "not started",
          tags: ""
        });
        toast.success("Task created successfully!");
      }
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("Failed to create task");
    } finally {
      setLoading(false);
    }
  };
  
  const handleGeneratePath = async () => {
    if (!connectedAddress) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    if (createdTasks.length < 1) {
      toast.error("Please create at least one task first");
      return;
    }
    
    setLoading(true);
    
    try {
      // First verify payment
      const paymentSuccess = await window.payWithEduToken?.(EDU_TOKEN_PRICE);
      
      if (!paymentSuccess) {
        throw new Error("Payment failed or was cancelled");
      }
      
      // Generate a title and description for the path
      const pathTitle = `My Learning Path (${new Date().toLocaleDateString()})`;
      const pathDescription = "A custom learning path generated from my tasks.";
      
      // Create task IDs (in real system, these would come from blockchain events)
      const taskIds: number[] = createdTasks.map((task, index) => {
        const taskId = parseInt(
          Web3.utils.keccak256(
            `${task.title}${task.description}${Date.now() + index}`
          ).slice(2, 10),
          16
        );
        return taskId;
      });
      
      // Create the path on the blockchain
      const pathHash = await createPath(
        connectedAddress,
        {
          title: pathTitle,
          description: pathDescription,
          tasks: createdTasks
        },
        taskIds
      );
      
      if (pathHash) {
        // Set success modal info
        setGeneratedPathInfo({
          title: pathTitle,
          description: pathDescription,
          taskCount: createdTasks.length,
          transactionHash: pathHash
        });
        
        // Show success modal
        setSuccessModalOpen(true);
        
        // Reset tasks after creating path
        setCreatedTasks([]);
      }
    } catch (error: any) {
      console.error("Error generating path:", error);
      toast.error(error.message || "Failed to generate path");
    } finally {
      setLoading(false);
    }
  };
  
  const handleViewOnExplorer = () => {
    if (generatedPathInfo.transactionHash) {
      // Open explorer link in new tab
      window.open(`https://opencampus-codex.blockscout.com/tx/${generatedPathInfo.transactionHash}`, '_blank');
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col p-4 md:p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <MetaMaskConnect 
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Task Creation</CardTitle>
                  <CardDescription>Create new tasks for your learning path</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateTask} className="space-y-4">
                    <div>
                      <Label htmlFor="title">Task Title</Label>
                      <Input 
                        id="title"
                        name="title"
                        value={newTask.title}
                        onChange={handleInputChange}
                        placeholder="Enter task title"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Task Description</Label>
                      <Textarea 
                        id="description"
                        name="description"
                        value={newTask.description}
                        onChange={handleInputChange}
                        placeholder="Enter task description"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="priority">Priority</Label>
                        <Select 
                          value={newTask.priority}
                          onValueChange={(value) => handleSelectChange(value, "priority")}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Select 
                          value={newTask.status}
                          onValueChange={(value) => handleSelectChange(value, "status")}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="not started">Not Started</SelectItem>
                            <SelectItem value="in progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="tags">Tags (comma-separated)</Label>
                      <Input 
                        id="tags"
                        name="tags"
                        value={newTask.tags}
                        onChange={handleInputChange}
                        placeholder="e.g., coding, web3, study"
                      />
                    </div>
                    <Button type="submit" disabled={loading}>
                      {loading ? "Creating..." : "Create Task"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Created Tasks</CardTitle>
                  <CardDescription>Tasks ready to be added to a path</CardDescription>
                </CardHeader>
                <CardContent>
                  {createdTasks.length === 0 ? (
                    <p className="text-center text-gray-500 my-4">No tasks created yet</p>
                  ) : (
                    <div className="space-y-3">
                      {createdTasks.map((task, index) => (
                        <div key={index} className="border p-3 rounded-md">
                          <h3 className="font-medium">{task.title}</h3>
                          <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <div className="bg-gray-100 text-xs px-2 py-1 rounded">
                              {task.priority}
                            </div>
                            <div className="bg-gray-100 text-xs px-2 py-1 rounded">
                              {task.status}
                            </div>
                            {task.tags && task.tags.split(',').map((tag, i) => (
                              <div key={i} className="bg-gray-100 text-xs px-2 py-1 rounded">
                                {tag.trim()}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col">
                  <Button 
                    onClick={handleGeneratePath} 
                    disabled={loading || createdTasks.length === 0} 
                    className="w-full"
                  >
                    {loading ? "Processing..." : "Generate Path"}
                  </Button>
                  <div className="text-xs text-center mt-2 text-gray-500">
                    Costs {EDU_TOKEN_PRICE} EDU tokens
                  </div>
                </CardFooter>
              </Card>
            </div>
          </div>
          
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards />
              {/* @ts-ignore - Ignoring data format differences for dashboard data */}
              <DataTable data={data} />
            </div>
          </div>
          
          {/* Success Modal */}
          <Dialog open={successModalOpen} onOpenChange={setSuccessModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Path Generated Successfully!</DialogTitle>
                <DialogDescription>
                  Your learning path has been created and saved to the blockchain.
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4">
                <div className="mb-4">
                  <h3 className="font-medium text-lg">{generatedPathInfo.title}</h3>
                  <p className="text-gray-600">{generatedPathInfo.description}</p>
                </div>
                
                <div className="bg-gray-100 p-3 rounded-md mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Tasks</span>
                    <span className="font-medium">{generatedPathInfo.taskCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Cost</span>
                    <span className="font-medium">{EDU_TOKEN_PRICE} EDU</span>
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-2">Transaction Hash</p>
                  <p className="font-mono text-xs truncate bg-gray-50 p-2 rounded">
                    {generatedPathInfo.transactionHash}
                  </p>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setSuccessModalOpen(false)}>
                  Close
                </Button>
                <Button onClick={handleViewOnExplorer}>
                  View on Explorer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
