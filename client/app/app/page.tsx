"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Web3 from "web3"
import { createPath, createTask } from '@/lib/contractUtils';
import { useRouter } from 'next/navigation';
import { SUFLE_ABI, SUFLE_CONTRACT_ADDRESS } from '@/lib/contracts';
import { GeneratedPathInfo, ITask } from '@/lib/contractUtils';

function AppContent() {
  const [connectedAddress, setConnectedAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [pathDialog, setPathDialog] = useState(false);
  const [pathDescription, setPathDescription] = useState("");
  const [generatedPathInfo, setGeneratedPathInfo] = useState<GeneratedPathInfo>({
    title: "",
    description: "",
    taskCount: 0,
    tasks: [],
    transactionHash: null,
    pathId: '0'
  });
  const [showGeneratedPath, setShowGeneratedPath] = useState(false);
  const [accountBalance, setAccountBalance] = useState("0");
  const EDU_TOKEN_PRICE = "0.01";
  const router = useRouter();
  const [surveyData, setSurveyData] = useState<{
    categories: string[];
    motivations: string[];
    occupation: string;
    lifeGoals: string;
  } | null>(null);

  const handleConnect = (address: string) => {
    setConnectedAddress(address);
  };

  useEffect(() => {
    const checkSurveyStatus = async () => {
      if (connectedAddress) {
        try {
          const web3 = new Web3(window.ethereum);
          const contractAddress = SUFLE_CONTRACT_ADDRESS;
          const contract = new web3.eth.Contract(SUFLE_ABI, contractAddress);
          const surveyCount = await contract.methods.getUserSurveyCount(connectedAddress).call();

          if (String(surveyCount) === "0") {
            toast.info("Please complete the survey to continue");
            router.push('/app/lifecycle');
          }
        } catch (error) {
          console.error("Error checking survey status:", error);
        }
      }
    };

    checkSurveyStatus();
  }, [connectedAddress, router]);

  // Fetch survey data when address is connected
  useEffect(() => {
    const fetchSurveyData = async () => {
      if (connectedAddress) {
        try {
          console.log("Fetching survey data for address:", connectedAddress);
          const web3 = new Web3(window.ethereum);
          const contract = new web3.eth.Contract(SUFLE_ABI, SUFLE_CONTRACT_ADDRESS);

          const surveyCount = Number(await contract.methods.getUserSurveyCount(connectedAddress).call());
          console.log("Survey count:", surveyCount);

          if (surveyCount > 0) {
            console.log("Fetching latest survey info...");
            // Get the user's survey IDs
            const surveyIds: string[] = await contract.methods.getUserSurveyIds(connectedAddress).call();
            if (surveyIds && surveyIds.length > 0) {
              const latestSurveyId = surveyIds[surveyIds.length - 1];

              // Get the latest survey info
              interface SurveyResponse {
                [key: number]: string | string[];
              }
              const surveyData = await contract.methods.getSurveyInfo(latestSurveyId).call() as SurveyResponse;
              console.log("Raw survey data:", surveyData);

              setSurveyData({
                categories: Array.isArray(surveyData[2]) ? surveyData[2] as string[] : [],
                motivations: Array.isArray(surveyData[3]) ? surveyData[3] as string[] : [],
                occupation: (surveyData[4] as string) || 'Not specified',
                lifeGoals: (surveyData[5] as string) || 'Not specified'
              });

              console.log("Processed survey data:", surveyData);
            } else {
              console.log("No survey IDs found");
            }
          } else {
            console.log("No surveys found for this address");
          }
        } catch (error) {
          console.error("Error fetching survey data:", error);
        }
      }
    };

    fetchSurveyData();
  }, [connectedAddress]);

  const handleDisconnect = () => {
    setConnectedAddress("");
    setAccountBalance("0");
  };

  const handleBalanceUpdate = (balance: string) => {
    setAccountBalance(balance);
  };

  const handleGeneratePath = async () => {
    if (!pathDescription) {
      toast.error("Please provide a description for your path");
      return;
    }

    if (!connectedAddress) {
      toast.error("Please connect your wallet first");
      return;
    }

    setLoading(true);

    try {
      const web3 = new Web3(window.ethereum);

      await window.ethereum.request({ method: "eth_requestAccounts" });
      const accounts = await web3.eth.getAccounts();

      const eduTokenContract = new web3.eth.Contract(SUFLE_ABI, SUFLE_CONTRACT_ADDRESS);

      const gasPrice = await web3.eth.getGasPrice();
      const estimatedGas = await eduTokenContract.methods
        .generatePathWithDescription(pathDescription)
        .estimateGas({
          from: accounts[0],
          value: web3.utils.toWei(EDU_TOKEN_PRICE, "ether"),
        })
        .catch(() => "500000");

      console.log("Estimated gas:", estimatedGas);

      const transaction = await eduTokenContract.methods
        .generatePathWithDescription(pathDescription)
        .send({
          from: accounts[0],
          value: web3.utils.toWei(EDU_TOKEN_PRICE, "ether"),
          gas: String(estimatedGas),
          gasPrice: String(gasPrice)
        });

      console.log("Transaction successful:", transaction);

      const response = await fetch('/api/genai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          surveyData: { description: pathDescription }
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate path");
      }

      const data = await response.json();
      const generatedContent = data.result;

      let pathData;
      try {
        let textContent;

        if (generatedContent.candidates && generatedContent.candidates[0]?.content?.parts) {
          textContent = generatedContent.candidates[0].content.parts[0].text;
        } else if (generatedContent.text) {
          textContent = generatedContent.text;
        } else if (typeof generatedContent === 'string') {
          textContent = generatedContent;
        } else {
          textContent = JSON.stringify(generatedContent);
        }

        const jsonMatch = textContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          textContent = jsonMatch[0];
        }

        pathData = JSON.parse(textContent);
      } catch (error) {
        console.error("Error parsing AI response:", error);
        pathData = {
          title: "Generated Path",
          description: pathDescription,
          tasks: []
        };
      }

      // Extract the path ID from the transaction events if available
      let pathId = '0';
      if (transaction.events && transaction.events.AIPathGenerated) {
        // Safely extract the pathId and convert to string
        const eventPathId = transaction.events.AIPathGenerated.returnValues?.pathId;
        if (eventPathId !== undefined) {
          pathId = String(eventPathId);
          console.log("Extracted pathId from event:", pathId);
        }
      }

      setGeneratedPathInfo({
        title: pathData.title || `AI Generated Path (${new Date().toLocaleDateString()})`,
        description: pathData.description || pathDescription,
        taskCount: pathData.tasks?.length || 0,
        tasks: pathData.tasks || [],
        transactionHash: transaction.transactionHash,
        pathId: pathId // Store the path ID separately
      });

      setPathDialog(false);
      setShowGeneratedPath(true);
      setPathDescription("");
      setTimeout(() => {
        const pathElement = document.getElementById('generated-path');
        if (pathElement) {
          pathElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);

      toast.success("Path generated successfully!");

    } catch (error: any) {
      console.error("Error generating path:", error);
      toast.error(error.message || "Failed to generate path");
    } finally {
      setLoading(false);
    }
  };

  const handleViewOnExplorer = () => {
    if (generatedPathInfo.transactionHash) {
      window.open(`https://opencampus-codex.blockscout.com/tx/${generatedPathInfo.transactionHash}`, '_blank');
    }
  };

  const handleSaveToYourPaths = async () => {
    if (!connectedAddress) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!generatedPathInfo) {
      toast.error("No learning path to save");
      return;
    }

    try {
      setLoading(true);
      console.log("Saving path to blockchain...");

      // First create all tasks and collect their IDs
      const taskIds: number[] = [];

      for (const task of generatedPathInfo.tasks) {
        console.log("Creating task:", task.title);
        const taskHash = await createTask(
          connectedAddress,
          task.title,
          task.description,
          task.priority || "Medium",
          task.status || "To Do",
          task.tags || ""
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
            title: generatedPathInfo.title,
            description: generatedPathInfo.description,
            tasks: generatedPathInfo.tasks
          },
          taskIds
        );

        if (pathHash) {
          console.log("Path created with hash:", pathHash);
          toast.success("Path saved successfully!");
        }
      }
    } catch (error: any) {
      console.error("Error saving to blockchain:", error);
      toast.error(error.message || "Failed to save path");
    } finally {
      setLoading(false);
    }
  };

  const handleGoToMindmap = () => {
    if (!generatedPathInfo || !generatedPathInfo.tasks || generatedPathInfo.tasks.length === 0) {
      toast.error("No tasks available for the mindmap");
      return;
    }

    try {
      // Define extended task type with properties for node processing
      interface ExtendedTask extends ITask {
        _nodeId?: string;
        _tags?: string[];
      }

      // Group tasks by priority for better organization
      const tasksByPriority: Record<string, ExtendedTask[]> = {};
      generatedPathInfo.tasks.forEach(task => {
        const priority = (task.priority || 'medium').toLowerCase();
        if (!tasksByPriority[priority]) {
          tasksByPriority[priority] = [];
        }
        tasksByPriority[priority].push(task as ExtendedTask);
      });

      // Prepare nodes data with horizontal flow layout (left to right)
      const nodes: any[] = [];
      const edges: any[] = [];

      // Define node spacing
      const HORIZONTAL_SPACING = 300;
      const VERTICAL_SPACING = 100;
      const LEFT_MARGIN = 100;
      const TOP_MARGIN = 150;

      // Add main topic node at the left side
      nodes.push({
        id: 'main',
        data: { label: generatedPathInfo.title },
        position: { x: LEFT_MARGIN, y: 300 },
        type: 'input'
      });

      // Process each priority level as a column
      const priorityOrder = ['critical', 'high', 'medium', 'low'];
      let columnIndex = 1; // Start with column 1 (main node is at column 0)

      priorityOrder.forEach(priority => {
        const tasks = tasksByPriority[priority] || [];
        if (tasks.length === 0) return;

        // Calculate vertical positioning for this column
        const columnX = LEFT_MARGIN + (columnIndex * HORIZONTAL_SPACING);
        const totalHeight = tasks.length * VERTICAL_SPACING;
        const startY = Math.max(100, 300 - (totalHeight / 2));

        // Add a priority header node
        const headerNodeId = `header-${priority}`;
        nodes.push({
          id: headerNodeId,
          data: {
            label: priority.charAt(0).toUpperCase() + priority.slice(1) + " Tasks",
            isMainNode: true
          },
          position: { x: columnX, y: TOP_MARGIN },
          type: 'default'
        });

        // Connect main node to the priority header
        edges.push({
          id: `e-main-${headerNodeId}`,
          source: 'main',
          target: headerNodeId,
          label: priority,
          type: 'smoothstep'
        });

        // Create nodes for each task in this priority group
        tasks.forEach((task, taskIndex) => {
          const nodeId = `${priority}-${taskIndex}`;
          const nodeY = startY + (taskIndex * VERTICAL_SPACING);

          // Create task node
          nodes.push({
            id: nodeId,
            data: { label: task.title },
            position: { x: columnX, y: nodeY },
            type: 'default'
          });

          // Connect priority header to the task node
          edges.push({
            id: `e-${headerNodeId}-${nodeId}`,
            source: headerNodeId,
            target: nodeId,
            type: 'default'
          });

          // Keep track of tags for later connections
          if (task.tags) {
            const tags = task.tags.split(',').map(tag => tag.trim());
            const extendedTask = task as ExtendedTask;
            extendedTask._nodeId = nodeId; // Store node ID reference
            extendedTask._tags = tags;
          }
        });

        columnIndex++;
      });

      // Create connections between nodes that share the same tags
      // Group tasks by tag
      const tasksByTag: Record<string, string[]> = {};
      (generatedPathInfo.tasks as ExtendedTask[]).forEach(task => {
        if (task._tags && task._nodeId) {
          task._tags.forEach(tag => {
            if (!tasksByTag[tag]) tasksByTag[tag] = [];
            tasksByTag[tag].push(task._nodeId as string);
          });
        }
      });

      // Create edges between tasks with the same tag
      Object.entries(tasksByTag).forEach(([tag, nodeIds]) => {
        if (nodeIds.length > 1) {
          // Only connect nodes if there's more than one with the same tag
          for (let i = 0; i < nodeIds.length - 1; i++) {
            const source = nodeIds[i];
            const target = nodeIds[i + 1];

            // Avoid duplicate connections
            const existingEdge = edges.find(e =>
              (e.source === source && e.target === target) ||
              (e.source === target && e.target === source)
            );

            if (!existingEdge) {
              edges.push({
                id: `e-tag-${source}-${target}`,
                source: source,
                target: target,
                label: tag,
                type: 'straight',
                animated: true,
                style: { strokeDasharray: '5,5' } // Make these connections dashed
              });
            }
          }
        }
      });

      // Save to localStorage
      localStorage.setItem('mindmapData', JSON.stringify({ nodes, edges }));

      // Navigate to map page
      router.push('/app/mindmap');

      toast.success("Opening mindmap visualization");
    } catch (error) {
      console.error("Error preparing mindmap data:", error);
      toast.error("Failed to prepare mindmap data");
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title="Home" handleConnect={handleConnect} handleDisconnect={handleDisconnect} handleBalanceUpdate={handleBalanceUpdate} />
        <div className="flex flex-1 flex-col p-4 md:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-3">
              <Card className="shadow-sm hover:shadow-md transition-shadow border border-blue-50 overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  <div className="p-6 flex-1">
                    <div className="flex items-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                      </svg>
                      <h2 className="text-xl font-bold text-gray-900">Generate Learning Path</h2>
                    </div>
                    <p className="text-gray-600 mb-4 max-w-2xl">
                      Get a personalized learning path tailored to your interests and goals. Our AI creates a structured plan with prioritized tasks to guide your journey.
                    </p>
                    <div className="flex flex-wrap gap-2 mb-5">
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full">Learning</span>
                      <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-1 rounded-full">Software Development</span>
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full">Blockchain</span>
                      <span className="bg-amber-100 text-amber-800 text-xs font-medium px-2.5 py-1 rounded-full">Artificial Intelligence</span>
                      <span className="bg-rose-100 text-rose-800 text-xs font-medium px-2.5 py-1 rounded-full">Improving Education</span>
                      <span className="bg-sky-100 text-sky-800 text-xs font-medium px-2.5 py-1 rounded-full">Decentralized</span>
                    </div>
                    <Button
                      onClick={() => setPathDialog(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-2 inline-flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                      </svg>
                      Generate Path
                    </Button>
                  </div>
                  <div className="bg-gradient-to-br from-blue-600 to-indigo-600 md:w-72 p-6 flex flex-col justify-center text-white">
                    <h3 className="text-lg font-bold mb-3">What you&apos;ll get:</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-200" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Structured learning plan
                      </li>
                      <li className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-200" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Prioritized tasks
                      </li>
                      <li className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-200" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Progress tracking
                      </li>
                      <li className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-200" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Get your edu back
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Generated Learning Path (Appears after generation) */}
          {showGeneratedPath && (
            <div id="generated-path" className="mb-8 animate-fade-in">
              <Card className="border-2 border-blue-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-6 px-8">
                  <h2 className="text-2xl font-bold text-white">{generatedPathInfo.title}</h2>
                  <p className="text-blue-100 mt-2 max-w-3xl">{generatedPathInfo.description}</p>
                  {generatedPathInfo.transactionHash && (
                    <div className="flex items-center mt-3 bg-white/10 rounded-md px-3 py-2 text-sm text-blue-50">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      <span className="mr-2">Generated with Edu Token Payment</span>
                      <span className="overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px] lg:max-w-md">
                        Tx: {generatedPathInfo.transactionHash.substring(0, 8)}...{generatedPathInfo.transactionHash.substring(generatedPathInfo.transactionHash.length - 8)}
                      </span>
                    </div>
                  )}
                </div>

                <CardContent className="p-8">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-blue-50 rounded-lg p-4 flex flex-col items-center justify-center">
                      <div className="text-blue-500 mb-1 text-sm font-medium">TASKS</div>
                      <div className="text-2xl font-bold">{generatedPathInfo.taskCount}</div>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-4 flex flex-col items-center justify-center">
                      <div className="text-emerald-500 mb-1 text-sm font-medium">STATUS</div>
                      <div className="text-base font-semibold">Ready to Start</div>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-4 flex flex-col items-center justify-center">
                      <div className="text-amber-500 mb-1 text-sm font-medium">PROGRESS</div>
                      <div className="text-base font-semibold">
                        {generatedPathInfo.tasks.length > 0
                          ? Math.round((generatedPathInfo.tasks.filter(t => t.status === 'completed').length / generatedPathInfo.tasks.length) * 100)
                          : 0}%
                      </div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4 flex flex-col items-center justify-center">
                      <div className="text-purple-500 mb-1 text-sm font-medium">CREATED</div>
                      <div className="text-base font-semibold">{new Date().toLocaleDateString()}</div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold flex items-center">
                        <span className="mr-2">Learning Tasks</span>
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          {generatedPathInfo.taskCount} tasks
                        </span>
                      </h3>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="text-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                          </svg>
                          Sort Tasks
                        </Button>
                        <Button variant="outline" size="sm" className="text-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                          </svg>
                          Filter
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {generatedPathInfo.tasks.map((task: ITask, idx: number) => {
                        // Add a local state variable to track pending completion status
                        const isPendingCompletion = loading && task.status !== 'completed' && task._pendingCompletion;

                        return (
                          <div key={idx} className={`border-2 ${task.status === 'completed' || isPendingCompletion ? 'border-green-500 bg-green-50' : 'border-gray-100 bg-white'} rounded-lg p-5 shadow-sm hover:shadow-md transition-all duration-200`}>
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-3">
                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 font-medium flex items-center justify-center">
                                  {idx + 1}
                                </div>
                                <h4 className="font-semibold text-base">{task.title}</h4>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-1 rounded-full 
                                ${task.priority === 'high' || task.priority === 'critical'
                                    ? 'bg-red-100 text-red-800'
                                    : task.priority === 'medium'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-green-100 text-green-800'
                                  }`}>
                                  {task.priority}
                                </span>
                                <span className={`text-xs px-2 py-1 rounded-full ${task.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'}`}>
                                  {task.status}
                                </span>
                              </div>
                            </div>
                            <p className="text-gray-600 mb-3 text-sm">{task.description}</p>
                            <div className="flex justify-between items-center">
                              {task.tags && (
                                <div className="flex flex-wrap gap-1.5">
                                  {task.tags.split(',').map((tag: string, tagIdx: number) => (
                                    <span key={tagIdx} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
                                      #{tag.trim()}
                                    </span>
                                  ))}
                                </div>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`text-xs ${task.status === 'completed' ? 'bg-green-100 text-green-700' : ''}`}
                                onClick={() => {
                                  // Visual effect only implementation
                                  // Update the task in the state without blockchain interaction
                                  const updatedTasks = [...generatedPathInfo.tasks];
                                  const taskIndex = updatedTasks.indexOf(task);
                                  if (taskIndex !== -1) {
                                    // Update task status to completed
                                    updatedTasks[taskIndex] = {
                                      ...task,
                                      status: 'completed'
                                    };

                                    setGeneratedPathInfo({
                                      ...generatedPathInfo,
                                      tasks: updatedTasks
                                    });

                                    toast.success("Task marked as completed!");

                                    // Check if all tasks are completed
                                    const allTasksCompleted = updatedTasks.every(t => t.status === 'completed');

                                    if (allTasksCompleted) {
                                      toast.success("Congratulations! You've completed all tasks and earned 0.01 EDU tokens!");
                                    }
                                  }
                                }}
                                disabled={task.status === 'completed'}
                              >
                                {task.status === 'completed' ? 'Completed' : 'Mark Complete'}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-between mt-8">
                    <Button variant="outline">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 101.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 000 1.414z" clipRule="evenodd" />
                      </svg>
                      Export Path
                    </Button>
                    <div className="flex gap-2">
                      {generatedPathInfo.transactionHash && (
                        <Button
                          variant="outline"
                          className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                          onClick={handleViewOnExplorer}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                          </svg>
                          View Transaction
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        className="border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800"
                        onClick={handleGoToMindmap}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2a8 8 0 00-8 8c0 5.2 3.3 8 8 8v-4.5" />
                          <path d="M12 2a8 8 0 018 8c0 5.2-3.3 8-8 8v-4.5" />
                          <path d="M20 9H4" />
                        </svg>
                        Go to Mindmap
                      </Button>
                      <Button
                        variant="outline"
                        className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                        onClick={() => setShowGeneratedPath(false)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                        </svg>

                        Remove
                      </Button>
                      <Button
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={handleSaveToYourPaths}
                        disabled={loading}
                      >
                       {loading ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                          </span>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                            </svg>

                            Save to Your Paths
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          {/* Generate Path Dialog */}
          <Dialog open={pathDialog} onOpenChange={setPathDialog}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-xl">Create Learning Path</DialogTitle>
                <DialogDescription className="text-base mt-2">
                  Describe what you want to learn and our AI will create a personalized path for you.
                </DialogDescription>
              </DialogHeader>

              <div className="py-4">
                <div className="bg-blue-50 p-4 rounded-lg mb-5">
                  <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Tips for Better Results
                  </h4>
                  <ul className="text-sm text-blue-700 space-y-1 ml-2">
                    <li>• Be specific about your experience level</li>
                    <li>• Mention specific topics or technologies</li>
                    <li>• Include time constraints if relevant</li>
                    <li>• State your learning objectives clearly</li>
                  </ul>
                </div>

                <Label htmlFor="pathDescription" className="text-base font-medium">
                  Describe your learning goals
                </Label>
                <Textarea
                  id="pathDescription"
                  value={pathDescription}
                  onChange={(e) => setPathDescription(e.target.value)}
                  placeholder="e.g., I want to learn web3 development from scratch, focusing on smart contracts and dApps..."
                  className="min-h-[150px] mt-2 text-base"
                  required
                />

                <div className="mt-4 flex items-center text-amber-700 bg-amber-50 p-3 rounded-lg text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.414-1.414L11 9.414V6z" clipRule="evenodd" />
                  </svg>
                  Generation usually takes about 15-20 seconds.
                </div>
              </div>

              <DialogFooter className="flex sm:justify-between gap-2">
                <Button variant="outline" onClick={() => setPathDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleGeneratePath}
                  disabled={loading || !pathDescription}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </span>
                  ) : (
                    `Generate Path`
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function Page() {
  return (
    <AppContent />
  );
}
