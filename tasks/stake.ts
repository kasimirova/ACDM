import * as conf from "../config";
import { task } from "hardhat/config";
task("stake", "Stake tokens")
    .addParam("amount", "Amount of tokens to stake")
    .setAction(async (taskArgs, { ethers }) => {
    let Staking = await ethers.getContractAt("Staking", conf.STAKING_ADDRESS);
    await Staking.stake(taskArgs.amount);
  });