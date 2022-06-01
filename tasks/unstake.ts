import * as conf from "../config";
import { task } from "hardhat/config";
task("unstake", "Unstake tokens")
    .setAction(async (_, { ethers }) => {
    let Staking = await ethers.getContractAt("Staking", conf.STAKING_ADDRESS);
    await Staking.unstake();
  });