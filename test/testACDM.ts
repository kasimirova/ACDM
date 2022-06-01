const { expect } = require("chai");
const { ethers, waffle} = require("hardhat");

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { Contract } from "ethers";
let ACDM : Contract, acdm : Contract,  ERC20 : Contract, erc20 : Contract, XXX : Contract, xxx : Contract;
let owner:SignerWithAddress, addr1:SignerWithAddress, addr2:SignerWithAddress, addr3:SignerWithAddress, addr4:SignerWithAddress, provider:any;

describe("ACDM", function () {
  before(async function () 
  {
    [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();
    ERC20 = await ethers.getContractFactory("ERC20");
    erc20 = await ERC20.deploy("Token2", "Tkn1", 6, ethers.utils.parseEther("1000000"));
    await erc20.deployed();

    XXX = await ethers.getContractFactory("ERC20");
    xxx = await XXX.deploy("XXXCoin", "XXX", 18, ethers.utils.parseEther("10000"));
    await xxx.deployed();

    ACDM = await ethers.getContractFactory("ACDMPlatform");
    acdm = await ACDM.deploy(erc20.address, xxx.address, 259200, 50, 30, 25, 25, 1000);
    await acdm.deployed();

    let MINTER_ROLE = await erc20.MINTER_ROLE();
    let BURNER_ROLE = await erc20.BURNER_ROLE();

    await erc20.grantRole(MINTER_ROLE, acdm.address);
    await erc20.grantRole(BURNER_ROLE, acdm.address);

    let DAO_ROLE = await acdm.DAO_ROLE();
    await acdm.grantRole(DAO_ROLE, owner.address);

    provider = waffle.provider;

  });

  

  it("Shouldn't register with not registered referrer", async function () {
    await expect(acdm.connect(addr1).register(addr2.address)).to.be.revertedWith("Referrer not regestered");
  }
  );

  it("Should register with registered referrer", async function () {
    await acdm.connect(addr1).register(owner.address);
    await acdm.connect(addr2).register(addr1.address);

  }
  );

  it("Shouldn't start trade round", async function () {
    await expect(acdm.connect(addr1).startTradeRound()).to.be.revertedWith("Sale round should start first");
  }
  );

  it("Should start sale round", async function () {
    await expect (acdm.connect(addr1).startSaleRound()).to.emit(acdm, "saleRoundStarted").withArgs(100000, ethers.utils.parseEther("0.00001"));
    expect(await erc20.balanceOf(acdm.address)).to.equal(100000);
  }
  );

  it("Shouldn't start sale round second time", async function () {
    await expect (acdm.connect(addr1).startSaleRound()).to.be.revertedWith("Sale round already started");
  }
  );

  it("Shouldn't buy acdm with not enough ether", async function () {
    await expect (acdm.connect(addr1).buyACDM(15, {value: ethers.utils.parseEther("0.0000015")})).to.be.revertedWith("Not enough ether");
  }
  );

  it("Should buy acdm with enough ether", async function () {
    await expect (acdm.connect(addr1).buyACDM(15000, {value: ethers.utils.parseEther("0.15")})).to.emit(acdm, "userBoughtTokens").withArgs(addr1.address, 15000);
    expect(await erc20.balanceOf(addr1.address)).to.equal(15000);
    //% to referrers

    await expect (acdm.connect(addr2).buyACDM(35000, {value: ethers.utils.parseEther("0.35")})).to.emit(acdm, "userBoughtTokens").withArgs(addr2.address, 35000);
    expect(await erc20.balanceOf(addr2.address)).to.equal(35000);

    await expect (acdm.connect(addr3).buyACDM(40000, {value: ethers.utils.parseEther("0.4")})).to.emit(acdm, "userBoughtTokens").withArgs(addr3.address, 40000);
    //% to contract
  }
  );

  it("Shouldn't call trade functions", async function () {
    await expect (acdm.connect(addr1).startTradeRound()).to.be.revertedWith("Sale round hasn't finished yet");
    await expect (acdm.connect(addr1).addOrder(700, ethers.utils.parseEther("0.001"))).to.be.revertedWith("You can't add order now, trade round hasn't been started yet");
    await expect (acdm.connect(addr1).removeOrder(0)).to.be.revertedWith("You can't remove order now, trade round hasn't been started yet");
    await expect (acdm.connect(addr1).redeemOrder(0, 300)).to.be.revertedWith("You can't redeem order now, trade round hasn't been started yet");
  }
  );

  it("Shouldn't buy more acdm than there's left", async function () {
    await expect (acdm.connect(addr4).buyACDM(11000, {value: ethers.utils.parseEther("0.11")})).to.be.revertedWith("Not enough tokens left");
  }
  );

  it("Should buy last tokens and start trade round", async function () {
    await acdm.connect(addr4).buyACDM(10000, {value: ethers.utils.parseEther("0.1")});
    await expect (acdm.connect(addr4).buyACDM(25000, {value: ethers.utils.parseEther("0.25")})).to.be.revertedWith("There's no token left, you can start trade round");
    await expect ( acdm.connect(addr4).startTradeRound()).to.emit(acdm, "tradeRoundStarted");
  }
  );

  it("Shouldn't buy tokens when round is over", async function () {
    await expect (acdm.connect(addr4).buyACDM(10000, {value: ethers.utils.parseEther("0.1")})).to.be.revertedWith("You can't buy tokens now, sale round hasn't been started yet");
  }
  );

  it("Shouldn't start trade round again", async function () {
    await expect (acdm.connect(addr4).startTradeRound()).to.be.revertedWith("Trade round has been already started");
  }
  );

  it("Shouldn't start sale round when trade round isn't finished", async function () {
    await expect (acdm.connect(addr4).startSaleRound()).to.be.revertedWith("Trade round hasn't been finished yet");
  }
  );

  it("Should add order", async function () {
    await erc20.connect(addr1).approve(acdm.address, 5000);
    await expect (acdm.connect(addr1).addOrder(5000, ethers.utils.parseEther("0.000134"))).to.emit(acdm, "userAddNewOrder").withArgs(addr1.address, 0, 5000, ethers.utils.parseEther("0.000134"));
    expect(await erc20.balanceOf(acdm.address)).to.equal(5000);
  }
  );

  it("Shouldn't remove and redeem non existing order", async function () {
    await expect (acdm.connect(addr1).removeOrder(1)).to.be.revertedWith("That order doesn't exist");
    await expect (acdm.connect(addr2).redeemOrder(1, 300)).to.be.revertedWith("That order doesn't exist");
  }
  );

  it("Shouldn't remove order if sender is not an owner of this order", async function () {
    await expect (acdm.connect(addr2).removeOrder(0)).to.be.revertedWith("Sender is not an owner of this order");
  }
  );

  it("Shouldn't redeem with not enough ether", async function () {
    await expect (acdm.connect(addr2).redeemOrder(0, 10, {value: ethers.utils.parseEther("0.0009")})).to.be.revertedWith("Not enough ether");
  }
  );

  it("Should redeem order", async function () {
    await expect (acdm.connect(addr2).redeemOrder(0, 1500, {value: ethers.utils.parseEther("0.201")})).to.emit(acdm, "userReedemOrder").withArgs(addr2.address, 0, 1500);
    // percent to referrers
    expect(await erc20.balanceOf(addr2.address)).to.equal(36500);

    await expect (acdm.connect(addr3).redeemOrder(0, 3500, {value: ethers.utils.parseEther("0.469")})).to.emit(acdm, "userReedemOrder").withArgs(addr3.address, 0, 3500);
    // percent to comm contract
    expect(await erc20.balanceOf(addr3.address)).to.equal(43500);
  }
  );

  it("Shouldn't redeem  and remove order when there's no tokens left", async function () {
    await expect (acdm.connect(addr3).redeemOrder(0, 3500, {value: ethers.utils.parseEther("0.469")})).to.be.revertedWith("There isn't enough token left");
    await expect (acdm.connect(addr1).removeOrder(0)).to.be.revertedWith("All tokens from order are already sold");
  }
  );

  it("Should add new order and redeem from it", async function () {
    await erc20.connect(addr3).approve(acdm.address, 14000);
    await expect (acdm.connect(addr3).addOrder(14000, ethers.utils.parseEther("0.000119"))).to.emit(acdm, "userAddNewOrder").withArgs(addr3.address, 1, 14000, ethers.utils.parseEther("0.000119"));
    expect(await erc20.balanceOf(addr3.address)).to.equal(29500);
    expect(await erc20.balanceOf(acdm.address)).to.equal(14000);

    await expect (acdm.connect(addr2).redeemOrder(1, 10000, {value: ethers.utils.parseEther("1.19")})).to.emit(acdm, "userReedemOrder").withArgs(addr2.address, 1, 10000);
    expect(await erc20.balanceOf(addr2.address)).to.equal(46500);
  }
  );

  it("Should remove order", async function () {
    await expect (acdm.connect(addr3).removeOrder(1)).to.emit(acdm, "userRemoveOrder").withArgs(1);
    expect(await erc20.balanceOf(addr3.address)).to.equal(33500);
  }
  );

  it("Shouldn't remove, add and redeem order when time is over", async function () {
    await erc20.connect(addr4).approve(acdm.address, 2500);
    await expect (acdm.connect(addr4).addOrder(2500, ethers.utils.parseEther("0.0003"))).to.emit(acdm, "userAddNewOrder").withArgs(addr4.address, 2, 2500, ethers.utils.parseEther("0.0003"));
    await provider.send("evm_increaseTime", [259201]);
    await expect (acdm.connect(addr3).addOrder(2500, ethers.utils.parseEther("0.0003"))).to.be.revertedWith("Time of trade's round is over");
    await expect (acdm.connect(addr4).removeOrder(2)).to.be.revertedWith("Time of trade's round is over");
    await expect (acdm.connect(addr4).redeemOrder(2, 4, {value: ethers.utils.parseEther("0.0012")})).to.be.revertedWith("Time of trade's round is over");
    
    await expect (acdm.connect(addr3).startSaleRound()).to.emit(acdm, "saleRoundStarted").withArgs(130069, ethers.utils.parseEther("0.0000143"));
    expect(await erc20.balanceOf(acdm.address)).to.equal(132569);
  }
  );

  it("Shouldn't buy ACDM when sale's time round is over", async function () {
    await provider.send("evm_increaseTime", [259201]);
    await expect (acdm.connect(addr1).buyACDM(3000)).to.be.revertedWith("Time of sale's round is over");
  }
  );

  it("Should set referrers percents", async function () {
    await acdm.connect(owner).setRerrersPercents(200, 260, 345, 300, 100);
    expect(await acdm.getFirstSaleRerrerPercents()).to.equal(200);
  }
  );

});
