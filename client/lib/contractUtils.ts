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
export interface GeneratedPathInfo {
  pathId: string;
  creator: string;
  description: string;
  title: string;
  timestamp: string;
  completed: boolean;
}

// Interface for a path with all details
export interface PathWithTasks {
  id: string;
  title: string;
  description: string;
  creator: string;
  timestamp: number;
  tasks: Task[];
  completed: boolean;
  transactionHash?: string;
}

// Replace with your contract address
const CONTRACT_ADDRESS = "0x53D34f50678ff5c47BB649F73E4cb338eFed83d7";

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

export async function getUserPaths(address: string): Promise<PathWithTasks[]> {
  if (!window.ethereum) {
    toast.error("Please install MetaMask to use this feature");
    return [];
  }

  try {
    const web3 = new Web3(window.ethereum);
    const contract = new web3.eth.Contract(SufleABI as any, CONTRACT_ADDRESS);

    // Get path IDs for the user
    const pathIds = await contract.methods.getUserGeneratedPaths(address).call() as string[];
    
    if (!pathIds || pathIds.length === 0) {
      return [];
    }

    // Get details for each path
    const paths: PathWithTasks[] = [];
    for (const pathId of pathIds) {
      try {
        // Get path info from contract
        const pathInfoResult = await contract.methods.getGeneratedPathInfo(pathId).call();
        
        // Web3 returns an object with both numeric indices and named properties
        // We'll extract the values safely
        let pathData: any;
        
        // Check if the result is an array-like object or a structured object
        if (Array.isArray(pathInfoResult)) {
          // It's an array-like result
          pathData = {
            pathId: pathInfoResult[0],
            creator: pathInfoResult[1],
            description: pathInfoResult[2],
            title: pathInfoResult[3],
            timestamp: pathInfoResult[4]
          };
        } else {
          // It's a structured object
          pathData = pathInfoResult;
        }
        
        // Fetch tasks for this path
        const tasks = await fetchTasksForGeneratedPath(pathId, web3, contract);
        
        paths.push({
          id: pathId,
          title: pathData.title || `Path #${pathId}`,
          description: pathData.description || '',
          creator: pathData.creator || '',
          timestamp: Number(pathData.timestamp || 0) * 1000,
          completed: pathData.completed || false,
          tasks: tasks
        });
      } catch (pathError) {
        console.error(`Error fetching path ${pathId}:`, pathError);
        // Continue with the next path
      }
    }

    return paths;
  } catch (error) {
    console.error("Error fetching user paths:", error);
    toast.error("Failed to fetch your paths");
    return [];
  }
}

export async function getPathDetails(pathId: number): Promise<PathWithTasks | null> {
  if (!window.ethereum) {
    toast.error("Please install MetaMask to use this feature");
    return null;
  }

  try {
    const web3 = new Web3(window.ethereum);
    const contract = new web3.eth.Contract(SufleABI as any, CONTRACT_ADDRESS);

    // Get path info from contract
    const pathInfoResult = await contract.methods.getGeneratedPathInfo(pathId).call();
    
    // Web3 returns an object with both numeric indices and named properties
    // We'll extract the values safely
    let pathData: any;
    
    // Check if the result is an array-like object or a structured object
    if (Array.isArray(pathInfoResult)) {
      // It's an array-like result
      pathData = {
        pathId: pathInfoResult[0],
        creator: pathInfoResult[1],
        description: pathInfoResult[2],
        title: pathInfoResult[3],
        timestamp: pathInfoResult[4]
      };
    } else {
      // It's a structured object
      pathData = pathInfoResult;
    }
    
    // Fetch tasks for this path
    const tasks = await fetchTasksForGeneratedPath(pathId, web3, contract);
    
    return {
      id: pathId.toString(),
      title: pathData.title || `Path #${pathId}`,
      description: pathData.description || '',
      creator: pathData.creator || '',
      timestamp: Number(pathData.timestamp || 0) * 1000,
      completed: pathData.completed || false,
      tasks: tasks
    };
  } catch (error) {
    console.error("Error fetching path details:", error);
    toast.error("Failed to fetch path details");
    return null;
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
    const contract = new web3.eth.Contract(SufleABI as any, CONTRACT_ADDRESS);

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

// Helper function to fetch tasks for a generated path
async function fetchTasksForGeneratedPath(pathId: number | string, web3: any, contract: any): Promise<Task[]> {
  try {
    // Since the Sufle.sol contract doesn't have a direct way to get tasks for a generated path,
    // we'll create deterministic mock tasks based on the pathId.
    // In a real implementation, you would need to modify the contract to store and retrieve tasks for generated paths.
    
    // Generate a deterministic set of tasks based on the pathId
    const pathIdStr = pathId.toString();
    const numTasks = Math.max(1, (parseInt(pathIdStr.substring(pathIdStr.length - 2), 16) % 5) + 1); // 1-5 tasks
    
    const tasks: Task[] = [];
    const priorities = ['high', 'medium', 'low'];
    const statuses = ['pending', 'in-progress', 'completed'];
    
    for (let i = 0; i < numTasks; i++) {
      const taskNumber = i + 1;
      // Use consistent hash-based indices to ensure the same pathId always gets the same tasks
      const hash = parseInt(pathIdStr.substring(0, 4), 16);
      const priorityIndex = (hash + i) % 3;
      const statusIndex = (hash + i * 2) % 3;
      
      tasks.push({
        title: `Task ${taskNumber}: Learn key concept ${taskNumber}`,
        description: `This task involves learning and practicing the fundamental concepts related to topic ${taskNumber}.`,
        priority: priorities[priorityIndex],
        status: statuses[statusIndex],
        tags: `concept${taskNumber},learning,practice`
      });
    }
    
    return tasks;
  } catch (error) {
    console.error("Error fetching tasks for path:", error);
    return [];
  }
}

// Function to check if a task is completed
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
    const contract = new web3.eth.Contract(SufleABI as any, CONTRACT_ADDRESS);

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
    const contract = new web3.eth.Contract(SufleABI as any, CONTRACT_ADDRESS);

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