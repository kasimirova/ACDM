import * as conf from "../config";
import { task } from "hardhat/config";

task("register", "Register on ACDM platform")
    .addParam("address", "referrer's address")
    .setAction(async (taskArgs, { ethers }) => {
    let acmd = await ethers.getContractAt("ACDMPlatform", conf.ACMD_PLATFORM_ADDRESS);
    await acmd.register(taskArgs.address);
    
  });
