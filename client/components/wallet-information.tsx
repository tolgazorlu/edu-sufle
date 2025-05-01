"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import Web3 from "web3";
import { SUFLE_ABI, SUFLE_CONTRACT_ADDRESS } from '@/lib/contracts';

export function WalletInformation() {
  const [connectedAddress, setConnectedAddress] = useState("");
  const [accountBalance, setAccountBalance] = useState("0");

  // Check if wallet is connected on page load
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const web3 = new Web3(window.ethereum);
          const accounts = await web3.eth.getAccounts();
          
          if (accounts.length > 0) {
            setConnectedAddress(accounts[0]);
            
            // Get balance
            try {
              const balance = await web3.eth.getBalance(accounts[0]);
              const etherBalance = web3.utils.fromWei(balance, 'ether');
              setAccountBalance(parseFloat(etherBalance).toFixed(4));
            } catch (error) {
              console.error("Error fetching balance:", error);
            }
          }
        } catch (error) {
          console.error("Error checking connection:", error);
        }
      }
    };
    
    checkConnection();
    
    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setConnectedAddress(accounts[0]);
        } else {
          setConnectedAddress("");
          setAccountBalance("0");
        }
      });
    }
    
    return () => {
      // Clean up listeners
      if (window.ethereum && window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', () => {});
      }
    };
  }, []);

  return (
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
  );
}
