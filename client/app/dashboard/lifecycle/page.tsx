"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { MetaMaskConnect } from "@/components/MetaMaskConnect"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle 
} from "@/components/ui/dialog"
import { createTask, createPath } from "@/lib/contractUtils";
import Web3 from "web3";

interface SurveyDataType {
  lifeGoals: string;
  interests: string;
  motivations: string;
  occupation: string;
  timeCommitment: string;
  previousExperience: string;
}

interface Task {
  title: string;
  description: string;
  priority: string;
  status: string;
  tags: string;
}

interface GeneratedPath {
  title: string;
  description: string;
  tasks: Task[];
}

export default function LifeCyclePage() {
  const [loading, setLoading] = useState(false);
  const [generatedPath, setGeneratedPath] = useState<GeneratedPath | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [surveyData, setSurveyData] = useState<SurveyDataType>({
    lifeGoals: "",
    interests: "",
    motivations: "",
    occupation: "",
    timeCommitment: "",
    previousExperience: ""
  });
  const [connectedAddress, setConnectedAddress] = useState("");
  const EDU_TOKEN_PRICE = "0.01";

  const handleConnect = (address: string) => {
    setConnectedAddress(address);
  };

  const handleDisconnect = () => {
    setConnectedAddress("");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setSurveyData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!connectedAddress) {
      toast.error("Please connect your wallet first to pay with EDU tokens");
      return;
    }
    
    setPaymentDialogOpen(true);
  };
  
  const handlePaymentCancel = () => {
    setPaymentDialogOpen(false);
  };
  
  const handlePaymentConfirm = async () => {
    setPaymentDialogOpen(false);
    setLoading(true);
    
    try {
      console.log("Starting payment process...");
      
      // Payment reference to the MetaMaskConnect component
      const paymentSuccess = await window.payWithEduToken?.(EDU_TOKEN_PRICE);
      
      if (!paymentSuccess) {
        throw new Error("Payment failed or was cancelled");
      }
      
      console.log("Payment successful, generating learning path...");
      console.log("Survey data being sent:", surveyData);
      
      // After successful payment, generate the path
      const response = await fetch("/api/genai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ surveyData }),
      });

      const data = await response.json();
      console.log("Received response from GenAI:", data);
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate learning path");
      }
      
      setGeneratedPath(data.result);
      toast.success("Learning path generated successfully!");
    } catch (error: unknown) {
      console.error("Error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate learning path. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePath = async () => {
    if (!connectedAddress) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    if (!generatedPath) {
      toast.error("No learning path to save");
      return;
    }
    
    try {
      setLoading(true);
      console.log("Saving path to blockchain...");
      
      // First create all tasks and collect their IDs
      const taskIds: number[] = [];
      
      for (const task of generatedPath.tasks) {
        console.log("Creating task:", task.title);
        const taskHash = await createTask(
          connectedAddress,
          task.title,
          task.description,
          task.priority,
          task.status,
          task.tags
        );
        
        if (taskHash) {
          // For simplicity, we're using a hash of the task data as ID
          // In a real implementation, you would get the task ID from the transaction event
          const taskId = parseInt(
            Web3.utils.keccak256(
              `${task.title}${task.description}${Date.now()}`
            ).slice(2, 10), 
            16
          );
          taskIds.push(taskId);
          console.log("Task created with ID:", taskId);
        }
      }
      
      if (taskIds.length > 0) {
        console.log("Creating path with tasks:", taskIds);
        const pathHash = await createPath(
          connectedAddress,
          {
            title: generatedPath.title,
            description: generatedPath.description,
            tasks: generatedPath.tasks
          },
          taskIds
        );
        
        if (pathHash) {
          console.log("Path created with hash:", pathHash);
          toast.success("Path and tasks saved to blockchain!");
        }
      }
    } catch (error: unknown) {
      console.error("Error saving to blockchain:", error);
      toast.error("Failed to save path to blockchain");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col p-4 md:p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold">Create Your Learning Path</h1>
            <MetaMaskConnect 
              onConnect={handleConnect} 
              onDisconnect={handleDisconnect}
            />
          </div>
          
          {!generatedPath ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <Label htmlFor="lifeGoals">What are your main life goals?</Label>
                <Textarea 
                  id="lifeGoals" 
                  placeholder="Describe your long-term aspirations..." 
                  value={surveyData.lifeGoals}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="interests">What topics or activities are you interested in?</Label>
                <Input 
                  id="interests" 
                  placeholder="e.g., technology, art, hiking, cooking" 
                  value={surveyData.interests}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="motivations">What motivates you?</Label>
                <Textarea 
                  id="motivations" 
                  placeholder="Describe what drives you..." 
                  value={surveyData.motivations}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="occupation">What is your current occupation or field of study?</Label>
                <Input 
                  id="occupation" 
                  placeholder="e.g., Software Engineer, Student, Artist" 
                  value={surveyData.occupation}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="timeCommitment">How much time can you commit to learning each week?</Label>
                <Input 
                  id="timeCommitment" 
                  placeholder="e.g., 5 hours, 10 hours" 
                  value={surveyData.timeCommitment}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="previousExperience">What previous experience do you have in your areas of interest?</Label>
                <Textarea 
                  id="previousExperience" 
                  placeholder="Describe your background knowledge..." 
                  value={surveyData.previousExperience}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Button type="submit" disabled={loading}>
                  {loading ? "Generating..." : "Generate AI Learning Path"}
                </Button>
                <div className="mt-2 text-sm text-gray-500">
                  Costs {EDU_TOKEN_PRICE} EDU tokens for AI generation
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="border p-4 rounded-lg">
                <h2 className="text-xl font-semibold mb-2">{generatedPath.title}</h2>
                <p className="text-gray-600 mb-4">{generatedPath.description}</p>
                
                <h3 className="text-lg font-medium mb-2">Tasks</h3>
                {generatedPath.tasks && (
                  <div className="overflow-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="text-left p-2 border">Title</th>
                          <th className="text-left p-2 border">Description</th>
                          <th className="text-left p-2 border">Priority</th>
                          <th className="text-left p-2 border">Status</th>
                          <th className="text-left p-2 border">Tags</th>
                        </tr>
                      </thead>
                      <tbody>
                        {generatedPath.tasks.map((task: Task, index: number) => (
                          <tr key={index} className="border-b">
                            <td className="p-2 border">{task.title}</td>
                            <td className="p-2 border">{task.description}</td>
                            <td className="p-2 border">{task.priority}</td>
                            <td className="p-2 border">{task.status}</td>
                            <td className="p-2 border">{task.tags}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                
                <div className="mt-4">
                  <Button onClick={handleSavePath} className="mr-2">Save to Blockchain</Button>
                  <Button variant="outline" onClick={() => setGeneratedPath(null)}>Create New Path</Button>
                </div>
              </div>
            </div>
          )}
          
          <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Payment</DialogTitle>
                <DialogDescription>
                  You will be charged {EDU_TOKEN_PRICE} EDU tokens to generate your personalized learning path.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={handlePaymentCancel}>Cancel</Button>
                <Button onClick={handlePaymentConfirm}>Confirm Payment</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
} 