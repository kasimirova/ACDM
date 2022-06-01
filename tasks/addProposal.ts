import * as conf from "../config";
import { task } from "hardhat/config";

task("addproposal", "Add proposal")
    .addParam("signature", "signature")
    .addParam("recipient", "recipient")
    .setAction(async (taskArgs, { ethers }) => {
    let DAO = await ethers.getContractAt("DAO", conf.DAO_ADDRESS);
    

    await DAO.addProposal(taskArgs.signature, taskArgs.recipient, "Change reward percent");
  });
