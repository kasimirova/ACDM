import { ethers } from "hardhat";

async function main() {
  const ERC20 = await ethers.getContractFactory("ERC20");
  const ERC_20 = await ERC20.deploy("ACADEMCoin", "ACDM", 6, ethers.utils.parseEther("10000"));

  await ERC_20.deployed();

  console.log("ERC20 deployed to:", ERC_20.address);
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
