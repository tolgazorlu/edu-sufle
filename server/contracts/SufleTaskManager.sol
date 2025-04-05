// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./SufleToken.sol";

/**
 * @title SufleTaskManager
 * @dev Manages roadmaps and tasks for Sufle users
 */
contract SufleTaskManager is Ownable {
    SufleToken private _token;
    
    struct Task {
        string content;
        bool completed;
        uint256 deadline;
        uint256 postId; // ID of the user's post when sharing the completion
        uint256 likes;
        bool rewarded;
    }
    
    struct Roadmap {
        string title;
        string description;
        uint256 createdAt;
        uint256 taskCount;
        bool active;
    }
    
    // Mapping from user address to their roadmap ID
    mapping(address => uint256) private _userRoadmaps;
    
    // Mapping from roadmap ID to roadmap data
    mapping(uint256 => Roadmap) private _roadmaps;
    
    // Mapping from roadmap ID to task ID to task data
    mapping(uint256 => mapping(uint256 => Task)) private _roadmapTasks;
    
    // Current roadmap ID counter
    uint256 private _roadmapIdCounter;
    
    // Events
    event RoadmapCreated(address indexed user, uint256 roadmapId, string title);
    event TaskCreated(uint256 indexed roadmapId, uint256 taskId, string content, uint256 deadline);
    event TaskCompleted(address indexed user, uint256 roadmapId, uint256 taskId);
    event PostShared(address indexed user, uint256 roadmapId, uint256 taskId, uint256 postId);
    event LikesUpdated(uint256 postId, uint256 likes);
    event RewardClaimed(address indexed user, uint256 roadmapId, uint256 taskId);
    
    constructor(address tokenAddress) Ownable(msg.sender) {
        _token = SufleToken(tokenAddress);
        _roadmapIdCounter = 1;
    }
    
    /**
     * @dev Creates a new roadmap for a user
     * @param user Address of the user
     * @param title Title of the roadmap
     * @param description Description of the roadmap
     */
    function createRoadmap(address user, string calldata title, string calldata description) external onlyOwner {
        uint256 roadmapId = _roadmapIdCounter++;
        
        _roadmaps[roadmapId] = Roadmap({
            title: title,
            description: description,
            createdAt: block.timestamp,
            taskCount: 0,
            active: true
        });
        
        _userRoadmaps[user] = roadmapId;
        
        emit RoadmapCreated(user, roadmapId, title);
    }
    
    /**
     * @dev Adds a task to a user's roadmap
     * @param roadmapId ID of the roadmap
     * @param content Task content
     * @param deadline Deadline for task completion (timestamp)
     */
    function addTask(uint256 roadmapId, string calldata content, uint256 deadline) external onlyOwner {
        require(_roadmaps[roadmapId].active, "Roadmap not active");
        
        uint256 taskId = _roadmaps[roadmapId].taskCount++;
        
        _roadmapTasks[roadmapId][taskId] = Task({
            content: content,
            completed: false,
            deadline: deadline,
            postId: 0,
            likes: 0,
            rewarded: false
        });
        
        emit TaskCreated(roadmapId, taskId, content, deadline);
    }
    
    /**
     * @dev Mark a task as completed
     * @param user User address
     * @param taskId ID of the task to mark as completed
     */
    function completeTask(address user, uint256 taskId) external {
        uint256 roadmapId = _userRoadmaps[user];
        require(roadmapId > 0, "User has no roadmap");
        require(_roadmaps[roadmapId].active, "Roadmap not active");
        require(taskId < _roadmaps[roadmapId].taskCount, "Task does not exist");
        require(!_roadmapTasks[roadmapId][taskId].completed, "Task already completed");
        
        _roadmapTasks[roadmapId][taskId].completed = true;
        
        emit TaskCompleted(user, roadmapId, taskId);
    }
    
    /**
     * @dev Update a task with post information when user shares their progress
     * @param user User address
     * @param taskId Task ID
     * @param postId ID of the post created by the user
     */
    function shareTaskPost(address user, uint256 taskId, uint256 postId) external onlyOwner {
        uint256 roadmapId = _userRoadmaps[user];
        require(roadmapId > 0, "User has no roadmap");
        require(_roadmapTasks[roadmapId][taskId].completed, "Task not completed yet");
        
        _roadmapTasks[roadmapId][taskId].postId = postId;
        
        emit PostShared(user, roadmapId, taskId, postId);
    }
    
    /**
     * @dev Update the number of likes a post has received
     * @param user User address
     * @param taskId Task ID
     * @param likes Number of likes
     */
    function updateLikes(address user, uint256 taskId, uint256 likes) external onlyOwner {
        uint256 roadmapId = _userRoadmaps[user];
        require(roadmapId > 0, "User has no roadmap");
        
        Task storage task = _roadmapTasks[roadmapId][taskId];
        require(task.postId > 0, "No post shared for this task");
        
        task.likes = likes;
        
        emit LikesUpdated(task.postId, likes);
    }
    
    /**
     * @dev Process reward for a task when required likes are reached
     * @param user User address
     * @param taskId Task ID
     */
    function processReward(address user, uint256 taskId) external onlyOwner {
        uint256 roadmapId = _userRoadmaps[user];
        require(roadmapId > 0, "User has no roadmap");
        
        Task storage task = _roadmapTasks[roadmapId][taskId];
        require(task.completed, "Task not completed");
        require(task.postId > 0, "No post shared for this task");
        require(!task.rewarded, "Task already rewarded");
        
        // Create a unique taskId for the token contract
        bytes32 uniqueTaskId = keccak256(abi.encodePacked(user, roadmapId, taskId));
        
        // Call the SufleToken contract to reward the user
        _token.rewardTaskCompletion(user, uniqueTaskId, task.likes);
        
        task.rewarded = true;
        
        emit RewardClaimed(user, roadmapId, taskId);
    }
    
    /**
     * @dev Gets a user's roadmap
     * @param user User address
     * @return roadmapId The ID of the user's roadmap
     * @return title The title of the roadmap
     * @return description The description of the roadmap
     * @return createdAt The timestamp when the roadmap was created
     * @return taskCount The number of tasks in the roadmap
     * @return active Whether the roadmap is active
     */
    function getUserRoadmap(address user) external view returns (
        uint256 roadmapId,
        string memory title,
        string memory description,
        uint256 createdAt,
        uint256 taskCount,
        bool active
    ) {
        roadmapId = _userRoadmaps[user];
        require(roadmapId > 0, "User has no roadmap");
        
        Roadmap storage roadmap = _roadmaps[roadmapId];
        return (
            roadmapId,
            roadmap.title,
            roadmap.description,
            roadmap.createdAt,
            roadmap.taskCount,
            roadmap.active
        );
    }
    
    /**
     * @dev Gets a specific task from a roadmap
     * @param roadmapId Roadmap ID
     * @param taskId Task ID
     * @return content The content/description of the task
     * @return completed Whether the task has been completed
     * @return deadline The deadline for task completion
     * @return postId The ID of the post shared by the user
     * @return likes The number of likes the post has received
     * @return rewarded Whether the task has been rewarded
     */
    function getTask(uint256 roadmapId, uint256 taskId) external view returns (
        string memory content,
        bool completed,
        uint256 deadline,
        uint256 postId,
        uint256 likes,
        bool rewarded
    ) {
        require(_roadmaps[roadmapId].active, "Roadmap not active");
        require(taskId < _roadmaps[roadmapId].taskCount, "Task does not exist");
        
        Task storage task = _roadmapTasks[roadmapId][taskId];
        return (
            task.content,
            task.completed,
            task.deadline,
            task.postId,
            task.likes,
            task.rewarded
        );
    }
    
    /**
     * @dev Updates the token contract address
     * @param newTokenAddress New address of the SufleToken contract
     */
    function setTokenAddress(address newTokenAddress) external onlyOwner {
        _token = SufleToken(newTokenAddress);
    }
} 