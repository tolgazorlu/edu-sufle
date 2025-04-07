"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Web3 from "web3"
import SufleABI from "@/constants/abis/Sufle.json"
import { MetaMaskConnect } from "@/components/MetaMaskConnect";

interface Task {
  title: string;
  description: string;
  priority: string;
  status: string;
  tags: string;
}

interface GeneratedPathInfo {
  title: string;
  description: string;
  taskCount: number;
  transactionHash: string | null;
  tasks: Task[];
}

export default function Page() {
  const [connectedAddress, setConnectedAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [pathDialog, setPathDialog] = useState(false);
  const [pathDescription, setPathDescription] = useState("");
  const [generatedPathInfo, setGeneratedPathInfo] = useState<GeneratedPathInfo>({
    title: "",
    description: "",
    taskCount: 0,
    tasks: [],
    transactionHash: null
  });
  const [showGeneratedPath, setShowGeneratedPath] = useState(false);
  const [accountBalance, setAccountBalance] = useState("0");
  const EDU_TOKEN_PRICE = "0.01";

  const handleConnect = (address: string) => {
    setConnectedAddress(address);
  };

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
      
     
      const contractAddress = "0x5ae3C1C707492e9d319953A2c3bE0cb651C38fC8";
      const contractABI = SufleABI;
      
      const eduTokenContract = new web3.eth.Contract(contractABI, contractAddress);
      
      // Estimate gas first
      const gasPrice = await web3.eth.getGasPrice();
      const estimatedGas = await eduTokenContract.methods
        .generatePathWithDescription(pathDescription)
        .estimateGas({
          from: accounts[0],
          value: web3.utils.toWei(EDU_TOKEN_PRICE, "ether"),
        })
        .catch(() => "500000"); // Fallback if estimation fails
      
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
      
      setGeneratedPathInfo({
        title: pathData.title || `AI Generated Path (${new Date().toLocaleDateString()})`,
        description: pathData.description || pathDescription,
        taskCount: pathData.tasks?.length || 0,
        tasks: pathData.tasks || [],
        transactionHash: transaction.transactionHash 
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

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col p-4 md:p-6">
          {/* Dashboard Header with Connect Button */}
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
            <MetaMaskConnect
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              onBalanceUpdate={handleBalanceUpdate}
            />
          </div>

          {/* Account Information Card - Only shown when connected */}
          {connectedAddress && (
            <div className="mb-6">
              <Card className="border-none overflow-hidden bg-gradient-to-r from-teal-50 to-emerald-50">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between items-center">
                    <div>
                      <div className="text-sm text-teal-600 font-medium mb-1">Wallet Connected</div>
                      <h2 className="text-xl font-bold text-teal-900 mb-2 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-teal-600" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                          <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                        </svg>
                        Open Campus Account
                      </h2>
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
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-teal-800">Network:</span>
                        <span className="bg-teal-100 text-teal-800 text-xs px-2.5 py-1 rounded-full flex items-center">
                          <span className="h-2 w-2 bg-teal-500 rounded-full mr-1"></span>
                          Open Campus Codex
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4 md:mt-0 flex flex-col items-center md:items-end">
                      <div className="text-sm text-teal-600 font-medium mb-1">EDU Balance</div>
                      <div className="text-3xl font-bold text-teal-800 mb-1">{accountBalance} <span className="text-sm">EDU</span></div>
                      <div className="flex space-x-2 mt-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-teal-200 text-teal-700 hover:bg-teal-50 hover:text-teal-800 text-xs"
                          onClick={() => window.open("https://opencampus-codex.blockscout.com/address/" + connectedAddress, "_blank")}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                          </svg>
                          Explorer
                        </Button>
                        <Button 
                          size="sm"
                          className="bg-teal-600 hover:bg-teal-700 text-xs"
                          onClick={() => window.open("https://www.hackquest.io/faucets/656476", "_blank")}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1z" clipRule="evenodd" />
                            <path d="M12 4a1 1 0 100 2h4a1 1 0 100-2h-4zM12 14a1 1 0 100 2h4a1 1 0 100-2h-4zM2 10a1 1 0 011-1h12a1 1 0 110 2H3a1 1 0 01-1-1z" />
                          </svg>
                          Get EDU Tokens
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* User Profile Card */}
          <div className="mb-6">
            <Card className="border-none overflow-hidden bg-gradient-to-r from-indigo-50 to-purple-50">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div className="p-6 md:p-8 flex-1">
                    <div className="text-sm text-indigo-600 font-medium mb-1">Here you are</div>
                    <h2 className="text-2xl font-bold text-indigo-900 mb-4">Tolga Zorlu</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12">
                      <div>
                        <div className="flex items-center mb-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                          </svg>
                          <span className="font-medium text-indigo-900">Interest Categories:</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-4 ml-7">
                          <span className="bg-indigo-100 text-indigo-800 text-xs px-2.5 py-1 rounded-full">Education</span>
                          <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-full">Technology</span>
                          <span className="bg-purple-100 text-purple-800 text-xs px-2.5 py-1 rounded-full">Community</span>
                        </div>
                        
                        <div className="flex items-center mb-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                          </svg>
                          <span className="font-medium text-indigo-900">Motivations:</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 ml-7">
                          <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full">Learning</span>
                          <span className="bg-sky-100 text-sky-800 text-xs px-2.5 py-1 rounded-full">Networking</span>
                          <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full">Growth</span>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center mb-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                            <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                          </svg>
                          <span className="font-medium text-indigo-900">Occupation:</span>
                        </div>
                        <div className="mb-4 ml-7">
                          <span className="bg-violet-100 text-violet-800 text-xs px-2.5 py-1 rounded-full">Educator</span>
                        </div>
                        
                        <div className="flex items-center mb-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="font-medium text-indigo-900">Life Goal:</span>
                        </div>
                        <div className="ml-7">
                          <p className="text-indigo-700">Empowering others through knowledge</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-indigo-600 to-purple-600 md:w-1/4 p-6 flex flex-col justify-center items-center text-white">
                    <div className="bg-white/20 rounded-full p-4 mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold mb-1">Profile Strength</h3>
                    <div className="w-full bg-white/20 rounded-full h-2.5 mb-2">
                      <div className="bg-white h-2.5 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                    <p className="text-sm font-medium">85% Complete</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-3">
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-none">
                <CardHeader>
                  <CardTitle className="text-xl text-blue-800">Generate Learning Path</CardTitle>
                  <CardDescription className="text-blue-700">Use AI to create a personalized learning path</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row items-center justify-between">
                    <div className="mb-6 md:mb-0 md:mr-8 max-w-md">
                      <p className="text-gray-700 mb-4">
                        Let our AI generate a personalized learning path tailored to your specific interests, 
                        skill level, and learning goals. Get a structured plan with prioritized tasks to guide your learning journey.
                      </p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Smart Contracts</span>
                        <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">DApps</span>
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Blockchain</span>
                        <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">Web3</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <Button
                        onClick={() => setPathDialog(true)}
                        className="bg-blue-600 hover:bg-blue-700 px-8 rounded-full h-12 text-base"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                        </svg>
                        Generate Path
                      </Button>
                    </div>
                  </div>
                </CardContent>
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
                      <div className="text-base font-semibold">0%</div>
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
                            <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
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
                      {generatedPathInfo.tasks.map((task: Task, idx: number) => (
                        <div key={idx} className="border border-gray-100 bg-white rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
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
                              <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
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
                            <Button variant="ghost" size="sm" className="text-xs">
                              Mark Complete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-between mt-8">
                    <Button variant="outline">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
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
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Remove
                      </Button>
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h1a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h1v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
                        </svg>
                        Save to Your Paths
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
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
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
