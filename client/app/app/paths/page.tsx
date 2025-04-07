"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { getUserPaths } from "@/lib/contractUtils"
import { MetaMaskConnect } from "@/components/MetaMaskConnect"

export default function PathsPage() {
  const [paths, setPaths] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [connectedAddress, setConnectedAddress] = useState("")
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
      const userPaths = await getUserPaths(connectedAddress)
      setPaths(userPaths)
    } catch (error) {
      console.error("Error fetching paths:", error)
      toast.error("Failed to fetch your paths")
    } finally {
      setLoading(false)
    }
  }

  const handleViewPath = (pathId: string) => {
    router.push(`/dashboard/paths/${pathId}`)
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col p-4 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold">My Learning Paths</h1>
            <MetaMaskConnect 
              onConnect={(address) => setConnectedAddress(address)} 
            />
          </div>

          {!connectedAddress ? (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-2">Connect Your Wallet</h2>
                  <p className="text-gray-600 mb-4">Connect your wallet to view your saved learning paths.</p>
                </div>
              </CardContent>
            </Card>
          ) : loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : paths.length === 0 ? (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-2">No Learning Paths Found</h2>
                  <p className="text-gray-600 mb-4">You haven't saved any learning paths yet.</p>
                  <Button 
                    onClick={() => router.push('/dashboard')}
                    className="bg-blue-600 hover:bg-blue-700 px-8 rounded-full h-12 text-base"
                  >
                    Generate a New Path
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {paths.map((path) => (
                <Card key={path.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl">{path.title}</CardTitle>
                    <CardDescription>
                      Created: {new Date(path.timestamp).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 line-clamp-3">{path.description}</p>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={() => handleViewPath(path.id)}
                    >
                      View Path
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}

          {paths.length > 0 && (
            <div className="mt-6 text-center">
              <Button 
                onClick={() => router.push('/dashboard')}
                variant="outline"
                className="px-8 rounded-full h-12 text-base"
              >
                Generate a New Path
              </Button>
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 