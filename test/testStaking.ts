const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");


import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { Contract } from "ethers";
let Staking : Contract, staking : Contract, reward : Contract, lp : Contract, ERC20:Contract, DAO : Contract, dao : Contract, provider:any;
let owner:SignerWithAddress, addr1:SignerWithAddress;;

describe("Staking", function () {
  before(async function () 
  {
    ERC20 = await ethers.getContractFactory("ERC20");
    reward = await ERC20.deploy("Carrot", "Crt", 18, ethers.utils.parseEther("10000")); // reward token carrot
    lp = await ERC20.deploy("Cabbage", "Cbg", 18, ethers.utils.parseEther("10000")); // lp token
    await reward.deployed();
    await lp.deployed();

    Staking = await ethers.getContractFactory("Staking");
    staking = await Staking.deploy(lp.address, reward.address, 1800, 600, 20);
    await staking.deployed();

    [owner, addr1] = await ethers.getSigners();

    DAO = await ethers.getContractFactory("DAO");
    dao = await DAO.deploy(owner.address, staking.address, 5, 86400);//minQ, duration
    await dao.deployed();

    provider = waffle.provider;
  });

  it("Shouldn't add dao address as not an owner", async function () {
    await expect(staking.connect(addr1).addDaoAddress(dao.address)).to.be.revertedWith("Sender is not an owner");
  }
  );

  it("Stake", async function () {
    await staking.addDaoAddress(dao.address);
    await lp.transfer(addr1.address, ethers.utils.parseEther("500"));
    await lp.connect(addr1).approve(staking.address, ethers.utils.parseEther("80"));
    await staking.connect(addr1).stake(ethers.utils.parseEther("50"));
    expect(await lp.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("450"));
    expect(await lp.balanceOf(staking.address)).to.equal(ethers.utils.parseEther("50"));
    await provider.send("evm_increaseTime", [1210]);
    await provider.send("evm_mine");  
  }
  );

  it("Unstake", async function () {
    await expect(staking.connect(addr1).unstake()).to.be.revertedWith("It's too soon to unstake");
  }
  );

  it("Second stake", async function () {
    await staking.connect(addr1).stake(ethers.utils.parseEther("10"));
    //expect(await staking.getRewardDebt(addr1.address)).to.equal(ethers.utils.parseEther("20"));
    expect(await lp.balanceOf(staking.address)).to.equal(ethers.utils.parseEther("60"));  
  }
  );

  it("Claim", async function () {   
    await reward.transfer(staking.address, ethers.utils.parseEther("70"));
    await provider.send("evm_increaseTime", [1850]);
    await provider.send("evm_mine");
    await staking.connect(addr1).claim();
    expect(await reward.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("56"));  
    expect(await staking.getAmountofStakedTokens(addr1.address)).to.equal(ethers.utils.parseEther("60")); 
  }
  );
  
  it("Unstake", async function () {
    await staking.connect(addr1).unstake();
    expect(await lp.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("500"));
  }
  );

  it("Claim", async function () {   
    await reward.transfer(staking.address, ethers.utils.parseEther("70"));
    await provider.send("evm_increaseTime", [2400]);
    await provider.send("evm_mine");
    await staking.connect(addr1).claim();
    expect(await reward.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("56"));  
    expect(await staking.getAmountofStakedTokens(addr1.address)).to.equal(ethers.utils.parseEther("0")); 
  }
  );

  it("Stake", async function () {
    await staking.connect(addr1).stake(ethers.utils.parseEther("20"));
    expect(await lp.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("480"));
    expect(await lp.balanceOf(staking.address)).to.equal(ethers.utils.parseEther("20"));
    expect(await staking.getAmountofStakedTokens(addr1.address)).to.equal(ethers.utils.parseEther("20"));
    
    await provider.send("evm_increaseTime", [1810]);//+ 30 min 10 sec
    await provider.send("evm_mine");  
  }
  );

  it("Unstake", async function () {
    await staking.connect(addr1).unstake();
    expect(await lp.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("500"));
  }
  );

  it("Claim", async function () {   
    await staking.connect(addr1).claim();
    expect(await reward.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("68"));  
    expect(await staking.getAmountofStakedTokens(addr1.address)).to.equal(ethers.utils.parseEther("0")); 
  }
  );

  it("Unstake", async function () {
    await staking.connect(addr1).unstake();
    expect(await lp.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("500"));
  }
  );

});