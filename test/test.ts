const { expect } = require("chai");
const { ethers, waffle, hre} = require("hardhat");

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { Contract } from "ethers";
let DAO : Contract, dao : Contract, staking : Contract, Staking : Contract, XXX : Contract, xxx : Contract, LP : Contract, lp : Contract, ACDMToken : Contract, acdmtoken : Contract, ACDM : Contract, acdm : Contract;
let owner:SignerWithAddress, addr1:SignerWithAddress, addr2:SignerWithAddress, addr3:SignerWithAddress, addr4:SignerWithAddress, addr5:SignerWithAddress, addr6:SignerWithAddress, provider:any;
let calldataComissionToOwner:any, calldataChangeLockDays:any, calldataChangePercents:any, calldataBuyXXX:any, Uniswap : Contract;


describe("Integration tests", function () {
  before(async function () 
  {
    [owner, addr1, addr2, addr3, addr4, addr5, addr6] = await ethers.getSigners();

    xxx = await ethers.getContractAt("ERC20", "0xBE550bf18b9E012F1425D3507f13D560ecEB7E09");

    LP = await ethers.getContractFactory("ERC20");
    lp = await LP.deploy("LPCoin", "LP", 18, ethers.utils.parseEther("10000"));
    await lp.deployed();

    await lp.transfer(addr1.address, ethers.utils.parseEther("500"));
    await lp.transfer(addr2.address, ethers.utils.parseEther("500"));
    await lp.transfer(addr3.address, ethers.utils.parseEther("500"));
    await lp.transfer(addr4.address, ethers.utils.parseEther("500"));

    Staking = await ethers.getContractFactory("Staking");
    staking = await Staking.deploy(lp.address, xxx.address, 1800, 600, 20); //lock, reward, %
    await staking.deployed();

    DAO = await ethers.getContractFactory("DAO");
    dao = await DAO.deploy(owner.address, staking.address, 5, 86400);//minQ, duration
    await dao.deployed();

    await staking.addDaoAddress(dao.address);

    ACDMToken = await ethers.getContractFactory("ERC20");
    acdmtoken = await ACDMToken.deploy("Token2", "Tkn1", 6, ethers.utils.parseEther("1000000"));
    await acdmtoken.deployed();

    ACDM = await ethers.getContractFactory("ACDMPlatform");
    acdm = await ACDM.deploy(acdmtoken.address, xxx.address, 259200, 50, 30, 25, 25, 1000);
    await acdm.deployed();

    let MINTER_ROLE = await acdmtoken.MINTER_ROLE();
    let BURNER_ROLE = await acdmtoken.BURNER_ROLE();

    await acdmtoken.grantRole(MINTER_ROLE, acdm.address);
    await acdmtoken.grantRole(BURNER_ROLE, acdm.address);

    let BURNER_ROLEXXX = await xxx.BURNER_ROLE();
    await xxx.grantRole(BURNER_ROLEXXX, acdm.address);

    const ABIComissionToOwner = ["function sendComissionToOwner()"];
    const ifaceComissionToOwner = new ethers.utils.Interface(ABIComissionToOwner);
    calldataComissionToOwner = ifaceComissionToOwner.encodeFunctionData("sendComissionToOwner");

    const ABIChangeLockDays = ["function setFreezingTimeForLP(uint256)"];
    const ifaceChangeLockDays = new ethers.utils.Interface(ABIChangeLockDays);
    calldataChangeLockDays = ifaceChangeLockDays.encodeFunctionData("setFreezingTimeForLP", [1200]);

    const ABIChangePercents = ["function setReferrersPercents(uint256 sale1Percent, uint256 sale2Percent, uint256 trade1Percent, uint256 trade2Percent, uint256 precision)"];
    const ifaceChangePercents = new ethers.utils.Interface(ABIChangePercents);
    calldataChangePercents = ifaceChangePercents.encodeFunctionData("setReferrersPercents", [550, 330, 150, 150, 10000]);

    const ABIBuyXXX = ["function buyXXXandBurn()"];
    const ifaceBuyXXX = new ethers.utils.Interface(ABIBuyXXX);
    calldataBuyXXX = ifaceBuyXXX.encodeFunctionData("buyXXXandBurn");

    let DAO_ROLE = await staking.DAO_ROLE();
    await staking.grantRole(DAO_ROLE, dao.address);

    let DAO_ROLE1 = await staking.DAO_ROLE();
    await acdm.grantRole(DAO_ROLE1, dao.address);

    provider = waffle.provider;
  });

  it("Shouldn't add proposal as not a chair person", async function () {
    await expect(dao.connect(addr1).addProposal(calldataComissionToOwner, acdm.address, "Send comission to owner" )).to.be.revertedWith("Only chair person can add proposal");
  }
  );

  it("Should add proposal", async function () {
    await dao.addProposal(calldataChangeLockDays, staking.address, "Change freezing time for LP" );
  }
  );

  it("Stake", async function () {
    await lp.connect(addr1).approve(staking.address, ethers.utils.parseEther("100"));
    await staking.connect(addr1).stake(ethers.utils.parseEther("100"));
    expect(await lp.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("400"));
    expect(await lp.balanceOf(staking.address)).to.equal(ethers.utils.parseEther("100"));
    expect(await dao.getUsersDeposit(addr1.address)).to.equal(ethers.utils.parseEther("100"));


    await lp.connect(addr2).approve(staking.address, ethers.utils.parseEther("200"));
    await staking.connect(addr2).stake(ethers.utils.parseEther("200"));

    await lp.connect(addr3).approve(staking.address, ethers.utils.parseEther("300"));
    await staking.connect(addr3).stake(ethers.utils.parseEther("300"));

    await provider.send("evm_increaseTime", [1210]);
    await provider.send("evm_mine");  
  }
  );

  it("Shouldn't vote with zero staking balance", async function () {
    await expect(dao.connect(addr4).vote(0, false)).to.be.revertedWith("There isn't any tokens on sender's staking balance");
  }
  );

  it("Shouldn't vote for non existing proposal", async function () {
    await expect(dao.connect(addr1).vote(1, false)).to.be.revertedWith("Proposal with that id doesn't exist");
  }
  );

  it("Shouldn't unstake if freezing time is not over", async function () {
    await expect(staking.connect(addr1).unstake()).to.be.revertedWith("It's too soon to unstake");
  }
  );

  it("Should vote for an existing proposal", async function () {
    await expect(dao.connect(addr1).vote(0, false)).to.emit(dao, "UserVoted").withArgs(addr1.address, 0, false);
    await dao.connect(addr2).vote(0, true);
    await dao.connect(addr3).vote(0, true);
    expect(await lp.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("400"));
    expect(await dao.checkIfUserVoted(addr1.address, 0)).to.equal(true);
  }
  );

  it("Shouldn't unstake if user participates in proposal that's not finished", async function () {
    await provider.send("evm_increaseTime", [600]);
    await provider.send("evm_mine"); 
    await expect(staking.connect(addr1).unstake()).to.be.revertedWith("You can't unstake now, not all proposals that you participate in are finished");
  }
  );

  it("Shouldn't vote for the second time", async function () {
    await expect(dao.connect(addr1).vote(0, false)).to.be.revertedWith("Sender has already voted");
  }
  );

  it("Shouldn't finish non existing proposal", async function () {
    await expect(dao.connect(addr1).finishProposal(1)).to.be.revertedWith("Proposal with that id doesn't exist");
  }
  );

  it("Shouldn't finish proposal earlier", async function () {
    await expect(dao.connect(addr1).finishProposal(0)).to.be.revertedWith("It's too soon to finish this proposal");
    await provider.send("evm_increaseTime", [10000]);
    await provider.send("evm_mine");
  }
  );

  it("Should add proposal", async function () {
    await dao.addProposal(calldataChangePercents, dao.address, "Change percents for referrers" );
  }
  );

  it("Should finish proposal in time", async function () {
    await provider.send("evm_increaseTime", [74600]);
    await provider.send("evm_mine");
    expect(await staking.freezingTimeForLP()).to.equal(1800);
    await expect(dao.connect(addr1).finishProposal(0)).to.emit(dao, "ProposalFinishedSuccessfully").withArgs(0);
    expect(await staking.freezingTimeForLP()).to.equal(1200);
  }
  );

  it("Should unstake when proposal is finished", async function () {
    await staking.connect(addr1).unstake();
    expect(await lp.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("500"));

    await lp.connect(addr1).approve(staking.address, ethers.utils.parseEther("100"));
    await staking.connect(addr1).stake(ethers.utils.parseEther("100"));
  }
  );


  it("Should add proposal with wrong signature", async function () {
    const ABIChangeLockDays = ["function setFreezingTimeForLP(uint256)"];
    const ifaceChangeLockDays = new ethers.utils.Interface(ABIChangeLockDays);
    calldataChangeLockDays = ifaceChangeLockDays.encodeFunctionData("setFreezingTimeForLP", [900]);
    await dao.addProposal(calldataChangeLockDays, dao.address, "Change lock days" );
    await dao.connect(addr1).vote(2, true);
    await dao.connect(addr2).vote(2, false);
    await dao.connect(addr3).vote(2, true);
    expect(await dao.checkIfUserVoted(addr3.address, 2)).to.equal(true);
  }
  );

  it("Should vote for an existing proposal", async function () {
    await expect(dao.connect(addr1).vote(1, true)).to.emit(dao, "UserVoted").withArgs(addr1.address, 1, true);
    await dao.connect(addr2).vote(1, true);    
  }
  );

  it("Should finish proposal with wrong signature as failed", async function () {
    await provider.send("evm_increaseTime", [86400]);
    await provider.send("evm_mine");
    await expect(dao.connect(addr1).finishProposal(2)).to.emit(dao, "ProposalFailed").withArgs(2, "Error in call func");
    expect(await staking.getFreezingTimeForLP()).to.equal(1200);

  }
  );

  it("Should't vote after time is over", async function () {
    await expect(dao.connect(addr3).vote(1, false)).to.be.revertedWith("Voting time is over");
    expect(await dao.checkIfUserVoted(addr3.address, 1)).to.equal(false);
  }
  );

  it("Should finish proposal as failed if there's not enough votes", async function () {
    await expect(dao.connect(addr1).finishProposal(1)).to.emit(dao, "ProposalFailed").withArgs(1, "Not enough votes");
  }
  );

  it("Should add proposal", async function () {
    await dao.addProposal(calldataChangePercents, acdm.address, "Change percents for referrers" );
    await dao.connect(addr1).vote(3, false);
    await dao.connect(addr2).vote(3, true);
    await dao.connect(addr3).vote(3, false);
    expect(await dao.checkIfUserVoted(addr3.address, 3)).to.equal(true);
  }
  );

  it("Should finish proposal as failed", async function () {
    await provider.send("evm_increaseTime", [86400]);
    await provider.send("evm_mine");
    await expect(dao.connect(addr2).finishProposal(3)).to.emit(dao, "ProposalFailed").withArgs(3, "The majority of participants vote against");
    expect(await acdm.getFirstSaleReferrerPercents()).to.equal(50);
  }
  );

  it(" Should start sale round and buy acdm with enough ether", async function () {
    await expect (acdm.connect(addr1).startSaleRound()).to.emit(acdm, "saleRoundStarted").withArgs(100000, ethers.utils.parseEther("0.00001"));
    expect(await acdmtoken.balanceOf(acdm.address)).to.equal(100000);

    await expect (acdm.connect(addr1).buyACDM(100000, {value: ethers.utils.parseEther("1")})).to.emit(acdm, "userBoughtTokens").withArgs(addr1.address, 100000);
    expect(await acdmtoken.balanceOf(addr1.address)).to.equal(100000);
    await expect (acdm.connect(addr2).buyACDM(25000, {value: ethers.utils.parseEther("0.25")})).to.be.revertedWith("There's no token left, you can start trade round");
    await expect (acdm.connect(addr2).startTradeRound()).to.emit(acdm, "tradeRoundStarted");
  }
  );

  it("Should add and redeem order", async function () {
    await acdmtoken.connect(addr1).approve(acdm.address, 100000);
    await expect (acdm.connect(addr1).addOrder(100000, ethers.utils.parseEther("0.000011"))).to.emit(acdm, "userAddNewOrder").withArgs(addr1.address, 0, 100000, ethers.utils.parseEther("0.000011"));
    expect(await acdmtoken.balanceOf(acdm.address)).to.equal(100000);

    await expect (acdm.connect(addr2).redeemOrder(0, 500, {value: ethers.utils.parseEther("0.0055")})).to.emit(acdm, "userReedemOrder").withArgs(addr2.address, 0, 500);
    expect(await acdmtoken.balanceOf(addr2.address)).to.equal(500);
    expect(await acdm.comissionAccount()).to.equal(ethers.utils.parseEther("0.000275"));
  }
  );

  it("Should add proposal and finish proposal successfully (buy XXX and burn)", async function () {
    await dao.addProposal(calldataBuyXXX, acdm.address, "Buy XXX and burn");
    await dao.connect(addr1).vote(4, false);
    await dao.connect(addr2).vote(4, true);
    await dao.connect(addr3).vote(4, true);
    await provider.send("evm_increaseTime", [86400]);
    await provider.send("evm_mine");
    await expect(dao.connect(addr1).finishProposal(4)).to.emit(dao, "ProposalFinishedSuccessfully").withArgs(4);
  }

  );

  it("Should redeem order", async function () {
    await expect (acdm.connect(addr2).redeemOrder(0, 500, {value: ethers.utils.parseEther("0.0055")})).to.emit(acdm, "userReedemOrder").withArgs(addr2.address, 0, 500);
    expect(await acdmtoken.balanceOf(addr2.address)).to.equal(1000);
    expect(await acdm.comissionAccount()).to.equal(ethers.utils.parseEther("0.000275"));
  }
  );

  it("Should add proposal and finish proposal successfully (send comission to owner)", async function () {
    await dao.addProposal(calldataComissionToOwner, acdm.address, "Send comission to owner" );
    await dao.connect(addr1).vote(5, false);
    await dao.connect(addr2).vote(5, true);
    await dao.connect(addr3).vote(5, true);
    await provider.send("evm_increaseTime", [86400]);
    await provider.send("evm_mine");
    await expect(dao.connect(addr1).finishProposal(5)).to.emit(dao, "ProposalFinishedSuccessfully").withArgs(5);

  }
  );

});
