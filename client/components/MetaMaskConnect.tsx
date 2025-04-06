"use client";
import { useState, useEffect } from "react";
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

  useEffect(() => {
    // Check localStorage for existing connection
    const storedAddress = localStorage.getItem("walletAddress");
    if (storedAddress) {
      checkConnection(storedAddress);
    }

    // Add event listeners for account and network changes
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
  }, []);

  useEffect(() => {
    if (isConnected && accountAddress) {
      checkEduTokenBalance();
    }
  }, [isConnected, accountAddress]);

  const checkEduTokenBalance = async () => {
    if (!window.ethereum || !accountAddress) return;
    
    try {
      // For the native EDU token on Open Campus Codex
      const web3 = new Web3(window.ethereum);
      const balance = await web3.eth.getBalance(accountAddress);
      const eduBalance = web3.utils.fromWei(balance, 'ether');
      const formattedBalance = parseFloat(eduBalance).toFixed(4);
      setBalance(formattedBalance);
      
      // Call the onBalanceUpdate prop if provided
      if (onBalanceUpdate) {
        onBalanceUpdate(formattedBalance);
      }
    } catch (error) {
      console.error("Error fetching EDU balance:", error);
    }
  };

  const checkConnection = async (storedAddress: string) => {
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
  };

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

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      handleDisconnect();
    } else if (accounts[0] !== accountAddress) {
      setAccountAddress(accounts[0]);
      setIsConnected(true);
      localStorage.setItem("walletAddress", accounts[0]);
      onConnect?.(accounts[0]);
      toast({
        title: "Account Changed",
        description: `Connected to ${accounts[0].slice(
          0,
          6
        )}...${accounts[0].slice(-4)}`,
      });
    }
  };

  const handleChainChanged = async (chainId: string) => {
    if (chainId !== OPEN_CAMPUS_CHAIN_ID) {
      toast({
        variant: "destructive",
        title: "Network Error",
        description: "Please connect to Open Campus Codex network",
      });
      await switchToOpenCampusNetwork();
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setAccountAddress(undefined);
    localStorage.removeItem("walletAddress");
    onDisconnect?.();
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
      <div className="flex items-center space-x-2">
        <div className="flex flex-col items-end">
            <div className="text-sm">
              <span className="font-medium">{balance} EDU</span>
            </div>
            <div className="text-xs truncate max-w-[150px] ">
              {accountAddress.slice(0, 6)}...{accountAddress.slice(-4)}
            </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => handleDisconnect()}
          className="text-xs"
        >
          Disconnect
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