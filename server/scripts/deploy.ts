const hre = require("hardhat");

async function main() {
 const Sufle = await hre.ethers.getContractFactory("Sufle");
 const contract = await Sufle.deploy();
 await contract.waitForDeployment(); 
 console.log(`Sufle contract deployed to: ${contract.target}`);
}

main().catch((error) => {
 console.error(error);
 process.exitCode = 1;
});
