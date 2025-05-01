// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Sufle {

    address public owner;
    uint256 public constant PATH_GENERATION_COST = 0.01 ether; // Cost for generating a path
    
    struct Survey {
        uint256 surveyId;
        address userAddress;
        string occupation;
        string[] interestedCategories;
        string[] motivations;
        string lifeGoals;
        uint256 createdAt;
    }

    struct Path {
        uint256 pathId;
        string title;
        string description;
        mapping(uint256 => Task) tasks;
    }
    
    struct Task {
        uint256 taskId;
        string title;
        string description;
        string priority;
        string status;
        string tags;
    }

    struct GeneratedAIPath {
        uint256 pathId;
        address creator;
        string description;
        string title;
        uint256 timestamp;
        bool completed;
    }

    mapping(uint256 => Task) public tasks;
    mapping(uint256 => Path) public paths;
    mapping(uint256 => Survey) public surveys;
    mapping(address => uint256[]) public userSurveys;
    mapping(uint256 => GeneratedAIPath) public generatedAIPaths;
    mapping(address => uint256[]) public userGeneratedPaths;
    mapping(uint256 => mapping(uint256 => bool)) public completedTasks; // pathId => taskId => completed

    event TaskCreated(uint256 taskId, string title, string description, string priority, string status, string tags);
    event PathCreated(uint256 pathId, string title, string description);
    event GeneratedPath(uint256 pathId, string title, string description);
    event SurveyCreated(uint256 surveyId, address indexed userAddress);
    event SurveyUpdated(uint256 surveyId, address indexed userAddress);
    event AIPathGenerated(uint256 pathId, address indexed creator, string description);
    event TaskCompleted(uint256 pathId, uint256 taskId, address indexed user);
    event PathCompleted(uint256 pathId, address indexed user);
    event RewardSent(address indexed user, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }

    function createTask(string memory _title, string memory _description, string memory _priority, string memory _status, string memory _tags) public onlyOwner {
        uint256 taskId = uint256(keccak256(abi.encodePacked(_title, _description, block.timestamp))); 
        tasks[taskId] = Task(taskId, _title, _description, _priority, _status, _tags);
        emit TaskCreated(taskId, _title, _description, _priority, _status, _tags); 
    }
    
    function createPath(string memory _title, string memory _description, uint256[] memory _taskIds) public onlyOwner {
        uint256 pathId = uint256(keccak256(abi.encodePacked(_title, _description, block.timestamp)));
        Path storage newPath = paths[pathId];
        newPath.pathId = pathId;
        newPath.title = _title;
        newPath.description = _description;

        for (uint256 i = 0; i < _taskIds.length; i++) {
            newPath.tasks[_taskIds[i]] = tasks[_taskIds[i]];
        }

        emit PathCreated(pathId, _title, _description);
    }

    function getPathInfo(uint256 _pathId) public view returns (uint256, string memory, string memory) {
        Path storage path = paths[_pathId];
        return (path.pathId, path.title, path.description);
    }
    
    function getPathTask(uint256 _pathId, uint256 _taskId) public view returns (uint256, string memory, string memory, string memory, string memory, string memory) {
        Task storage task = paths[_pathId].tasks[_taskId];
        return (task.taskId, task.title, task.description, task.priority, task.status, task.tags);
    }

    function getTaskInfo(uint256 _taskId) public view returns (uint256, string memory, string memory, string memory, string memory, string memory) {
        Task storage task = tasks[_taskId];
        return (task.taskId, task.title, task.description, task.priority, task.status, task.tags);
    }

    function generatePathWithAI(uint256 _id) public payable {
        require(msg.value >= 0.01 ether, "You must pay at least 0.01 ether");
        require(paths[_id].pathId != 0, "Path does not exist");

        emit GeneratedPath(_id, paths[_id].title, paths[_id].description);
    }

    /**
     * @dev Generates a new learning path based on a description provided by the user.
     * @param _description The description of the learning path to be generated.
     * @return pathId The ID of the generated path.
     */
    function generatePathWithDescription(string memory _description) public payable returns (uint256) {
        require(msg.value >= PATH_GENERATION_COST, "Insufficient payment. The cost is 0.01 ETH.");
        
        // Generate a unique path ID based on sender, description, and timestamp
        uint256 pathId = uint256(keccak256(abi.encodePacked(msg.sender, _description, block.timestamp)));
        
        // Store the generation request information
        generatedAIPaths[pathId] = GeneratedAIPath({
            pathId: pathId,
            creator: msg.sender,
            description: _description,
            title: "",  // Title will be set later by backend AI system
            timestamp: block.timestamp,
            completed: false
        });
        
        // Add to user's list of generated paths
        userGeneratedPaths[msg.sender].push(pathId);
        
        // Emit event for frontend/backend to pick up
        emit AIPathGenerated(pathId, msg.sender, _description);
        
        // The actual path generation happens off-chain through AI
        return pathId;
    }
    
    /**
     * @dev Updates a generated AI path with title after AI processing.
     * @param _pathId The ID of the generated path.
     * @param _title The title generated by AI.
     */
    function updateGeneratedPathTitle(uint256 _pathId, string memory _title) public onlyOwner {
        require(generatedAIPaths[_pathId].pathId != 0, "Generated path does not exist");
        
        generatedAIPaths[_pathId].title = _title;
    }
    
    /**
     * @dev Gets information about a generated AI path.
     * @param _pathId The ID of the generated path.
     * @return pathId The ID of the path.
     * @return creator The address of the creator.
     * @return description The description of the path.
     * @return title The title of the path.
     * @return timestamp The timestamp when the path was created.
     */
    function getGeneratedPathInfo(uint256 _pathId) public view returns (
        uint256 pathId,
        address creator,
        string memory description,
        string memory title,
        uint256 timestamp,
        bool completed
    ) {
        GeneratedAIPath storage path = generatedAIPaths[_pathId];
        return (
            path.pathId,
            path.creator,
            path.description,
            path.title,
            path.timestamp,
            path.completed
        );
    }
    
    /**
     * @dev Gets all path IDs generated by a user.
     * @param _user The address of the user.
     * @return pathIds Array of path IDs.
     */
    function getUserGeneratedPaths(address _user) public view returns (uint256[] memory) {
        return userGeneratedPaths[_user];
    }
    
    /**
     * @dev Allows contract owner to withdraw funds.
     */
    function withdraw() public onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
    
    /**
     * @dev Marks a task as completed for a specific path and user
     * @param _pathId The ID of the path
     * @param _taskId The ID of the task to mark as completed
     */
    function completeTask(uint256 _pathId, uint256 _taskId) public {
        require(generatedAIPaths[_pathId].pathId != 0, "Path does not exist");
        require(generatedAIPaths[_pathId].creator == msg.sender, "Only the path creator can complete tasks");
        
        // Mark the task as completed
        completedTasks[_pathId][_taskId] = true;
        
        emit TaskCompleted(_pathId, _taskId, msg.sender);
    }
    
    /**
     * @dev Checks if a task is completed
     * @param _pathId The ID of the path
     * @param _taskId The ID of the task
     * @return completed Whether the task is completed
     */
    function isTaskCompleted(uint256 _pathId, uint256 _taskId) public view returns (bool) {
        return completedTasks[_pathId][_taskId];
    }
    
    /**
     * @dev Marks a path as completed and rewards the user
     * @param _pathId The ID of the path to mark as completed
     * @param _taskIds Array of task IDs in the path
     */
    function completePath(uint256 _pathId, uint256[] memory _taskIds) public {
        require(generatedAIPaths[_pathId].pathId != 0, "Path does not exist");
        require(generatedAIPaths[_pathId].creator == msg.sender, "Only the path creator can complete the path");
        require(!generatedAIPaths[_pathId].completed, "Path already completed");
        
        // Check if all tasks are completed
        for (uint256 i = 0; i < _taskIds.length; i++) {
            require(completedTasks[_pathId][_taskIds[i]], "Not all tasks are completed");
        }
        
        // Mark the path as completed
        generatedAIPaths[_pathId].completed = true;
        
        // Send reward to the user (0.01 EDU token)
        uint256 rewardAmount = 0.01 ether;
        require(address(this).balance >= rewardAmount, "Contract does not have enough balance for reward");
        
        payable(msg.sender).transfer(rewardAmount);
        
        emit PathCompleted(_pathId, msg.sender);
        emit RewardSent(msg.sender, rewardAmount);
    }

    function createUserSurvey(
        string memory _occupation, 
        string[] memory _interestedCategories, 
        string[] memory _motivations, 
        string memory _lifeGoals
    ) public {
        uint256 surveyId = uint256(keccak256(abi.encodePacked(msg.sender, block.timestamp)));
        Survey storage newSurvey = surveys[surveyId];
        newSurvey.surveyId = surveyId;
        newSurvey.userAddress = msg.sender;
        newSurvey.occupation = _occupation;
        newSurvey.interestedCategories = _interestedCategories;
        newSurvey.motivations = _motivations;
        newSurvey.lifeGoals = _lifeGoals;
        newSurvey.createdAt = block.timestamp;
        
        userSurveys[msg.sender].push(surveyId);
        
        emit SurveyCreated(surveyId, msg.sender);
    }
    
    function createSurveyForUser(
        address _userAddress,
        string memory _occupation, 
        string[] memory _interestedCategories, 
        string[] memory _motivations, 
        string memory _lifeGoals
    ) public onlyOwner {
        uint256 surveyId = uint256(keccak256(abi.encodePacked(_userAddress, block.timestamp)));
        Survey storage newSurvey = surveys[surveyId];
        newSurvey.surveyId = surveyId;
        newSurvey.userAddress = _userAddress;
        newSurvey.occupation = _occupation;
        newSurvey.interestedCategories = _interestedCategories;
        newSurvey.motivations = _motivations;
        newSurvey.lifeGoals = _lifeGoals;
        newSurvey.createdAt = block.timestamp;
        
        userSurveys[_userAddress].push(surveyId);
        
        emit SurveyCreated(surveyId, _userAddress);
    }
    
    function updateUserSurvey(
        uint256 _surveyId,
        string memory _occupation, 
        string[] memory _interestedCategories, 
        string[] memory _motivations, 
        string memory _lifeGoals
    ) public {
        require(surveys[_surveyId].surveyId != 0, "Survey does not exist");
        require(surveys[_surveyId].userAddress == msg.sender, "Not authorized to update this survey");
        
        Survey storage surveyToUpdate = surveys[_surveyId];
        surveyToUpdate.occupation = _occupation;
        surveyToUpdate.interestedCategories = _interestedCategories;
        surveyToUpdate.motivations = _motivations;
        surveyToUpdate.lifeGoals = _lifeGoals;
        
        emit SurveyUpdated(_surveyId, msg.sender);
    }
    
    function updateSurvey(
        uint256 _surveyId,
        string memory _occupation, 
        string[] memory _interestedCategories, 
        string[] memory _motivations, 
        string memory _lifeGoals
    ) public onlyOwner {
        require(surveys[_surveyId].surveyId != 0, "Survey does not exist");
        
        Survey storage surveyToUpdate = surveys[_surveyId];
        surveyToUpdate.occupation = _occupation;
        surveyToUpdate.interestedCategories = _interestedCategories;
        surveyToUpdate.motivations = _motivations;
        surveyToUpdate.lifeGoals = _lifeGoals;
        
        emit SurveyUpdated(_surveyId, surveyToUpdate.userAddress);
    }
    
    function getSurveyInfo(uint256 _surveyId) public view returns (
        uint256,
        address, 
        string[] memory, 
        string[] memory, 
        string memory, 
        string memory,
        uint256
    ) {
        Survey storage survey = surveys[_surveyId];
        return (
            survey.surveyId,
            survey.userAddress,
            survey.interestedCategories,
            survey.motivations,
            survey.occupation, 
            survey.lifeGoals,
            survey.createdAt
        );
    }
    
    function getUserSurveyIds(address _userAddress) public view returns (uint256[] memory) {
        return userSurveys[_userAddress];
    }
    
    function getUserSurveyCount(address _userAddress) public view returns (uint256) {
        return userSurveys[_userAddress].length;
    }
    
    function getCurrentUserSurveyCount() public view returns (uint256) {
        return userSurveys[msg.sender].length;
    }
}
