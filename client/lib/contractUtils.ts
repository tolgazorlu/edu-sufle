import Web3 from 'web3';
import { toast } from 'sonner';

// Contract ABI - Just the functions we need
const SufleABI = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_title",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_description",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_priority",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_status",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_tags",
        "type": "string"
      }
    ],
    "name": "createTask",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_title",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_description",
        "type": "string"
      },
      {
        "internalType": "uint256[]",
        "name": "_taskIds",
        "type": "uint256[]"
      }
    ],
    "name": "createPath",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_id",
        "type": "uint256"
      }
    ],
    "name": "generatePathWithAI",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
];

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

// Replace with your contract address
const CONTRACT_ADDRESS = "0xYourContractAddressHere";

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