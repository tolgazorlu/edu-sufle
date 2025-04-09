import Web3 from 'web3';
import { toast } from 'sonner';
import { SUFLE_CONTRACT_ADDRESS, SUFLE_ABI } from '@/lib/contracts';

export interface ITask {
  title: string;
  description: string;
  priority: string;
  status: string;
  tags: string;
  id?: number | string;
  _pendingCompletion?: boolean;
}

export interface Path {
  title: string;
  description: string;
  tasks: ITask[];
}
export interface GeneratedPathInfo {
  pathId?: string;
  title: string;
  description: string;
  taskCount?: number;
  tasks: ITask[];
  creator?: string;
  timestamp?: string;
  completed?: boolean;
  transactionHash?: string | null;
}

const CONTRACT_ADDRESS = SUFLE_CONTRACT_ADDRESS;

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
    const contract = new web3.eth.Contract(SUFLE_ABI as any, CONTRACT_ADDRESS);

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
    const contract = new web3.eth.Contract(SUFLE_ABI as any, CONTRACT_ADDRESS);

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
    const contract = new web3.eth.Contract(SUFLE_ABI as any, CONTRACT_ADDRESS);
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

// Function to update task status to completed
export async function updateTaskStatus(
  address: string,
  taskId: number | string,
  newStatus: string,
  pathId?: number | string
): Promise<string | null> {
  if (!window.ethereum) {
    toast.error("Please install MetaMask to use this feature");
    return null;
  }

  try {
    const web3 = new Web3(window.ethereum);
    const contract = new web3.eth.Contract(SUFLE_ABI as any, CONTRACT_ADDRESS);

    let result;
    
    if (newStatus === 'completed' && pathId) {
      // Use the new completeTask function if we're marking a task as completed
      result = await contract.methods.completeTask(
        pathId,
        taskId
      ).send({ from: address });
    } else {
      // Fall back to the old method if needed
      result = await contract.methods.updateTaskStatus(
        taskId,
        newStatus
      ).send({ from: address });
    }

    return result.transactionHash;
  } catch (error) {
    console.error("Error updating task status:", error);
    toast.error("Failed to update task status");
    return null;
  }
}

export async function isTaskCompleted(
  address: string,
  pathId: number | string,
  taskId: number | string
): Promise<boolean> {
  if (!window.ethereum) {
    toast.error("Please install MetaMask to use this feature");
    return false;
  }

  try {
    const web3 = new Web3(window.ethereum);
    const contract = new web3.eth.Contract(SUFLE_ABI as any, CONTRACT_ADDRESS);

    const completed = await contract.methods.isTaskCompleted(
      pathId,
      taskId
    ).call({ from: address });

    return Boolean(completed);
  } catch (error) {
    console.error("Error checking task completion status:", error);
    return false;
  }
}

// Function to complete a path and get reward
export async function completePath(
  address: string,
  pathId: number | string,
  taskIds: (number | string)[]
): Promise<string | null> {
  if (!window.ethereum) {
    toast.error("Please install MetaMask to use this feature");
    return null;
  }

  try {
    const web3 = new Web3(window.ethereum);
    const contract = new web3.eth.Contract(SUFLE_ABI as any, CONTRACT_ADDRESS);

    const result = await contract.methods.completePath(
      pathId,
      taskIds
    ).send({ from: address });

    return result.transactionHash;
  } catch (error) {
    console.error("Error completing path:", error);
    toast.error("Failed to complete path and get reward");
    return null;
  }
}