import * as conf from "../config";
import { task } from "hardhat/config";

task("redeemOrder", "Redeem order in trade round on ACDM platform")
    .addParam("id", "order's id")
    .addParam("amount", "amount of token")
    .setAction(async (taskArgs, { ethers }) => {
    let acmd = await ethers.getContractAt("ACDMPlatform", conf.ACMD_PLATFORM_ADDRESS);
    await acmd.redeemOrder(taskArgs.id, taskArgs.amount);
  });
