import { ethers } from "hardhat";
import * as conf from "../config";

async function main() {
  const Staking = await ethers.getContractFactory("Staking");
  const staking = await Staking.deploy(conf.LP_ADDRESS, conf.XXX_ADDRESS, 864000, 604800, 3);// 10 days lock, 7 days reward, 3%
  await staking.deployed();
  console.log("Staking deployed to:", staking.address);
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
