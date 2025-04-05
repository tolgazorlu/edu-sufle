// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Sufle {

    address public owner;

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

    mapping(uint256 => Task) public tasks;
    mapping(uint256 => Path) public paths;

    event TaskCreated(uint256 taskId, string title, string description, string priority, string status, string tags);
    event PathCreated(uint256 pathId, string title, string description);
    event GeneratedPath(uint256 pathId, string title, string description);

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
}
