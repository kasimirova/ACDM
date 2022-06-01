import * as conf from "../config";
import { task } from "hardhat/config";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";


task("vote", "Vote for proposal")
    .addParam("id", "Proposal's id")
    .addParam("vote", "vote")
    .setAction(async (taskArgs, { ethers }) => {
    let DAO = await ethers.getContractAt("DAO", conf.DAO_ADDRESS);
    await DAO.vote(taskArgs.id, taskArgs.vote);
  });
