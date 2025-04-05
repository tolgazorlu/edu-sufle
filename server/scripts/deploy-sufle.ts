import { ethers } from "hardhat";

async function main() {
  console.log("Deploying Sufle platform contracts...");

  // Deploy the SufleToken contract
  const SufleToken = await ethers.getContractFactory("SufleToken");
  const token = await SufleToken.deploy();
  await token.waitForDeployment();
  console.log(`SufleToken deployed to: ${await token.getAddress()}`);

  // Deploy the SufleTaskManager contract with the token address
  const SufleTaskManager = await ethers.getContractFactory("SufleTaskManager");
  const taskManager = await SufleTaskManager.deploy(await token.getAddress());
  await taskManager.waitForDeployment();
  console.log(`SufleTaskManager deployed to: ${await taskManager.getAddress()}`);

  console.log("Deployment complete!");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 