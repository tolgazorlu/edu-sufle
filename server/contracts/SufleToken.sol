// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SufleToken
 * @dev Implementation of the EduToken for the Sufle platform
 * Users spend tokens to ask questions to Sufle AI
 * Users earn tokens by completing tasks and getting likes on their posts
 */
contract SufleToken is ERC20, ERC20Burnable, Ownable {
    // Mapping to track if a task has been rewarded
    mapping(bytes32 => bool) private _rewardedTasks;
    
    // Cost in tokens to ask a question to the AI
    uint256 public questionCost = 1 * 10**18; // 1 token with 18 decimals
    
    // Minimum number of likes needed for a post to earn rewards
    uint256 public requiredLikes = 5;
    
    // Event emitted when a user spends tokens on a question
    event QuestionAsked(address indexed user, uint256 cost);
    
    // Event emitted when a user is rewarded for task completion
    event TaskRewarded(address indexed user, bytes32 taskId, uint256 amount);

    constructor() ERC20("EduToken", "EDUT") Ownable(msg.sender) {
        // Initial supply minted to the contract creator
        _mint(msg.sender, 1000000 * 10**18); // 1,000,000 tokens
    }
    
    /**
     * @dev Called when a user wants to ask a question to Sufle AI
     * Burns the required tokens from the user's balance
     */
    function askQuestion() external returns (bool) {
        require(balanceOf(msg.sender) >= questionCost, "Insufficient tokens to ask a question");
        
        // Burn tokens from the user's balance
        _burn(msg.sender, questionCost);
        
        emit QuestionAsked(msg.sender, questionCost);
        return true;
    }
    
    /**
     * @dev Rewards a user for completing a task and getting sufficient likes
     * @param user Address of the user to reward
     * @param taskId Unique identifier for the task
     * @param postLikes Number of likes received on the post
     */
    function rewardTaskCompletion(address user, bytes32 taskId, uint256 postLikes) external onlyOwner {
        require(!_rewardedTasks[taskId], "Task already rewarded");
        require(postLikes >= requiredLikes, "Not enough likes to receive reward");
        
        _rewardedTasks[taskId] = true;
        
        // Mint new tokens to the user
        _mint(user, questionCost); // Reward same amount as question cost
        
        emit TaskRewarded(user, taskId, questionCost);
    }
    
    /**
     * @dev Updates the cost of asking a question
     * @param newCost New cost in tokens
     */
    function setQuestionCost(uint256 newCost) external onlyOwner {
        questionCost = newCost;
    }
    
    /**
     * @dev Updates the required number of likes for rewards
     * @param newRequiredLikes New like threshold
     */
    function setRequiredLikes(uint256 newRequiredLikes) external onlyOwner {
        requiredLikes = newRequiredLikes;
    }
} 