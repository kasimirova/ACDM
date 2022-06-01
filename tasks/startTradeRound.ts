import * as conf from "../config";
import { task } from "hardhat/config";

task("startTradeRound", "Start trade round on ACDM platform")
    .setAction(async (_, { ethers }) => {
    let acmd = await ethers.getContractAt("ACDMPlatform", conf.ACMD_PLATFORM_ADDRESS);
    await acmd.startTradeRound();
    
  });
