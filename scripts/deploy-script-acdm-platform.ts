import { ethers } from "hardhat";
import * as conf from "../config";


async function main() {
  const ACDM = await ethers.getContractFactory("ACDMPlatform");
  const acdm = await ACDM.deploy(conf.ACDM_TOKEN_ADDRESS, conf.XXX_ADDRESS, 259200, 50, 30, 25, 25, 1000);

  await acdm.deployed();

  console.log("ACDM Platform deployed to:", acdm.address);
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });