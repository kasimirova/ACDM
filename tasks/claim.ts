import * as conf from "../config";
import { task } from "hardhat/config";

task("claim", "Claim reward")
    .setAction(async (_, { ethers }) => {
    let Staking = await ethers.getContractAt("Staking", conf.STAKING_ADDRESS);
    await Staking.claim();
  });