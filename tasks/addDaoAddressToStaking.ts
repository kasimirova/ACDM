import * as conf from "../config";
import { task } from "hardhat/config";

task("addDao", "Add dao address to staking")
    .setAction(async (_, { ethers }) => {
    let staking = await ethers.getContractAt("Staking", conf.STAKING_ADDRESS);
    await staking.addDaoAddress(conf.DAO_ADDRESS);
  });
