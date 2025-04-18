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
import { MetaMaskConnect } from "@/components/MetaMaskConnect";
import { createPath, createTask, updateTaskStatus, completePath } from '@/lib/contractUtils';
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

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col p-4 md:p-6">
          {/* Dashboard Header with Connect Button */}
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-800">Here you are</h1>
            <MetaMaskConnect
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              onBalanceUpdate={handleBalanceUpdate}
            />
          </div>


{/* Product Info Card with Wallet Information */}
<div className="mb-6">
            <Card className="shadow-lg overflow-hidden rounded-xl border border-emerald-100">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
                <div className="md:col-span-2 p-6 md:p-8">
                  <div className="flex items-center mb-4">
                    <div className="bg-emerald-100 p-2 rounded-lg mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Sufle - Your Wallet is connected</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-emerald-50 rounded-lg p-4">
                      <div className="text-emerald-600 font-semibold mb-1">Tolga Zorlu</div>
                      <div className="text-2xl font-bold text-emerald-700">tolgazorlu.edu</div>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-4">
                      <div className="text-emerald-600 font-semibold mb-1">Network</div>
                      <div className="text-lg font-semibold text-emerald-700 flex items-center">
                        <span className="h-2 w-2 bg-emerald-500 rounded-full mr-1"></span>
                        Open Campus Codex
                      </div>
                    </div>
                  </div>
                  
                  {connectedAddress && (
                    <div className="bg-gradient-to-r from-teal-50 to-emerald-50 p-4 rounded-lg mb-6">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                        <div>
                          <div className="text-sm text-teal-600 font-medium mb-1">Wallet Connected</div>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-teal-800">Address:</span>
                            <span className="text-teal-700 font-mono">
                              {connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)}
                            </span>
                            <button 
                              onClick={() => {navigator.clipboard.writeText(connectedAddress); toast.success("Address copied to clipboard")}}
                              className="text-teal-600 hover:text-teal-800"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <div className="mt-2 md:mt-0">
                          <div className="text-sm text-teal-600 font-medium mb-1">EDU Balance</div>
                          <div className="text-xl font-bold text-teal-800">{accountBalance} <span className="text-sm">EDU</span></div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-2">
                    {connectedAddress && (
                      <>
                        <Button 
                          variant="outline" 
                          className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          onClick={() => window.open("https://opencampus-codex.blockscout.com/address/" + connectedAddress, "_blank")}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                          </svg>
                          Explorer
                        </Button>
                        <Button 
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => window.open("https://www.hackquest.io/faucets/656476", "_blank")}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1z" clipRule="evenodd" />
                            <path d="M12 4a1 1 0 100 2h4a1 1 0 100-2h-4zM12 14a1 1 0 100 2h4a1 1 0 100-2h-4zM2 10a1 1 0 011-1h12a1 1 0 110 2H3a1 1 0 01-1-1z" />
                          </svg>
                          Get EDU Tokens
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-8 flex flex-col justify-center text-white">
                  <h3 className="text-lg font-bold mb-4">Platform Features</h3>
                  <ul className="space-y-3">
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-emerald-200" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      AI-Powered Learning Paths
                    </li>
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-emerald-200" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Decentralized Progress Tracking
                    </li>
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-emerald-200" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      EDU Token Rewards
                    </li>
                    <li className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-emerald-200" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Community Learning
                    </li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>

          
          {/* User Profile Card - Matching Design */}
          <div className="mb-6">
            <Card className="shadow-sm hover:shadow-md transition-shadow border border-indigo-100 overflow-hidden rounded-xl shadow-lg">
              <div className="flex flex-col md:flex-row">
                {/* Profile Info Section */}
                <div className="p-6 flex-1">
                  <div className="space-y-4">
                    {/* Categories and Motivations in a 2-column grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Interest Categories */}
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center mb-3">
                          <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center mr-2 p-1">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#3b82f6" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5-3.9 19.5m-2.1-19.5-3.9 19.5" />
</svg>

                          </div>
                          <h3 className="text-lg font-medium text-gray-700">Interests</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {surveyData?.categories.map((category, index) => (
                            <span key={index} className="text-xs px-3 py-1 bg-white text-blue-600 rounded-full border border-blue-100">
                              {category}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Motivations */}
                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="flex items-center mb-3">
                          <div className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center mr-2 p-1">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#10b981" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
</svg>

                          </div>
                          <h3 className="text-lg font-medium text-gray-700">Motivations</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {surveyData?.motivations.map((motivation, index) => (
                            <span key={index} className="text-xs px-3 py-1 bg-white text-green-600 rounded-full border border-green-100">
                              {motivation}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="bg-purple-50 rounded-lg p-4">
                        <div className="flex items-center mb-3">
                          <div className="w-6 h-6 bg-purple-200 rounded-full flex items-center justify-center mr-2 p-1">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#9333ea" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" />
</svg>

                          </div>
                          <h3 className="text-lg font-medium text-gray-700">Occupation</h3>
                        </div>
                        <span className="text-xs px-3 py-1 bg-white text-purple-600 rounded-full border border-purple-100">
                          {surveyData?.occupation || 'Not specified'}
                        </span>
                      </div>
                    </div>


                      {/* Life Goal */}
                      <div className="bg-amber-50 rounded-lg p-4">
                        <div className="flex items-center mb-3">
                          <div className="w-6 h-6 bg-amber-200 rounded-full flex items-center justify-center mr-2 p-1">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#d97706" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
</svg>

                          </div>
                          <h3 className="text-lg font-medium text-gray-700">Life Goal</h3>
                        </div>
                        <p className="text-xs text-gray-600 bg-white p-2 rounded border border-amber-100">
                          {surveyData?.lifeGoals || 'Not specified'}
                        </p>
                      </div>
                  
                  </div>
                </div>
              </div>
            </Card>
          </div>
          
          
          
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
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 101.414 1.414l-3 3a1 1 0 00-1.414 0l-3-3a1 1 0 000-1.414z" clipRule="evenodd" />
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
                        className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                        onClick={() => setShowGeneratedPath(false)}
                      >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
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
