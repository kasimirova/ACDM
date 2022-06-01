import * as conf from "../config";
import { task } from "hardhat/config";

task("buyACDM", "Buy ACDM tokens on ACDM platform")
    .addParam("amount", "amount of tokens to buy")
    .setAction(async (taskArgs, { ethers }) => {
    let acmd = await ethers.getContractAt("ACDMPlatform", conf.ACMD_PLATFORM_ADDRESS);
    await acmd.buyACDM(taskArgs.amount);
    
  });
