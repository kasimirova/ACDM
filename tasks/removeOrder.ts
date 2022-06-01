import * as conf from "../config";
import { task } from "hardhat/config";

task("removeOrder", "Remove order on ACDM platform")
    .addParam("id", "order's Id")
    .setAction(async (taskArgs, { ethers }) => {
    let acmd = await ethers.getContractAt("ACDMPlatform", conf.ACMD_PLATFORM_ADDRESS);
    await acmd.removeOrder(taskArgs.id);
  });
