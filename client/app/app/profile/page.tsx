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
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              {/* Interests */}
              <div className="grid grid-cols-12 border-b border-gray-100">
                <div className="col-span-3 bg-gray-50 py-3 px-4 font-medium text-gray-700">
                  Interests:
                </div>
                <div className="col-span-9 py-3 px-4 flex flex-wrap gap-1 items-center">
                  {surveyData?.categories && surveyData.categories.length > 0 ? (
                    surveyData.categories.map((category, index) => (
                      <span key={index} className="text-sm">
                        {category}{index < surveyData.categories.length - 1 ? ", " : ""}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">Not specified</span>
                  )}
                </div>
              </div>

              {/* Motivations */}
              <div className="grid grid-cols-12 border-b border-gray-100">
                <div className="col-span-3 bg-gray-50 py-3 px-4 font-medium text-gray-700">
                  Motivations:
                </div>
                <div className="col-span-9 py-3 px-4 flex flex-wrap gap-1 items-center">
                  {surveyData?.motivations && surveyData.motivations.length > 0 ? (
                    surveyData.motivations.map((motivation, index) => (
                      <span key={index} className="text-sm">
                        {motivation}{index < surveyData.motivations.length - 1 ? ", " : ""}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">Not specified</span>
                  )}
                </div>
              </div>

              {/* Occupation */}
              <div className="grid grid-cols-12 border-b border-gray-100">
                <div className="col-span-3 bg-gray-50 py-3 px-4 font-medium text-gray-700">
                  Occupation:
                </div>
                <div className="col-span-9 py-3 px-4 flex flex-wrap gap-1 items-center">
                  <span className="text-sm">{surveyData?.occupation || 'Not specified'}</span>
                </div>
              </div>

              {/* Life Goal */}
              <div className="grid grid-cols-12 border-b border-gray-100">
                <div className="col-span-3 bg-gray-50 py-3 px-4 font-medium text-gray-700">
                  Life Goal:
                </div>
                <div className="col-span-9 py-3 px-4">
                  <p className="text-sm">{surveyData?.lifeGoals || 'Not specified'}</p>
                </div>
              </div>
            </div>
          </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
