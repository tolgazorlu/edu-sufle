import { expect } from "chai";
import { ethers } from "hardhat";
import { SufleToken, SufleTaskManager } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("Sufle Platform", function () {
  let sufleToken: SufleToken;
  let taskManager: SufleTaskManager;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  beforeEach(async function () {
    // Get signers
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy SufleToken
    const SufleTokenFactory = await ethers.getContractFactory("SufleToken");
    sufleToken = await SufleTokenFactory.deploy();
    await sufleToken.deployed();

    // Deploy SufleTaskManager with token address
    const TaskManagerFactory = await ethers.getContractFactory("SufleTaskManager");
    taskManager = await TaskManagerFactory.deploy(sufleToken.address);
    await taskManager.deployed();

    // Transfer some tokens to users for testing
    await sufleToken.transfer(user1.address, ethers.utils.parseEther("100"));
    await sufleToken.transfer(user2.address, ethers.utils.parseEther("100"));
  });

  describe("SufleToken", function () {
    it("Should initialize with correct name and symbol", async function () {
      expect(await sufleToken.name()).to.equal("EduToken");
      expect(await sufleToken.symbol()).to.equal("EDUT");
    });

    it("Should allow users to ask questions by spending tokens", async function () {
      const initialBalance = await sufleToken.balanceOf(user1.address);
      const questionCost = await sufleToken.questionCost();

      // User asks a question
      await sufleToken.connect(user1).askQuestion();

      // Check that tokens were burned
      const finalBalance = await sufleToken.balanceOf(user1.address);
      expect(finalBalance).to.equal(initialBalance.sub(questionCost));
    });

    it("Should not allow asking questions with insufficient balance", async function () {
      // Create a user with no tokens
      const poorUser = (await ethers.getSigners())[5];
      
      // Try to ask a question
      await expect(sufleToken.connect(poorUser).askQuestion())
        .to.be.revertedWith("Insufficient tokens to ask a question");
    });

    it("Should allow owner to change question cost", async function () {
      const newCost = ethers.utils.parseEther("2");
      await sufleToken.setQuestionCost(newCost);
      expect(await sufleToken.questionCost()).to.equal(newCost);
    });

    it("Should reward users for completing tasks with enough likes", async function () {
      const taskId = ethers.utils.formatBytes32String("task1");
      const likes = 5; // Minimum required likes
      
      const initialBalance = await sufleToken.balanceOf(user1.address);
      
      // Reward the user for task completion
      await sufleToken.connect(owner).rewardTaskCompletion(user1.address, taskId, likes);
      
      // Check that the user received tokens
      const finalBalance = await sufleToken.balanceOf(user1.address);
      const questionCost = await sufleToken.questionCost();
      expect(finalBalance).to.equal(initialBalance.add(questionCost));
    });
  });

  describe("SufleTaskManager", function () {
    beforeEach(async function () {
      // Create a roadmap for user1
      await taskManager.createRoadmap(
        user1.address,
        "Web Development Roadmap",
        "Learn web development from scratch to professional level"
      );
    });

    it("Should create a roadmap correctly", async function () {
      const roadmap = await taskManager.getUserRoadmap(user1.address);
      
      expect(roadmap.title).to.equal("Web Development Roadmap");
      expect(roadmap.description).to.equal("Learn web development from scratch to professional level");
      expect(roadmap.active).to.be.true;
      expect(roadmap.taskCount).to.equal(0);
    });

    it("Should add tasks to a roadmap", async function () {
      // Add a task to the roadmap
      const oneWeekLater = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
      await taskManager.addTask(
        1, // roadmapId
        "Learn HTML basics",
        oneWeekLater
      );
      
      // Check that the task was added correctly
      const task = await taskManager.getTask(1, 0);
      
      expect(task.content).to.equal("Learn HTML basics");
      expect(task.completed).to.be.false;
      expect(task.deadline).to.equal(oneWeekLater);
    });

    it("Should mark tasks as completed", async function () {
      // Add a task
      const oneWeekLater = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
      await taskManager.addTask(1, "Learn CSS basics", oneWeekLater);
      
      // Complete the task
      await taskManager.connect(user1).completeTask(user1.address, 0);
      
      // Check that the task is marked as completed
      const task = await taskManager.getTask(1, 0);
      expect(task.completed).to.be.true;
    });

    it("Should process task rewards when enough likes are received", async function () {
      // Add a task
      const oneWeekLater = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
      await taskManager.addTask(1, "Learn JavaScript basics", oneWeekLater);
      
      // Complete the task
      await taskManager.connect(user1).completeTask(user1.address, 0);
      
      // Share a post about the task completion
      await taskManager.shareTaskPost(user1.address, 0, 123); // postId = 123
      
      // Update likes to 5 (minimum required)
      await taskManager.updateLikes(user1.address, 0, 5);
      
      // Get initial token balance
      const initialBalance = await sufleToken.balanceOf(user1.address);
      
      // Process the reward
      await taskManager.processReward(user1.address, 0);
      
      // Check that the user received tokens
      const finalBalance = await sufleToken.balanceOf(user1.address);
      const questionCost = await sufleToken.questionCost();
      expect(finalBalance).to.equal(initialBalance.add(questionCost));
      
      // Check that the task is marked as rewarded
      const task = await taskManager.getTask(1, 0);
      expect(task.rewarded).to.be.true;
    });

    it("Should not reward the same task twice", async function () {
      // Add a task
      const oneWeekLater = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
      await taskManager.addTask(1, "Learn React basics", oneWeekLater);
      
      // Complete the task
      await taskManager.connect(user1).completeTask(user1.address, 0);
      
      // Share a post about the task completion
      await taskManager.shareTaskPost(user1.address, 0, 456); // postId = 456
      
      // Update likes to 5 (minimum required)
      await taskManager.updateLikes(user1.address, 0, 5);
      
      // Process the reward
      await taskManager.processReward(user1.address, 0);
      
      // Try to process the reward again
      await expect(taskManager.processReward(user1.address, 0))
        .to.be.revertedWith("Task already rewarded");
    });
  });
}); 