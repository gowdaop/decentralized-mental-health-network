// scripts/deploy.js
const hre = require("hardhat");

async function main() {
  // Deploy UserRegistry
  const UserRegistry = await hre.ethers.getContractFactory("UserRegistry");
  const userRegistry = await UserRegistry.deploy();
  // The .deployed() function is deprecated. Use .waitForDeployment() instead.
  await userRegistry.waitForDeployment();
  // In ethers v6, the address is accessed via .target
  console.log("UserRegistry deployed to:", userRegistry.target);

  // Deploy TokenSystem
  const TokenSystem = await hre.ethers.getContractFactory("TokenSystem");
  const tokenSystem = await TokenSystem.deploy();
  // The .deployed() function is deprecated. Use .waitForDeployment() instead.
  await tokenSystem.waitForDeployment();
  // In ethers v6, the address is accessed via .target
  console.log("TokenSystem deployed to:", tokenSystem.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
