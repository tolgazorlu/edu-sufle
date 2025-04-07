import Web3 from 'web3';
import { toast } from 'sonner';
import SufleABI from '@/constants/abis/Sufle.json';

export interface Task {
  title: string;
  description: string;
  priority: string;
  status: string;
  tags: string;
}

export interface Path {
  title: string;
  description: string;
  tasks: Task[];
}

// Define interface for path info returned from contract
export interface PathInfo {
  title: string;
  description: string;
  creator: string;
  timestamp: string;
  // Add other properties that might be returned from the contract
}

// Replace with your contract address
const CONTRACT_ADDRESS = "0x5ae3C1C707492e9d319953A2c3bE0cb651C38fC8";

export async function createTask(
  address: string, 
  title: string, 
  description: string,
  priority: string,
  status: string,
  tags: string
): Promise<string | null> {
  if (!window.ethereum) {
    toast.error("Please install MetaMask to use this feature");
    return null;
  }

  try {
    const web3 = new Web3(window.ethereum);
    const contract = new web3.eth.Contract(SufleABI as any, CONTRACT_ADDRESS);

    const result = await contract.methods.createTask(
      title,
      description,
      priority,
      status,
      tags
    ).send({ from: address });

    return result.transactionHash;
  } catch (error) {
    console.error("Error creating task:", error);
    toast.error("Failed to create task");
    return null;
  }
}

export async function createPath(
  address: string,
  path: Path,
  taskIds: number[]
): Promise<string | null> {
  if (!window.ethereum) {
    toast.error("Please install MetaMask to use this feature");
    return null;
  }

  try {
    const web3 = new Web3(window.ethereum);
    const contract = new web3.eth.Contract(SufleABI as any, CONTRACT_ADDRESS);

    const result = await contract.methods.createPath(
      path.title,
      path.description,
      taskIds
    ).send({ from: address });

    return result.transactionHash;
  } catch (error) {
    console.error("Error creating path:", error);
    toast.error("Failed to create path");
    return null;
  }
}

export async function generatePathWithAI(
  address: string,
  pathId: number,
  amount: string
): Promise<boolean> {
  if (!window.ethereum) {
    toast.error("Please install MetaMask to use this feature");
    return false;
  }

  try {
    const web3 = new Web3(window.ethereum);
    const contract = new web3.eth.Contract(SufleABI as any, CONTRACT_ADDRESS);
    const weiAmount = web3.utils.toWei(amount, 'ether');

    await contract.methods.generatePathWithAI(pathId)
      .send({ 
        from: address, 
        value: weiAmount 
      });

    return true;
  } catch (error) {
    console.error("Error generating path with AI:", error);
    toast.error("Failed to generate path with AI");
    return false;
  }
}

export async function getUserPaths(address: string): Promise<any[]> {
  if (!window.ethereum) {
    toast.error("Please install MetaMask to use this feature");
    return [];
  }

  try {
    const web3 = new Web3(window.ethereum);
    const contract = new web3.eth.Contract(SufleABI as any, CONTRACT_ADDRESS);

    // Get path IDs for the user
    const pathIds = await contract.methods.getUserGeneratedPaths(address).call();
    
    if (!pathIds || pathIds.length === 0) {
      return [];
    }

    // Get details for each path
    const paths = [];
    for (const pathId of pathIds) {
      const pathInfo = await contract.methods.getGeneratedPathInfo(pathId).call() as PathInfo;
      
      paths.push({
        id: pathId,
        title: pathInfo.title || `Path #${pathId}`,
        description: pathInfo.description,
        creator: pathInfo.creator,
        timestamp: new Date(Number(pathInfo.timestamp) * 1000)
      });
    }

    return paths;
  } catch (error) {
    console.error("Error fetching user paths:", error);
    toast.error("Failed to fetch your paths");
    return [];
  }
}

export async function getPathDetails(pathId: number): Promise<any | null> {
  if (!window.ethereum) {
    toast.error("Please install MetaMask to use this feature");
    return null;
  }

  try {
    const web3 = new Web3(window.ethereum);
    const contract = new web3.eth.Contract(SufleABI as any, CONTRACT_ADDRESS);

    const pathInfo = await contract.methods.getGeneratedPathInfo(pathId).call() as PathInfo;
    
    return {
      id: pathId,
      title: pathInfo.title || `Path #${pathId}`,
      description: pathInfo.description,
      creator: pathInfo.creator,
      timestamp: new Date(Number(pathInfo.timestamp) * 1000)
    };
  } catch (error) {
    console.error("Error fetching path details:", error);
    toast.error("Failed to fetch path details");
    return null;
  }
} 