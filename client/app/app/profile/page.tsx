"use client"
import { Card } from "@/components/ui/card"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { useEffect, useState } from "react"
import Web3 from "web3"
import { SUFLE_ABI, SUFLE_CONTRACT_ADDRESS } from "@/lib/contracts"




export default function Lifecycle() {
    const [connectedAddress, setConnectedAddress] = useState("")
    const [accountBalance, setAccountBalance] = useState("0");

    const [surveyData, setSurveyData] = useState<{
        categories: string[];
        motivations: string[];
        occupation: string;
        lifeGoals: string;
      } | null>(null);

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
        <SiteHeader title="Profile" handleConnect={handleConnect} handleDisconnect={handleDisconnect} handleBalanceUpdate={handleBalanceUpdate} />
        <div className="flex flex-1 flex-col p-4 md:p-6">
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
                    
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

