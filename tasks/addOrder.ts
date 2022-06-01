import * as conf from "../config";
import { task } from "hardhat/config";

task("addOrder", "Add order in trade round on ACDM platform")
    .addParam("amount", "amount of token")
    .addParam("price", "price for one token")
    .setAction(async (taskArgs, { ethers }) => {
    let acmd = await ethers.getContractAt("ACDMPlatform", conf.ACMD_PLATFORM_ADDRESS);
    await acmd.addOrder(taskArgs.amount, taskArgs.price);
  });
