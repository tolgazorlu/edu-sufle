"use client"

import { useState, useEffect } from 'react'
import { useOCAuth } from "@opencampus/ocid-connect-js"
import Web3 from 'web3'
import { toast } from 'sonner'
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { SUFLE_CONTRACT_ADDRESS } from '@/lib/contracts'
import { formatDistanceToNow } from 'date-fns'
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

interface Transaction {
  hash: string
  from: string
  to: string
  value: string
  timestamp: number
  blockNumber: number
  method?: string
}

export default function TransactionsPage() {
  const { authState } = useOCAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [account, setAccount] = useState<string | null>(null)
  const [connectedAddress, setConnectedAddress] = useState<string>("");
  const [accountBalance, setAccountBalance] = useState<string>("0");

  useEffect(() => {
    const connectWallet = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
          setAccount(accounts[0])
        } catch (error) {
          console.error("Failed to connect wallet:", error)
          toast.error("Failed to connect to MetaMask")
        }
      } else {
        toast.error("Please install MetaMask to view transactions")
      }
    }

    connectWallet()
  }, [])

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!window.ethereum) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const web3 = new Web3(window.ethereum)
        
        // Get the latest block number
        const latestBlock = await web3.eth.getBlockNumber()
        
        // We'll scan the last 10000 blocks for transactions involving our contract
        // Adjust this number based on your needs and network performance
        const blocksToScan = 10000
        const fromBlock = Math.max(0, Number(latestBlock) - blocksToScan)
        
        // Get all transactions to/from the contract
        const contractTransactions: Transaction[] = []
        
        // Get past events from the contract
        const events = await web3.eth.getPastLogs({
          fromBlock: fromBlock,
          toBlock: 'latest',
          address: SUFLE_CONTRACT_ADDRESS
        })
        
        // Process each event
        for (const event of events) {
          // Ensure event has transactionHash and blockNumber properties
          if (typeof event === 'string' || !event.transactionHash || !event.blockNumber) continue;
          
          const tx = await web3.eth.getTransaction(event.transactionHash)
          const block = await web3.eth.getBlock(event.blockNumber)
          
          // Decode the method if possible
          let method = 'Contract Interaction'
          if (tx.input && tx.input.length >= 10) {
            const methodId = tx.input.slice(0, 10)
            // You can add a mapping of method IDs to method names here
            // For example: if (methodId === '0x12345678') method = 'createTask'
          }
          
          contractTransactions.push({
            hash: tx.hash,
            from: tx.from,
            to: tx.to || '',
            value: web3.utils.fromWei(tx.value, 'ether'),
            timestamp: block.timestamp ? Number(block.timestamp) * 1000 : Date.now(),
            blockNumber: tx.blockNumber ? Number(tx.blockNumber) : 0,
            method
          })
        }
        
        // Sort transactions by timestamp (newest first)
        contractTransactions.sort((a, b) => b.timestamp - a.timestamp)
        
        setTransactions(contractTransactions)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching transactions:", error)
        toast.error("Failed to fetch transactions")
        setLoading(false)
      }
    }

    if (account) {
      fetchTransactions()
    }
  }, [account])

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const shortenHash = (hash: string) => {
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`
  }

  const openEtherscan = (hash: string) => {
    // Using Sepolia testnet explorer - change this to the appropriate network
    window.open(`https://sepolia.etherscan.io/tx/${hash}`, '_blank')
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
        <SiteHeader title="Transactions" handleConnect={handleConnect} handleDisconnect={handleDisconnect} handleBalanceUpdate={handleBalanceUpdate} />
        <div className="flex flex-1 flex-col p-4 md:p-6">
          <Card>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex flex-col space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  ))}
                </div>
              ) : transactions.length > 0 ? (
                <Table>
                  <TableCaption>A list of all transactions related to the Sufle contract.</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction Hash</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Value (ETH)</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.hash}>
                        <TableCell className="font-medium">{shortenHash(tx.hash)}</TableCell>
                        <TableCell>{shortenAddress(tx.from)}</TableCell>
                        <TableCell>{shortenAddress(tx.to)}</TableCell>
                        <TableCell>{tx.value}</TableCell>
                        <TableCell>{formatDistanceToNow(tx.timestamp, { addSuffix: true })}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" onClick={() => openEtherscan(tx.hash)}>
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No transactions found for this contract.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
