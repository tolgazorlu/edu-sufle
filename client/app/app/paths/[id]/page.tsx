"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { getPathDetails } from "@/lib/contractUtils"
import { MetaMaskConnect } from "@/components/MetaMaskConnect"
import { Skeleton } from "@/components/ui/skeleton"

export default function PathDetailsPage({ params }: { params: { id: string } }) {
  const [path, setPath] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [connectedAddress, setConnectedAddress] = useState("")
  const router = useRouter()
  const pathId = params.id

  useEffect(() => {
    if (connectedAddress) {
      fetchPathDetails()
    } else {
      setLoading(false)
    }
  }, [connectedAddress, pathId])

  const fetchPathDetails = async () => {
    setLoading(true)
    try {
      const pathDetails = await getPathDetails(Number(pathId))
      if (pathDetails) {
        setPath(pathDetails)
      } else {
        toast.error("Path not found")
        router.push("/dashboard/paths")
      }
    } catch (error) {
      console.error("Error fetching path details:", error)
      toast.error("Failed to fetch path details")
    } finally {
      setLoading(false)
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col p-4 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                className="rounded-full w-8 h-8 p-0" 
                onClick={() => router.push("/dashboard/paths")}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                <span className="sr-only">Back</span>
              </Button>
              <h1 className="text-2xl font-semibold">Path Details</h1>
            </div>
            <MetaMaskConnect 
              onConnect={(address) => setConnectedAddress(address)} 
            />
          </div>

          {!connectedAddress ? (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
                  <p className="text-gray-600 mb-4">Connect your wallet to view path details.</p>
                </div>
              </CardContent>
            </Card>
          ) : loading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : !path ? (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-2">Path Not Found</h2>
                  <p className="text-gray-600 mb-4">The requested path could not be found.</p>
                  <Button 
                    onClick={() => router.push('/dashboard/paths')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Back to My Paths
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">{path.title}</CardTitle>
                  <p className="text-gray-500">
                    Created: {new Date(path.timestamp).toLocaleDateString()} at {new Date(path.timestamp).toLocaleTimeString()}
                  </p>
                </CardHeader>
                <CardContent>
                  <h3 className="text-lg font-medium mb-2">Description</h3>
                  <p className="text-gray-700 whitespace-pre-wrap mb-8">{path.description}</p>

                  <div className="flex justify-between">
                    <Button 
                      variant="outline" 
                      onClick={() => router.push('/dashboard/paths')}
                    >
                      Back to My Paths
                    </Button>
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => router.push('/dashboard')}
                    >
                      Generate New Path
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 