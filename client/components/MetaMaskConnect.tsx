"use client";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import Web3 from "web3";
import { toast } from "@/components/ui/use-toast";

interface MetaMaskConnectProps {
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
  onBalanceUpdate?: (balance: string) => void;
  className?: string;
}

const OPEN_CAMPUS_CHAIN_ID = "0xa045c";

export const MetaMaskConnect: React.FC<MetaMaskConnectProps> = ({
  onConnect,
  onDisconnect,
  onBalanceUpdate,
  className = "bg-teal-400 hover:bg-teal-700 text-black font-bold py-2 px-4 rounded-md mb-4",
}) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [accountAddress, setAccountAddress] = useState<string | undefined>(
    undefined
  );
  const [balance, setBalance] = useState<string>("0");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);

  const handleDisconnect = useCallback(() => {
    setAccountAddress(undefined);
    setIsConnected(false);
    localStorage.removeItem("walletAddress");
    onDisconnect?.();
  }, [onDisconnect]);

  const checkEduTokenBalance = useCallback(async () => {
    if (!window.ethereum || !accountAddress) return;
    
    try {
      const web3 = new Web3(window.ethereum);
      const balance = await web3.eth.getBalance(accountAddress);
      const eduBalance = web3.utils.fromWei(balance, 'ether');
      const formattedBalance = parseFloat(eduBalance).toFixed(4);
      setBalance(formattedBalance);
      
      if (onBalanceUpdate) {
        onBalanceUpdate(formattedBalance);
      }
    } catch (error) {
      console.error("Error fetching EDU balance:", error);
    }
  }, [accountAddress, onBalanceUpdate]);

  const checkConnection = useCallback(async (storedAddress: string) => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });
        if (
          accounts[0] &&
          accounts[0].toLowerCase() === storedAddress.toLowerCase()
        ) {
          const chainId = await window.ethereum.request({
            method: "eth_chainId",
          });
          if (chainId === OPEN_CAMPUS_CHAIN_ID) {
            setAccountAddress(accounts[0]);
            setIsConnected(true);
            onConnect?.(accounts[0]);
          } else {
            await switchToOpenCampusNetwork();
          }
        } else {
          handleDisconnect();
        }
      } catch (error) {
        console.error("Error checking connection:", error);
        handleDisconnect();
      }
    }
  }, [onConnect, handleDisconnect]);

  const handleAccountsChanged = useCallback((accounts: string[]) => {
    if (accounts.length === 0) {
      handleDisconnect();
    } else {
      setAccountAddress(accounts[0]);
      setIsConnected(true);
      onConnect?.(accounts[0]);
    }
  }, [onConnect, handleDisconnect]);

  const handleChainChanged = useCallback(async (chainId: string) => {
    if (chainId !== OPEN_CAMPUS_CHAIN_ID) {
      await switchToOpenCampusNetwork();
    }
  }, [handleDisconnect]);

  useEffect(() => {
    const storedAddress = localStorage.getItem("walletAddress");
    if (storedAddress) {
      checkConnection(storedAddress);
    }

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [checkConnection, handleAccountsChanged, handleChainChanged]);

  useEffect(() => {
    if (isConnected && accountAddress) {
      checkEduTokenBalance();
    }
  }, [isConnected, accountAddress, checkEduTokenBalance]);

  const switchToOpenCampusNetwork = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: OPEN_CAMPUS_CHAIN_ID }],
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: OPEN_CAMPUS_CHAIN_ID,
                  chainName: "Open Campus Codex",
                  nativeCurrency: {
                    name: "EDU",
                    symbol: "EDU",
                    decimals: 18,
                  },
                  rpcUrls: ["https://rpc.open-campus-codex.gelato.digital"],
                  blockExplorerUrls: [
                    "https://opencampus-codex.blockscout.com/",
                  ],
                },
              ],
            });
          } catch (addError) {
            console.error("Failed to add Open Campus Codex network:", addError);
            toast({
              variant: "destructive",
              title: "Network Error",
              description: "Failed to add Open Campus Codex network",
            });
          }
        } else {
          console.error(
            "Failed to switch to Open Campus Codex network:",
            switchError
          );
          toast({
            variant: "destructive",
            title: "Network Error",
            description: "Failed to switch to Open Campus Codex network",
          });
        }
      }
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum === "undefined") {
      toast({
        variant: "destructive",
        title: "MetaMask Required",
        description: "Please install MetaMask to use this application",
      });
      return;
    }

    try {
      await switchToOpenCampusNetwork();
      const chainId = await window.ethereum.request({ method: "eth_chainId" });

      if (chainId !== OPEN_CAMPUS_CHAIN_ID) {
        toast({
          variant: "destructive",
          title: "Network Error",
          description: "Please connect to Open Campus Codex network",
        });
        return;
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setAccountAddress(accounts[0]);
      setIsConnected(true);
      localStorage.setItem("walletAddress", accounts[0]);
      onConnect?.(accounts[0]);

      toast({
        title: "Wallet Connected",
        description: `Connected to ${accounts[0].slice(
          0,
          6
        )}...${accounts[0].slice(-4)}`,
      });
    } catch (error: any) {
      console.error("Failed to connect wallet:", error);
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: error.message || "Failed to connect wallet",
      });
    }
  };

  const payWithEduToken = async (amount: string) => {
    if (!window.ethereum || !accountAddress) {
      toast({
        variant: "destructive",
        title: "Wallet Error",
        description: "Please connect your wallet first",
      });
      return false;
    }

    try {
      const web3 = new Web3(window.ethereum);
      const weiAmount = web3.utils.toWei(amount, 'ether');
      
      // Check current gas price
      const gasPrice = await web3.eth.getGasPrice();
      const gasPriceGwei = web3.utils.fromWei(gasPrice, 'gwei');
      
      // Set a threshold for "high" gas fees (e.g., 50 Gwei)
      const highGasThreshold = 50;
      
      if (parseFloat(gasPriceGwei) > highGasThreshold) {
        toast({
          variant: "destructive",
          title: "Transaction Stopped",
          description: "This transaction would have cost you extra fees, so we stopped it. Your money is still in your wallet.",
        });
        return false;
      }
      
      // Send transaction to the contract address
      const contractAddress = "0xYourContractAddressHere"; // Replace with actual contract address
      
      const tx = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: accountAddress,
            to: contractAddress,
            value: web3.utils.numberToHex(weiAmount),
            data: web3.utils.toHex('generatePathWithAI'), // Function signature
          },
        ],
      });

      toast({
        title: "Payment Successful",
        description: `Transaction hash: ${tx.slice(0, 10)}...`,
      });
      
      // Update balance after payment
      await checkEduTokenBalance();
      
      return true;
    } catch (error: any) {
      console.error("Payment failed:", error);
      toast({
        variant: "destructive",
        title: "Payment Failed",
        description: error.message || "Failed to complete payment",
      });
      return false;
    }
  };

  // Expose the payment function globally
  if (typeof window !== "undefined") {
    window.payWithEduToken = payWithEduToken;
  }

  if (isConnected && accountAddress) {
    return (
      <div className="flex items-center gap-2 bg-teal-50/80 dark:bg-teal-900/20 rounded-full border border-teal-200/50 dark:border-teal-800/30 h-8 px-2">
        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
        <div className="text-xs text-gray-600 dark:text-gray-400">
          {accountAddress.slice(0, 6)}...{accountAddress.slice(-4)}
        </div>
        <div className="flex items-center gap-1 px-2 py-0.5 bg-teal-100/50 dark:bg-teal-800/20 rounded-full">
          <span className="font-medium text-xs">{balance}</span>
          <span className="text-xs font-semibold text-teal-600 dark:text-teal-400">EDU</span>
        </div>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => handleDisconnect()}
          className="h-5 w-5 p-0 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </Button>
      </div>
    );
  }

  return (
    <Button size="sm" onClick={connectWallet}>
      Connect with MetaMask
    </Button>
  );
};